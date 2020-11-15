const arima = require('arima')
const lodash = require('lodash')

class MultiVariableArima {
    constructor(
        ascendingHistoricalData,
        barsToPredict = 4,
    ) {
        this.barsToPredict = barsToPredict
        this.numberOfFeatureVariables = ascendingHistoricalData[0].length - 1
        this.positionOfTimeFeature = 0

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
    }

    predictNextBars() {
        const historicalTimeBars = this.historicalData.map(
            (currentFeatureTuple) => currentFeatureTuple[this.positionOfTimeFeature],
        )
        const barSize = Math.abs(historicalTimeBars[1] - historicalTimeBars[0])
        const mostRecentTimeBar = historicalTimeBars[historicalTimeBars.length - 1]

        const getFeatureByPosition = (
            historicalFeatureValues,
            featurePosition,
        ) => historicalFeatureValues.map(
            (currentFeatureTuple) => currentFeatureTuple.filter(
                (
                    currentElementInTuple, currentIndexInTuple,
                ) => currentIndexInTuple === featurePosition,
            ),
        )

        const allFeaturePredictions = []
        for (let index = 0; index < this.numberOfFeatureVariables; index += 1) {
            const [singleFeaturePredictions] = arima(
                getFeatureByPosition(this.historicalFeatureValues, index),
                this.barsToPredict,
                {
                    auto: false,
                    d: 0, // Number of times the series needs to be differenced
                    method: 0, // ARIMA method (Default: 0)
                    optimizer: 6, // Optimization method (Default: 6)
                    p: 1, // Number of Autoregressive coefficients
                    q: 1, // Number of Moving Average Coefficients
                    transpose: false,
                    verbose: true, // Output model analysis to console
                },
            )
            allFeaturePredictions.push(singleFeaturePredictions)
        }
        const predictedFeatureTuples = lodash.zip(...allFeaturePredictions)

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
}

module.exports = MultiVariableArima
