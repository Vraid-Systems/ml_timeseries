const tf = require('@tensorflow/tfjs-node')

class SingleVariableTimeSeriesModel {
    constructor(historicalData, trainingIterations = 30) {
        this.hiddenLayerNeurons = 8
        this.historicalData = historicalData
        this.learningRate = 0.01
        this.model = tf.sequential()
        this.outputMax = 0
        this.outputMin = 0
        this.trainingIterations = trainingIterations
        this.trainingSize = 0.5
    }

    async predict(data) {
        const normalizedPredictionTensor = this.model.predict(
            tf.tensor1d(data).reshape(
                [1, data.length, 1],
            ),
        )
        const problemRangePredictionTensor = normalizedPredictionTensor.mul(
            this.outputMax.sub(this.outputMin),
        ).add(this.outputMin)
        const problemRangePrediction = await problemRangePredictionTensor.data()
        return Array.from(problemRangePrediction)
    }

    async train(
        endOfTrainingIterationCallback = async (epoch, log) => {
            console.log(`Epoch ${epoch} has Loss of ${log.loss}`)
        },
    ) {
        const trainingData = this.historicalData.slice(
            0,
            Math.ceil(this.trainingSize * this.historicalData.length),
        )

        const trainingDataTime = trainingData.map(
            (timePriceTuple) => timePriceTuple[0],
        )
        const trainingTensorTime = tf.tensor1d(
            trainingDataTime,
        ).reshape(
            [1, trainingDataTime.length, 1],
        )
        const normalizedX = trainingTensorTime.sub(
            trainingTensorTime.min(),
        ).div(
            trainingTensorTime.max().sub(trainingTensorTime.min()),
        )

        const trainingDataPrice = trainingData.map(
            (timePriceTuple) => timePriceTuple[1],
        )
        const trainingTensorPrice = tf.tensor1d(
            trainingDataPrice,
        ).reshape(
            [1, trainingDataPrice.length, 1],
        )
        this.outputMax = trainingTensorPrice.max()
        this.outputMin = trainingTensorPrice.min()
        const normalizedY = trainingTensorPrice.sub(
            this.outputMin,
        ).div(
            this.outputMax.sub(this.outputMin),
        )

        this.model.add(tf.layers.lstm({
            inputShape: [trainingDataTime.length, 1],
            returnSequences: true,
            units: this.hiddenLayerNeurons,
        }))

        this.model.add(tf.layers.dense({
            units: 1,
        }))

        this.model.compile({
            loss: 'meanSquaredError',
            optimizer: tf.train.adam(this.learningRate),
        })

        const trainingHistory = await this.model.fit(
            normalizedX,
            normalizedY,
            {
                callbacks: {
                    onEpochEnd: endOfTrainingIterationCallback,
                },
                epochs: this.trainingIterations,
                stepsPerEpoch: 200,
                validationSteps: 50,
            },
        )

        return {
            model: this.model,
            trainingHistory,
        }
    }

    async validate() {
        const unseenTrainingData = this.historicalData.slice(
            Math.floor(this.trainingSize * this.historicalData.length),
            this.historicalData.length,
        )
        const unseenTrainingDataTime = unseenTrainingData.map(
            (timePriceTuple) => timePriceTuple[0],
        )
        return this.predict(unseenTrainingDataTime)
    }
}

module.exports = SingleVariableTimeSeriesModel
