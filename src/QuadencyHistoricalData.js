const axios = require('axios')
const ItervalEnum = require('./QuadencyIntervalEnum')

class QuadencyHistoricalData {
    constructor(intervalEnum = ItervalEnum.HOUR_1, evenNumberOfBarsBack = (24 * 5), pairsArray = ['BTC/USD']) {
        this.intervalEnum = intervalEnum
        this.evenNumberOfBarsBack = 2 * Math.round(evenNumberOfBarsBack / 2)
        this.pairsArray = pairsArray
    }

    async get() {
        // TODO down shift to lowest interval and get most recent bar for increased accuracy
        const pairsUrlParam = this.pairsArray.join(',').replace(/\//g, '%2F')
        const axiosResponse = await axios.get(`https://quadency.com/api/v1/public/prices/history/averages?bars=${this.evenNumberOfBarsBack}&interval=${this.intervalEnum.toString()}&pairs=${pairsUrlParam}`)
        return QuadencyHistoricalData.parseQuadencyNumerics(axiosResponse.data)
    }
}

QuadencyHistoricalData.parseQuadencyNumerics = (data) => Object.fromEntries(
    Object.entries(data).map(
        ([tradingPair, arrayOfTimeTuples]) => [
            tradingPair, arrayOfTimeTuples.map(
                (timePriceTuple) => [
                    Number.parseInt(timePriceTuple[0], 10),
                    Number.parseFloat(timePriceTuple[1]),
                ],
            ),
        ],
    ),
)

module.exports = QuadencyHistoricalData
