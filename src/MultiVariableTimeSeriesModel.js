const lodash = require('lodash')
const tf = require('@tensorflow/tfjs-node')

class MultiVariableTimeSeriesModel {
    constructor(
        ascendingHistoricalData,
        barsToPredict = 8,
        learningRate = 0.001,
        trainingIterations = 30,
    ) {
        this.barsToPredict = barsToPredict
        this.learningLookBack = 1
        this.learningRate = learningRate
        this.lstmNeuronFactor = 4
        this.model = tf.sequential()
        this.numberOfBarsToBasePredictionOn = this.barsToPredict * 4
        this.numberOfFeatureVariables = ascendingHistoricalData[0].length - 1
        this.outputMax = 0
        this.outputMin = 0
        this.positionOfTimeFeature = 0
        this.trainingIterations = trainingIterations

        this.historicalData = ascendingHistoricalData.filter(
            (currentElement) => (currentElement.length - 1) === this.numberOfFeatureVariables,
        )
        this.numberOfSplits = Math.floor(
            (
                this.historicalData.length - this.learningLookBack
            ) / this.numberOfBarsToBasePredictionOn,
        )
        this.splitTrainingDataLength = this.numberOfSplits * this.numberOfBarsToBasePredictionOn
        this.trainingData = lodash.cloneDeep(this.historicalData)
    }

    denormalizeBackToProblemSpace(normalizedPredictionTensor) {
        return normalizedPredictionTensor.mul(
            this.outputMax.sub(this.outputMin),
        ).add(this.outputMin)
    }

    getNormalizedTrainingTensors() {
        const filteredTrainingData = this.trainingData.map(
            (currentFeatureTuple) => currentFeatureTuple.filter(
                (
                    currentElementInTuple, currentIndexInTuple,
                ) => currentIndexInTuple !== this.positionOfTimeFeature,
            ),
        )
        const trainingFeaturesTensor = tf.tensor(filteredTrainingData)
        this.outputMax = trainingFeaturesTensor.max()
        this.outputMin = trainingFeaturesTensor.min()

        const trainingTensorPriceX = tf.stack(
            tf.split(
                tf.tensor2d(
                    filteredTrainingData.slice(
                        0,
                        this.splitTrainingDataLength,
                    ),
                ),
                this.numberOfSplits,
                0,
            ),
        ).reshape(
            [
                this.numberOfSplits,
                this.numberOfBarsToBasePredictionOn,
                this.numberOfFeatureVariables,
            ],
        )
        const normalizedX = trainingTensorPriceX.sub(
            this.outputMin,
        ).div(
            this.outputMax.sub(this.outputMin),
        )

        const trainingTensorPriceY = tf.stack(
            tf.split(
                tf.tensor2d(
                    filteredTrainingData.slice(
                        this.learningLookBack,
                        this.splitTrainingDataLength + this.learningLookBack,
                    ),
                ),
                this.numberOfSplits,
                0,
            ),
        ).reshape(
            [
                this.numberOfSplits,
                this.numberOfBarsToBasePredictionOn,
                this.numberOfFeatureVariables,
            ],
        )
        const normalizedY = trainingTensorPriceY.sub(
            this.outputMin,
        ).div(
            this.outputMax.sub(this.outputMin),
        )

        return [normalizedX, normalizedY]
    }

    async predict(data) {
        const predictionInputTensor = tf.tensor(data).reshape(
            [1, data.length, data[0].length],
        )

        const normalizedPredictionResultTensor = this.model.predict(
            predictionInputTensor,
        )
        const problemRangePredictionTensor = this.denormalizeBackToProblemSpace(
            normalizedPredictionResultTensor,
        )
        const problemRangePrediction = await problemRangePredictionTensor.array()
        return problemRangePrediction[0][0]
    }

    async predictNextBars() {
        const historicalTimeBars = this.historicalData.map(
            (currentFeatureTuple) => currentFeatureTuple[this.positionOfTimeFeature],
        )
        const barSize = Math.abs(historicalTimeBars[1] - historicalTimeBars[0])
        const mostRecentTimeBar = historicalTimeBars[historicalTimeBars.length - 1]

        const historicalFeatureValues = this.historicalData.map(
            (currentFeatureTuple) => currentFeatureTuple.filter(
                (
                    currentElementInTuple, currentIndexInTuple,
                ) => currentIndexInTuple !== this.positionOfTimeFeature,
            ),
        )
        const mostRecentValues = historicalFeatureValues.slice(
            historicalFeatureValues.length - this.numberOfBarsToBasePredictionOn,
            historicalFeatureValues.length,
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
                features: mostRecentValues[index],
            })
        }

        return predictedNextBars
    }

    async train() {
        this.model.add(tf.layers.lstm({
            inputShape: [this.numberOfBarsToBasePredictionOn, this.numberOfFeatureVariables],
            returnSequences: true,
            units: this.lstmNeuronFactor,
        }))

        this.model.add(tf.layers.lstm({
            returnSequences: true,
            units: this.lstmNeuronFactor,
        }))

        this.model.add(tf.layers.dense({
            units: this.numberOfFeatureVariables,
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
                verbose: 0,
            },
        )

        return {
            model: this.model,
            trainingHistory,
        }
    }
}

module.exports = MultiVariableTimeSeriesModel
