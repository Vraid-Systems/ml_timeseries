const arraySmooth = require('array-smooth')
const axios = require('axios')
const lodash = require('lodash')
const IntervalEnum = require('./QuadencyIntervalEnum')

class QuadencyHistoricalData {
    constructor(intervalEnum = IntervalEnum.HOUR_1, evenNumberOfBarsBack = (24 * 5), pairsArray = ['BTC/USD']) {
        this.evenNumberOfBarsBack = 2 * Math.round(evenNumberOfBarsBack / 2)
        this.intervalEnum = intervalEnum
        this.pairsArray = pairsArray
    }

    async get() {
        const pairsUrlParam = this.pairsArray.join(',').replace(/\//g, '%2F')

        const standardResponse = await axios.get(`https://quadency.com/api/v1/public/prices/history/averages?bars=${this.evenNumberOfBarsBack}&interval=${this.intervalEnum}&pairs=${pairsUrlParam}`)
        let historicalData = QuadencyHistoricalData.parseQuadencyNumerics(standardResponse.data)

        if (this.intervalEnum !== IntervalEnum.MINUTE_1) {
            const mostRecentPossibleResponse = await axios.get(`https://quadency.com/api/v1/public/prices/history/averages?bars=2&interval=${IntervalEnum.MINUTE_1}&pairs=${pairsUrlParam}`)
            const mostRecentPossibleHistoricalData = QuadencyHistoricalData.parseQuadencyNumerics(
                mostRecentPossibleResponse.data,
            )

            historicalData = QuadencyHistoricalData.append(
                mostRecentPossibleHistoricalData,
                historicalData,
            )
        }

        return QuadencyHistoricalData.smoothQuadencyNumerics(historicalData)
    }
}

QuadencyHistoricalData.append = (response1, response2) => {
    const tradingPairs1 = Object.keys(response1)
    const tradingPairs2 = Object.keys(response2)
    const uniqueTradingPairs = new Set(tradingPairs1.concat(tradingPairs2))

    const mergedResponse = {}
    uniqueTradingPairs.forEach((uniqueTradingPair) => {
        let mergedTradingPairValue = []
        const tradingPair1Value = lodash.get(response1, uniqueTradingPair, [])
        const tradingPair2Value = lodash.get(response2, uniqueTradingPair, [])
        if (tradingPair1Value) {
            mergedTradingPairValue = mergedTradingPairValue.concat(tradingPair1Value)
        }
        if (tradingPair2Value) {
            mergedTradingPairValue = mergedTradingPairValue.concat(tradingPair2Value)
        }
        mergedResponse[uniqueTradingPair] = mergedTradingPairValue
    })

    return mergedResponse
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
