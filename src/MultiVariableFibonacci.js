const lodash = require('lodash')

class MultiVariableFibonacci {
    constructor(ascendingHistoricalData) {
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

    calculate() {
        const fibonacciCalculation = []

        for (
            let featureVariableIndex = 0;
            featureVariableIndex < this.numberOfFeatureVariables;
            featureVariableIndex += 1
        ) {
            const featureValues = this.historicalFeatureValues.map(
                (currentFeatureTuple) => currentFeatureTuple[featureVariableIndex],
            )

            const trendingUp = (featureValues[featureValues.length - 1] - featureValues[0]) >= 0
            const priceMax = lodash.max(featureValues)
            const priceMin = lodash.min(featureValues)
            const diff = Math.abs(priceMax - priceMin)

            if (trendingUp) {
                const firstRetracement = priceMax - 0.236 * diff
                const secondRetracement = priceMax - 0.382 * diff
                const bottomWarning = priceMax - 0.618 * diff

                fibonacciCalculation.push([firstRetracement, secondRetracement, bottomWarning])
            } else {
                const firstExtension = priceMin + 0.618 * diff
                const secondExtension = priceMin + diff
                const topWarning = priceMin + 1.618 * diff

                fibonacciCalculation.push([firstExtension, secondExtension, topWarning])
            }
        }

        return fibonacciCalculation
    }
}

module.exports = MultiVariableFibonacci
