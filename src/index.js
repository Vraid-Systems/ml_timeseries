const lodash = require('lodash')
const ItervalEnum = require('./IntervalEnum')
const MultiVariableTimeSeriesModel = require('./MultiVariableTimeSeriesModel')
const QuadencyHistoricalData = require('./QuadencyHistoricalData')

const pairToInspect = 'BTC/USD'

const hoursInADay = 24
const hoursIn5Years = 43800
const quadencyHistoricalData = new QuadencyHistoricalData(
    ItervalEnum.MINUTE_15, hoursIn5Years * 4, [pairToInspect],
)

const main = async () => {
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

main()
