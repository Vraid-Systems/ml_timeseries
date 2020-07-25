const lodash = require('lodash')
const ItervalEnum = require('./IntervalEnum')
const QuadencyHistoricalData = require('./QuadencyHistoricalData')
const SingleVariableTimeSeriesModel = require('./SingleVariableTimeSeriesModel')

const hoursIn6Months = 4380
const historicalData = new QuadencyHistoricalData(
    ItervalEnum.MINUTE_15, hoursIn6Months * 4, ['BTC/USD'],
)

const main = async () => {
    const rawHistoricalData = await historicalData.get()
    const parsedHistoricalData = QuadencyHistoricalData.parseQuadencyNumerics(rawHistoricalData)
    const btcUsdPairDataAscendingInTime = lodash.reverse(parsedHistoricalData['BTC/USD'])
    const timeSeriesModel = new SingleVariableTimeSeriesModel(
        btcUsdPairDataAscendingInTime, 20, 0.01, 500,
    )
    await timeSeriesModel.train()
    const predictedPrice = await timeSeriesModel.predictNextBars()

    for (let index = 0; index < timeSeriesModel.predictedTimes.length; index += 1) {
        const date = new Date(timeSeriesModel.predictedTimes[index])
        const price = predictedPrice[index]
        console.log(`At ${date.toISOString()} I predict the price will be ${price}`)
    }
}

main()
