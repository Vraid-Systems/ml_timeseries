const arraySmooth = require('array-smooth')
const axios = require('axios')
const lodash = require('lodash')
const ItervalEnum = require('./YahooFinanceIntervalEnum')
const RangeEnum = require('./YahooFinanceRangeEnum')

class YahooFinanceHistoricalData {
    constructor(intervalEnum = ItervalEnum.HOUR_1, rangeEnum = RangeEnum.MONTH_3, tickerSymbol = 'QQQ') {
        this.intervalEnum = intervalEnum
        this.rangeEnum = rangeEnum
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
    const minimumMillisBarLength = Math.min(
        Math.abs(secondsFromUnixEpochTimestamps[12] - secondsFromUnixEpochTimestamps[11]),
        Math.abs(secondsFromUnixEpochTimestamps[3] - secondsFromUnixEpochTimestamps[2]),
        Math.abs(secondsFromUnixEpochTimestamps[2] - secondsFromUnixEpochTimestamps[1]),
        Math.abs(secondsFromUnixEpochTimestamps[1] - secondsFromUnixEpochTimestamps[0]),
    ) * 1000

    const candleClosePrices = arraySmooth(featureObj.indicators.quote[0].close, 21)

    const currentTimestamp = new Date().getTime()

    for (
        let index = 0;
        index < candleClosePrices.length;
        index += 1
    ) {
        featureTuples.push([
            currentTimestamp - (index * minimumMillisBarLength),
            candleClosePrices[candleClosePrices.length - 1 - index],
        ])
    }

    return lodash.reverse(featureTuples)
}

module.exports = YahooFinanceHistoricalData
