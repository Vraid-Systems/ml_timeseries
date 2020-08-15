const axios = require('axios')
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
        let historicalData = YahooFinanceHistoricalData.processIntoFeatures(standardResponse.data)

        if (this.intervalEnum !== this.smallestIntervalEnum) {
            const mostRecentPossibleResponse = await axios.get(`https://query1.finance.yahoo.com/v7/finance/chart/${this.tickerSymbol}?interval=${this.smallestIntervalEnum}&range=${this.smallestIntervalEnum}`)
            const mostRecentPossibleHistoricalData = YahooFinanceHistoricalData.processIntoFeatures(
                mostRecentPossibleResponse.data,
            )
            historicalData = historicalData.concat(mostRecentPossibleHistoricalData)
        }

        return historicalData
    }
}

YahooFinanceHistoricalData.processIntoFeatures = (data) => {
    const featureTuples = []

    const featureObj = data.chart.result[0]
    const secondsFromUnixEpochTimestamps = featureObj.timestamp
    const candleClosePrices = featureObj.indicators.quote[0].close
    const candleVolumes = featureObj.indicators.quote[0].volume

    for (let index = 0; index < secondsFromUnixEpochTimestamps.length; index += 1) {
        featureTuples.push([
            secondsFromUnixEpochTimestamps[index] * 1000,
            candleClosePrices[index],
            candleVolumes[index],
        ])
    }

    return featureTuples
}

module.exports = YahooFinanceHistoricalData
