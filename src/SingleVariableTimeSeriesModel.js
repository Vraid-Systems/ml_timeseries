const lodash = require('lodash')
const tf = require('@tensorflow/tfjs-node')

class SingleVariableTimeSeriesModel {
    constructor(
        ascendingHistoricalData,
        barsToPredict = 8,
        learningRate = 0.001,
        trainingIterations = 30,
    ) {
        this.barsToPredict = barsToPredict
        this.historicalData = ascendingHistoricalData
        this.learningLookBack = 1
        this.learningRate = learningRate
        this.lstmNeuronFactor = 4
        this.model = tf.sequential()
        this.numberOfBarsToBasePredictionOn = this.barsToPredict * 4
        this.outputMax = 0
        this.outputMin = 0
        this.numberOfSplits = Math.floor(
            (
                this.historicalData.length - this.learningLookBack
            ) / this.numberOfBarsToBasePredictionOn,
        )
        this.splitTrainingDataLength = this.numberOfSplits * this.numberOfBarsToBasePredictionOn
        this.trainingData = lodash.cloneDeep(this.historicalData)
        this.trainingIterations = trainingIterations
    }

    denormalizeBackToProblemSpace(normalizedPredictionTensor) {
        return normalizedPredictionTensor.mul(
            this.outputMax.sub(this.outputMin),
        ).add(this.outputMin)
    }

    getNormalizedTrainingTensors() {
        const trainingDataPrice = this.trainingData.map(
            (timePriceTuple) => timePriceTuple[1],
        )
        const trainingTensorPrice = tf.tensor1d(
            trainingDataPrice,
        ).reshape(
            [1, trainingDataPrice.length, 1],
        )
        this.outputMax = trainingTensorPrice.max()
        this.outputMin = trainingTensorPrice.min()

        const trainingTensorPriceX = tf.stack(
            tf.split(
                tf.tensor1d(
                    trainingDataPrice.slice(
                        0,
                        this.splitTrainingDataLength,
                    ),
                ),
                this.numberOfSplits,
            ),
        ).reshape(
            [this.numberOfSplits, this.numberOfBarsToBasePredictionOn, 1],
        )
        const normalizedX = trainingTensorPriceX.sub(
            this.outputMin,
        ).div(
            this.outputMax.sub(this.outputMin),
        )

        const trainingTensorPriceY = tf.stack(
            tf.split(
                tf.tensor1d(
                    trainingDataPrice.slice(
                        this.learningLookBack,
                        this.splitTrainingDataLength + this.learningLookBack,
                    ),
                ),
                this.numberOfSplits,
            ),
        ).reshape(
            [this.numberOfSplits, this.numberOfBarsToBasePredictionOn, 1],
        )
        const normalizedY = trainingTensorPriceY.sub(
            this.outputMin,
        ).div(
            this.outputMax.sub(this.outputMin),
        )

        return [normalizedX, normalizedY]
    }

    async predict(data) {
        const predictionInputTensor = tf.tensor1d(data).reshape(
            [1, data.length, 1],
        )

        const normalizedPredictionResultTensor = this.model.predict(
            predictionInputTensor,
        )
        const problemRangePredictionTensor = this.denormalizeBackToProblemSpace(
            normalizedPredictionResultTensor,
        )
        const problemRangePrediction = await problemRangePredictionTensor.data()
        return Array.from(problemRangePrediction)[0]
    }

    async predictNextBars() {
        const historicalTimeBars = this.historicalData.map(
            (timePriceTuple) => timePriceTuple[0],
        )
        const barSize = Math.abs(historicalTimeBars[1] - historicalTimeBars[0])
        const mostRecentTimeBar = historicalTimeBars[historicalTimeBars.length - 1]

        const historicalValues = this.historicalData.map(
            (timePriceTuple) => timePriceTuple[1],
        )
        const mostRecentValues = historicalValues.slice(
            historicalValues.length - this.numberOfBarsToBasePredictionOn,
            historicalValues.length,
        )

        const timesToPredict = []
        for (let nextBarNumber = 1; nextBarNumber <= this.barsToPredict; nextBarNumber += 1) {
            const nextTimeBar = mostRecentTimeBar + (barSize * nextBarNumber)
            timesToPredict.push(nextTimeBar)

            // eslint-disable-next-line no-await-in-loop
            const mostRecentValue = await this.predict(mostRecentValues)
            mostRecentValues.push(mostRecentValue)
            mostRecentValues.shift()
        }

        const predictedNextBars = []
        for (let index = 0; index < timesToPredict.length; index += 1) {
            predictedNextBars.push({
                time: timesToPredict[index],
                value: mostRecentValues[index],
            })
        }

        return predictedNextBars
    }

    async train() {
        this.model.add(tf.layers.lstm({
            inputShape: [this.numberOfBarsToBasePredictionOn, 1],
            returnSequences: true,
            units: this.lstmNeuronFactor,
        }))

        this.model.add(tf.layers.dense({
            units: 1,
        }))

        this.model.compile({
            loss: 'meanSquaredError',
            optimizer: tf.train.adam(this.learningRate),
        })

        const [tensorX, tensorY] = this.getNormalizedTrainingTensors()
        const trainingHistory = await this.model.fit(
            tensorX,
            tensorY,
            {
                batchSize: 32,
                epochs: this.trainingIterations,
                shuffle: true,
                validationSplit: 0.2,
                verbose: 1,
            },
        )

        return {
            model: this.model,
            trainingHistory,
        }
    }
}

module.exports = SingleVariableTimeSeriesModel
