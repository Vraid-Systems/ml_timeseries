const axios = require('axios')
const ItervalEnum = require('./IntervalEnum')

class HistoricalData {
    constructor(intervalEnum = ItervalEnum.HOUR_1, numberOfBarsBack = (24 * 5), pairsArray = ['BTC/USD']) {
        this.intervalEnum = intervalEnum
        this.numberOfBarsBack = numberOfBarsBack
        this.pairsArray = pairsArray
    }

    async get() {
        const pairsUrlParam = this.pairsArray.join(',').replace(/\//g, '%2F')
        const axiosResponse = await axios.get(`https://quadency.com/api/v1/public/prices/history/averages?bars=${this.numberOfBarsBack}&interval=${this.intervalEnum.toString()}&pairs=${pairsUrlParam}`)
        return axiosResponse.data
    }
}

module.exports = HistoricalData
