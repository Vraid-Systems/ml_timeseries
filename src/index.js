const lodash = require('lodash')
const ItervalEnum = require('./IntervalEnum')
const QuadencyHistoricalData = require('./QuadencyHistoricalData')
const SingleVariableTimeSeriesModel = require('./SingleVariableTimeSeriesModel')

const pairToInspect = 'BTC/USD'

const hoursInADay = 24
const hoursIn5Years = 43800
const historicalData = new QuadencyHistoricalData(
    ItervalEnum.MINUTE_15, hoursIn5Years * 4, [pairToInspect],
)

const main = async () => {
    const rawHistoricalData = await historicalData.get()
    const parsedHistoricalData = QuadencyHistoricalData.parseQuadencyNumerics(rawHistoricalData)
    const pairDataAscendingInTime = lodash.reverse(parsedHistoricalData[pairToInspect])
    const timeSeriesModel = new SingleVariableTimeSeriesModel(
        pairDataAscendingInTime, hoursInADay * 4, 0.001, 400,
    )
    await timeSeriesModel.train()
    const predicedNextBars = await timeSeriesModel.predictNextBars()

    for (let index = 0; index < predicedNextBars.length; index += 1) {
        const date = new Date(predicedNextBars[index].time)
        const price = predicedNextBars[index].value
        console.log(`At ${date.toISOString()} I predict the price will be ${price}`)
    }
}

main()
