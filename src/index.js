const lodash = require('lodash')
const MultiVariableTimeSeriesModel = require('./MultiVariableTimeSeriesModel')
const QuadencyHistoricalData = require('./QuadencyHistoricalData')
const QuadencyItervalEnum = require('./QuadencyIntervalEnum')
const YahooFinanceHistoricalData = require('./YahooFinanceHistoricalData')
const YahooFinanceIntervalEnum = require('./YahooFinanceIntervalEnum')
const YahooFinanceRangeEnum = require('./YahooFinanceRangeEnum')

const predictBTC = async () => {
    const pairToInspect = 'BTC/USD'
    const hoursInADay = 24
    const hoursIn5Years = 43800
    const quadencyHistoricalData = new QuadencyHistoricalData(
        QuadencyItervalEnum.MINUTE_15, hoursIn5Years * 4, [pairToInspect],
    )

    const historicalData = await quadencyHistoricalData.get()
    const pairDataAscendingInTime = lodash.reverse(historicalData[pairToInspect])
    const timeSeriesModel = new MultiVariableTimeSeriesModel(
        pairDataAscendingInTime, hoursInADay * 4, 0.001, 130,
    )
    await timeSeriesModel.train()
    const predictedNextBars = await timeSeriesModel.predictNextBars()

    for (let index = 0; index < predictedNextBars.length; index += 1) {
        const date = new Date(predictedNextBars[index].time)
        const price = predictedNextBars[index].value
        console.log(`At ${date.toISOString()} I predict the price will be ${price}`)
    }
}

const predictTicker = async (tickerSymbol) => {
    const yahooFinanceHistoricalData = new YahooFinanceHistoricalData(
        YahooFinanceIntervalEnum.DAY_1,
        YahooFinanceRangeEnum.MAX,
        tickerSymbol,
    )
    const historicalData = await yahooFinanceHistoricalData.get()
    const historicalFeatures = YahooFinanceHistoricalData.processIntoFeatures(historicalData)
    const timeSeriesModel = new MultiVariableTimeSeriesModel(
        historicalFeatures, 30, 0.001, 30,
    )
    await timeSeriesModel.train()
    const predictedNextBars = await timeSeriesModel.predictNextBars()

    for (let index = 0; index < predictedNextBars.length; index += 1) {
        const date = new Date(predictedNextBars[index].time)
        const price = predictedNextBars[index].features[0]
        console.log(`At ${date.toISOString()} I predict the price will be ${price}`)
    }
}

const predictESS = () => predictTicker('ESS')

const predictMRK = () => predictTicker('MRK')

predictBTC()
predictESS()
predictMRK()
