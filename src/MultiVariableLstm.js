const lodash = require('lodash')
const tf = require('@tensorflow/tfjs-node')

class MultiVariableLstm {
    constructor(
        ascendingHistoricalData,
        barsToPredict = 4,
        learningRate = 0.001,
        trainingIterations = 25,
    ) {
        this.barsToPredict = barsToPredict
        this.learningLookBack = 1
        this.learningRate = learningRate
        this.model = tf.sequential()
        this.normalizationInputMax = 0
        this.normalizationInputMin = 0
        this.normalizationOutputMax = 0
        this.normalizationOutputMin = 0
        this.numberOfFeatureVariables = ascendingHistoricalData[0].length - 1
        this.positionOfTimeFeature = 0
        this.trainingIterations = trainingIterations

        this.historicalData = ascendingHistoricalData.filter(
            (currentElement) => (currentElement.length - 1) === this.numberOfFeatureVariables,
        )
        this.historicalFeatureValues = this.historicalData.map(
            (currentFeatureTuple) => currentFeatureTuple.filter(
                (
                    currentElementInTuple, currentIndexInTuple,
                ) => currentIndexInTuple !== this.positionOfTimeFeature,
            ),
        )

        this.numberOfSplits = Math.floor(
            (
                this.historicalData.length - this.learningLookBack
            ) / this.barsToPredict,
        )
        this.splitTrainingDataLength = this.numberOfSplits * this.barsToPredict
        this.trainingData = lodash.cloneDeep(this.historicalData)
    }

    getNormalizedTrainingTensors() {
        const filteredTrainingData = this.trainingData.map(
            (currentFeatureTuple) => currentFeatureTuple.filter(
                (
                    currentElementInTuple, currentIndexInTuple,
                ) => currentIndexInTuple !== this.positionOfTimeFeature,
            ),
        )

        const trainingTensorX = tf.stack(
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
                this.barsToPredict,
                this.numberOfFeatureVariables,
            ],
        )

        const trainingTensorY = tf.stack(
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
                this.barsToPredict,
                this.numberOfFeatureVariables,
            ],
        )

        this.normalizationInputMax = trainingTensorX.max()
        this.normalizationInputMin = trainingTensorX.min()
        this.normalizationOutputMax = trainingTensorY.max()
        this.normalizationOutputMin = trainingTensorY.min()

        const normalizedTensorX = trainingTensorX.sub(
            this.normalizationInputMin,
        ).div(this.normalizationInputMax.sub(this.normalizationInputMin))
        const normalizedTensorY = trainingTensorY.sub(
            this.normalizationOutputMin,
        ).div(this.normalizationOutputMax.sub(this.normalizationOutputMin))

        return [normalizedTensorX, normalizedTensorY]
    }

    async predict(data) {
        const predictionInputTensor = tf.tensor(data).reshape(
            [1, data.length, data[0].length],
        )

        const normalizedPredictionTensor = this.model.predict(
            predictionInputTensor,
        )

        const problemRangePredictionTensor = normalizedPredictionTensor.mul(
            this.normalizationOutputMax.sub(this.normalizationOutputMin),
        ).add(this.normalizationOutputMin)

        const problemRangePrediction = await problemRangePredictionTensor.array()
        return problemRangePrediction[0]
    }

    async predictNextBars() {
        const historicalTimeBars = this.historicalData.map(
            (currentFeatureTuple) => currentFeatureTuple[this.positionOfTimeFeature],
        )
        const barSize = Math.abs(historicalTimeBars[1] - historicalTimeBars[0])
        const mostRecentTimeBar = historicalTimeBars[historicalTimeBars.length - 1]

        const featureTuplesToPredictFrom = this.historicalFeatureValues.slice(
            this.historicalFeatureValues.length - this.barsToPredict,
            this.historicalFeatureValues.length,
        )

        const predictedFeatureTuples = await this.predict(featureTuplesToPredictFrom)

        const predictedNextBars = []
        for (let index = 0; index < this.barsToPredict; index += 1) {
            const nextBarNumber = index + 1
            predictedNextBars.push({
                time: mostRecentTimeBar + (barSize * nextBarNumber),
                features: predictedFeatureTuples[index],
            })
        }

        return predictedNextBars
    }

    async train() {
        this.model.add(tf.layers.lstm({
            inputShape: [this.barsToPredict, this.numberOfFeatureVariables],
            returnSequences: true,
            units: 128,
        }))

        this.model.add(tf.layers.lstm({
            returnSequences: true,
            units: 128,
        }))

        this.model.add(tf.layers.lstm({
            returnSequences: true,
            units: 128,
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
                shuffle: false, // time series order matters!
                validationSplit: 0.3,
                verbose: 1,
            },
        )

        return {
            model: this.model,
            trainingHistory,
        }
    }
}

module.exports = MultiVariableLstm
