const lodash = require('lodash')
const tf = require('@tensorflow/tfjs-node')

class SingleVariableTimeSeriesModel {
    constructor(
        ascendingHistoricalData,
        barsToPredict = 20,
        learningRate = 0.01,
        trainingIterations = 30,
    ) {
        this.barsToPredict = barsToPredict
        this.hiddenLayerNeurons = 8
        this.historicalData = ascendingHistoricalData
        this.learningRate = learningRate
        this.model = tf.sequential()
        this.outputMax = 0
        this.outputMin = 0
        this.predictedTimes = []
        this.trainingData = lodash.cloneDeep(this.historicalData).slice(
            0,
            this.historicalData.length - this.barsToPredict,
        )
        this.trainingIterations = trainingIterations
    }

    denormalizeBackToProblemSpace(normalizedPredictionTensor) {
        return normalizedPredictionTensor.mul(
            this.outputMax.sub(this.outputMin),
        ).add(this.outputMin)
    }

    getNormalizedAndShuffledTrainingTensors() {
        tf.util.shuffle(this.trainingData)

        const trainingDataTime = this.trainingData.map(
            (timePriceTuple) => timePriceTuple[0],
        )
        const trainingTensorTime = tf.tensor1d(
            trainingDataTime,
        ).reshape(
            [1, this.trainingData.length, 1],
        )
        const normalizedX = trainingTensorTime.sub(
            trainingTensorTime.min(),
        ).div(
            trainingTensorTime.max().sub(trainingTensorTime.min()),
        )

        const trainingDataPrice = this.trainingData.map(
            (timePriceTuple) => timePriceTuple[1],
        )
        const trainingTensorPrice = tf.tensor1d(
            trainingDataPrice,
        ).reshape(
            [1, this.trainingData.length, 1],
        )
        this.outputMax = trainingTensorPrice.max()
        this.outputMin = trainingTensorPrice.min()
        const normalizedY = trainingTensorPrice.sub(
            this.outputMin,
        ).div(
            this.outputMax.sub(this.outputMin),
        )

        return [normalizedX, normalizedY]
    }

    async predict(data) {
        const normalizedPredictionTensor = this.model.predict(
            tf.tensor1d(data).reshape(
                [1, data.length, 1],
            ),
        )
        const problemRangePredictionTensor = this.denormalizeBackToProblemSpace(
            normalizedPredictionTensor,
        )
        const problemRangePrediction = await problemRangePredictionTensor.data()
        return Array.from(problemRangePrediction)
    }

    async predictNextBars() {
        const historicalTimeBars = this.historicalData.map(
            (timePriceTuple) => timePriceTuple[0],
        )
        const barSize = Math.abs(historicalTimeBars[1] - historicalTimeBars[0])
        const mostRecentTimeBar = historicalTimeBars[historicalTimeBars.length - 1]
        const nextTimeBarsToPredict = []
        for (let nextBarNumber = 1; nextBarNumber <= this.barsToPredict; nextBarNumber += 1) {
            const nextTimeBar = mostRecentTimeBar + (barSize * nextBarNumber)
            nextTimeBarsToPredict.push(nextTimeBar)
        }

        const correctlyShapedTimesToPredict = this.historicalData.slice(
            this.barsToPredict * 2,
            this.historicalData.length,
        ).map(
            (timePriceTuple) => timePriceTuple[0],
        )

        correctlyShapedTimesToPredict.push(...nextTimeBarsToPredict)
        this.predictedTimes = nextTimeBarsToPredict

        const predictedValues = await this.predict(correctlyShapedTimesToPredict)
        return predictedValues.slice(-this.barsToPredict)
    }

    async train(
        endOfTrainingIterationCallback = async (epoch, log) => {
            console.log(`Epoch ${epoch} has Loss of ${log.loss}`)
        },
    ) {
        this.model.add(tf.layers.lstm({
            inputShape: [(this.historicalData.length - this.barsToPredict), 1],
            returnSequences: true,
            units: this.hiddenLayerNeurons,
            useBias: true,
        }))

        this.model.add(tf.layers.dense({
            units: 1,
            useBias: true,
        }))

        this.model.compile({
            loss: 'meanSquaredError',
            optimizer: tf.train.adam(this.learningRate),
        })

        let [tensorX, tensorY] = this.getNormalizedAndShuffledTrainingTensors()
        const trainingHistory = await this.model.fit(
            tensorX,
            tensorY,
            {
                callbacks: {
                    onEpochBegin: () => {
                        [tensorX, tensorY] = this.getNormalizedAndShuffledTrainingTensors()
                    },
                    onEpochEnd: endOfTrainingIterationCallback,
                },
                epochs: this.trainingIterations,
            },
        )

        return {
            model: this.model,
            trainingHistory,
        }
    }

    async validate() {
        const someUnseenTrainingData = this.historicalData.slice(
            this.barsToPredict,
            this.historicalData.length,
        )
        const unseenTimeTrainingData = someUnseenTrainingData.map(
            (timePriceTuple) => timePriceTuple[0],
        )
        return this.predict(unseenTimeTrainingData)
    }
}

module.exports = SingleVariableTimeSeriesModel
