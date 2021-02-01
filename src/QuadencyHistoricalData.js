const arraySmooth = require('array-smooth')
const axios = require('axios')
const ItervalEnum = require('./QuadencyIntervalEnum')

class QuadencyHistoricalData {
    constructor(intervalEnum = ItervalEnum.HOUR_1, evenNumberOfBarsBack = (24 * 5), pairsArray = ['BTC/USD']) {
        this.evenNumberOfBarsBack = 2 * Math.round(evenNumberOfBarsBack / 2)
        this.intervalEnum = intervalEnum
        this.pairsArray = pairsArray
    }

    async get() {
        const pairsUrlParam = this.pairsArray.join(',').replace(/\//g, '%2F')

        const standardResponse = await axios.get(`https://quadency.com/api/v1/public/prices/history/averages?bars=${this.evenNumberOfBarsBack}&interval=${this.intervalEnum}&pairs=${pairsUrlParam}`)
        const historicalData = QuadencyHistoricalData.parseQuadencyNumerics(standardResponse.data)

        return QuadencyHistoricalData.smoothQuadencyNumerics(historicalData)
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

QuadencyHistoricalData.smoothQuadencyNumerics = (data) => {
    const smoothedPricesForTradingPair = {}
    Object.keys(data).forEach((tradingPair) => {
        smoothedPricesForTradingPair[tradingPair] = arraySmooth(
            data[tradingPair],
            16,
            (timePriceTuple) => timePriceTuple[1],
        )
    })

    return Object.fromEntries(
        Object.entries(data).map(
            ([tradingPair, arrayOfTimeTuples]) => [
                tradingPair, arrayOfTimeTuples.map(
                    (timePriceTuple, index) => [
                        timePriceTuple[0],
                        smoothedPricesForTradingPair[tradingPair][index],
                    ],
                ),
            ],
        ),
    )
}

module.exports = QuadencyHistoricalData
