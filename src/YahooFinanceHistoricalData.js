const arraySmooth = require('array-smooth')
const axios = require('axios')
const lodash = require('lodash')
const ItervalEnum = require('./YahooFinanceIntervalEnum')
const RangeEnum = require('./YahooFinanceRangeEnum')

class YahooFinanceHistoricalData {
    constructor(intervalEnum = ItervalEnum.HOUR_1, rangeEnum = RangeEnum.MONTH_3, tickerSymbol = 'QQQ') {
        this.intervalEnum = intervalEnum
        this.rangeEnum = rangeEnum
        this.smallestIntervalEnum = ItervalEnum.MINUTE_1
        this.tickerSymbol = tickerSymbol
    }

    async get() {
        const standardResponse = await axios.get(`https://query1.finance.yahoo.com/v7/finance/chart/${this.tickerSymbol}?interval=${this.intervalEnum}&range=${this.rangeEnum}`)
        return YahooFinanceHistoricalData.processIntoFeatures(standardResponse.data)
    }
}

YahooFinanceHistoricalData.processIntoFeatures = (data) => {
    const featureTuples = []

    const featureObj = data.chart.result[0]
    const secondsFromUnixEpochTimestamps = featureObj.timestamp
    const candleClosePrices = arraySmooth(featureObj.indicators.quote[0].close, 4)
    const candleVolumes = featureObj.indicators.quote[0].volume
    const averageCandleVolume = Math.floor(
        lodash.reduce(
            candleVolumes,
            (runningSum, currentValue) => runningSum + (currentValue || 0),
            0,
        ) / candleVolumes.length,
    )

    for (let index = 0; index < secondsFromUnixEpochTimestamps.length; index += 1) {
        if (!candleVolumes[index]) {
            // eslint-disable-next-line prefer-destructuring
            candleVolumes[index] = averageCandleVolume
        }

        featureTuples.push([
            secondsFromUnixEpochTimestamps[index] * 1000,
            candleClosePrices[index],
            candleVolumes[index],
        ])
    }

    return featureTuples
}

module.exports = YahooFinanceHistoricalData
