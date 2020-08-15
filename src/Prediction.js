const cron = require('node-cron')
const fs = require('fs')
const lodash = require('lodash')
const MultiVariableTimeSeriesModel = require('./MultiVariableTimeSeriesModel')
const QuadencyHistoricalData = require('./QuadencyHistoricalData')
const QuadencyItervalEnum = require('./QuadencyIntervalEnum')
const YahooFinanceHistoricalData = require('./YahooFinanceHistoricalData')
const YahooFinanceIntervalEnum = require('./YahooFinanceIntervalEnum')
const YahooFinanceRangeEnum = require('./YahooFinanceRangeEnum')

class Prediction {
    constructor(predictionCommand = '', predictionsPath = '/tmp/ml_trader/predictions') {
        const predictionCommandParts = predictionCommand.split(':')
        this.fileSystemAvailable = true
        this.prediction = []
        this.predictionsPath = predictionsPath
        // eslint-disable-next-line prefer-destructuring
        this.predictionType = predictionCommandParts[0]
        this.tickerSymbol = predictionCommandParts[predictionCommandParts.length - 1]
        this.trainingIterationsCrypto = 130
        this.trainingIterationsStock = 40
    }

    async schedule() {
        const predictionJob = async () => {
            if (this.predictionType === 'Crypto') {
                this.prediction = await Prediction.predictCrypto(
                    this.tickerSymbol,
                    this.trainingIterationsCrypto,
                )
            }
            if (this.predictionType === 'Stock') {
                this.prediction = await Prediction.predictStock(
                    this.tickerSymbol,
                    this.trainingIterationsStock,
                )
            }
            this.write()
        }

        await predictionJob()

        cron.schedule('0 1 * * *', predictionJob, {
            scheduled: true,
        })
    }

    write() {
        if (this.fileSystemAvailable) {
            fs.mkdirSync(
                `${this.predictionsPath}/${this.tickerSymbol}`,
                {
                    recursive: true,
                },
            )
            fs.writeFileSync(
                `${this.predictionsPath}/${this.tickerSymbol}/${Prediction.getNumericDateFromDateObject()}.json`,
                JSON.stringify(this.prediction),
            )
        }
    }
}

Prediction.getNumericDateFromDateObject = (dateObject = new Date()) => Number.parseInt(
    `${dateObject.getFullYear()}${dateObject.getMonth() + 1}${dateObject.getDate()}${dateObject.getHours()}${dateObject.getMinutes()}${dateObject.getSeconds()}`,
    10,
)

Prediction.predictCrypto = async (tickerSymbol, trainingIterations = 130) => {
    const pairToInspect = `${tickerSymbol}/USD`
    const daysIn5Years = 1825

    const quadencyHistoricalData = new QuadencyHistoricalData(
        QuadencyItervalEnum.HOUR_1, daysIn5Years * 24, [pairToInspect],
    )
    const historicalData = await quadencyHistoricalData.get()
    const pairDataAscendingInTime = lodash.reverse(historicalData[pairToInspect])

    const timeSeriesModel = new MultiVariableTimeSeriesModel(
        pairDataAscendingInTime, 2 * 24, 0.001, trainingIterations,
    )
    await timeSeriesModel.train()
    const predictedNextBars = await timeSeriesModel.predictNextBars()

    const predictedTimeSeries = []
    for (let index = 0; index < predictedNextBars.length; index += 1) {
        predictedTimeSeries.push([
            new Date(predictedNextBars[index].time),
            predictedNextBars[index].features[0],
        ])
    }

    return predictedTimeSeries
}

Prediction.predictStock = async (tickerSymbol, trainingIterations = 40) => {
    const yahooFinanceHistoricalData = new YahooFinanceHistoricalData(
        YahooFinanceIntervalEnum.HOUR_1,
        YahooFinanceRangeEnum.YEAR_2,
        tickerSymbol,
    )
    const historicalFeatures = await yahooFinanceHistoricalData.get()
    const timeSeriesModel = new MultiVariableTimeSeriesModel(
        historicalFeatures, 3 * 24, 0.001, trainingIterations,
    )
    await timeSeriesModel.train()
    const predictedNextBars = await timeSeriesModel.predictNextBars()

    const predictedTimeSeries = []
    for (let index = 0; index < predictedNextBars.length; index += 1) {
        predictedTimeSeries.push([
            new Date(predictedNextBars[index].time),
            predictedNextBars[index].features[0],
        ])
    }

    return predictedTimeSeries
}

module.exports = Prediction
