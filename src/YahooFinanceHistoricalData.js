const axios = require('axios')
const ItervalEnum = require('./YahooFinanceIntervalEnum')
const RangeEnum = require('./YahooFinanceRangeEnum')

class YahooFinanceHistoricalData {
    constructor(intervalEnum = ItervalEnum.HOUR_1, rangeEnum = RangeEnum.MONTH_3, tickerSymbol = 'QQQ') {
        this.intervalEnum = intervalEnum
        this.rangeEnum = rangeEnum
        this.tickerSymbol = tickerSymbol
    }

    async get() {
        const axiosResponse = await axios.get(`https://query1.finance.yahoo.com/v7/finance/chart/${this.tickerSymbol}?interval=${this.intervalEnum}&range=${this.rangeEnum}`)
        return axiosResponse.data
    }
}

YahooFinanceHistoricalData.processIntoFeatures = (data) => {
    const featureTuples = []

    const featureObj = data.chart.result[0]
    const millisFromUnixEpochTimestamps = featureObj.timestamp
    const candleClosePrices = featureObj.indicators.quote[0].close
    const candleVolumes = featureObj.indicators.quote[0].volume

    for (let index = 0; index < millisFromUnixEpochTimestamps.length; index += 1) {
        featureTuples.push([
            millisFromUnixEpochTimestamps[index],
            candleClosePrices[index],
            candleVolumes[index],
        ])
    }

    return featureTuples
}

module.exports = YahooFinanceHistoricalData