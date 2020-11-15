const fs = require('fs')
const lodash = require('lodash')

const MultiVariableArima = require('./MultiVariableArima')
const MultiVariableLstm = require('./MultiVariableLstm')

const QuadencyHistoricalData = require('./QuadencyHistoricalData')
const QuadencyItervalEnum = require('./QuadencyIntervalEnum')

const YahooFinanceHistoricalData = require('./YahooFinanceHistoricalData')
const YahooFinanceIntervalEnum = require('./YahooFinanceIntervalEnum')
const YahooFinanceRangeEnum = require('./YahooFinanceRangeEnum')

const apiDataFileLocation = '/tmp/ml_timeseries/api.json'
const directoryLocation = '/tmp/ml_timeseries'
const labeledFileLocation = '/tmp/ml_timeseries/labeled.json'
const predictionFileLocation = '/tmp/ml_timeseries/prediction.json'

const cryptoTickers = process.env.CRYPTO ? process.env.CRYPTO.split(',') : null
const featureLabels = process.env.FEATURE_LABELS ? process.env.FEATURE_LABELS.split(',') : null
const model = process.env.MODEL ? process.env.MODEL.toLowerCase() : 'arima'
const stockTicker = process.env.STOCK

const predictTimeSeries = async (multiVariableInputData) => {
    let timeSeriesModel = new MultiVariableArima(
        multiVariableInputData, 7,
    )
    if (model === 'lstm') {
        timeSeriesModel = new MultiVariableLstm(
            multiVariableInputData, 7, 0.001, 25,
        )
        await timeSeriesModel.train()
    }

    const predictedNextBars = await timeSeriesModel.predictNextBars()

    const predictedTimeSeries = []
    for (let index = 0; index < predictedNextBars.length; index += 1) {
        predictedTimeSeries.push(
            [predictedNextBars[index].time].concat(predictedNextBars[index].features),
        )
    }

    return predictedTimeSeries
}

const writeObjectToOutputFile = async (objectToWrite, writeLocation, prefixString = null) => {
    let humanReadableJSON = JSON.stringify(objectToWrite, null, 4)
    if (prefixString) {
        humanReadableJSON = prefixString + humanReadableJSON
    }
    if (!fs.existsSync(directoryLocation)) {
        fs.mkdirSync(directoryLocation)
    }
    return fs.writeFileSync(writeLocation, humanReadableJSON)
}

const main = async () => {
    if (cryptoTickers) {
        const daysIn5Years = 1825
        const quadencyHistoricalData = new QuadencyHistoricalData(
            QuadencyItervalEnum.DAY_1, daysIn5Years, cryptoTickers,
        )
        const multiplePairHistoricalDescendingInTime = await quadencyHistoricalData.get()

        let leastNumberOfBars = Number.MAX_VALUE
        lodash.forEach(
            multiplePairHistoricalDescendingInTime,
            (singlePairHistoricalData) => {
                if (leastNumberOfBars > singlePairHistoricalData.length) {
                    leastNumberOfBars = singlePairHistoricalData.length
                }
            },
        )

        const multiplePairHistoricalAscendingInTime = lodash.map(
            multiplePairHistoricalDescendingInTime, (singlePairHistoricalData, singlePairName) => {
                const singlePairObj = {}
                singlePairObj[singlePairName] = lodash.reverse(
                    lodash.slice(singlePairHistoricalData, 0, leastNumberOfBars),
                )
                return singlePairObj
            },
        )

        const multiDimensionFeatures = lodash.map(
            multiplePairHistoricalAscendingInTime,
            (singlePairHistoricalData) => Object.values(singlePairHistoricalData)[0],
        )

        const flattenedFeatureTimeSeries = []
        const numberOfBars = multiDimensionFeatures[0].length
        const numberOfTradingPairs = multiDimensionFeatures.length
        for (let currentBar = 0; currentBar < numberOfBars; currentBar += 1) {
            const featuresForBar = []

            for (let currentTradingPair = 0;
                currentTradingPair < numberOfTradingPairs;
                currentTradingPair += 1) {
                // eslint-disable-next-line prefer-destructuring
                featuresForBar[0] = multiDimensionFeatures[currentTradingPair][currentBar][0]
                const price = multiDimensionFeatures[currentTradingPair][currentBar][1]
                featuresForBar.push(price)
            }

            flattenedFeatureTimeSeries.push(featuresForBar)
        }

        return writeObjectToOutputFile(flattenedFeatureTimeSeries, apiDataFileLocation)
    }

    if (featureLabels) {
        const apiDataRaw = fs.readFileSync(apiDataFileLocation)
        const apiData = JSON.parse(apiDataRaw)

        const predictionDataRaw = fs.readFileSync(predictionFileLocation)
        const predictionData = JSON.parse(predictionDataRaw)

        let labelPostfix = 'actual'
        const labelData = (inputDataBar) => {
            const labeledObject = {}

            for (let featureIndex = 0; featureIndex < featureLabels.length; featureIndex += 1) {
                labeledObject[`${featureLabels[featureIndex]} ${labelPostfix}`] = inputDataBar[featureIndex + 1]
            }

            return [inputDataBar[0], labeledObject]
        }
        const labeledApiData = lodash.map(apiData, labelData)
        labelPostfix = 'predicted'
        const labeledPredictionData = lodash.map(predictionData, labelData)

        return writeObjectToOutputFile(
            labeledApiData.concat(labeledPredictionData),
            labeledFileLocation,
            'const labeledData = ',
        )
    }

    if (stockTicker) {
        const yahooFinanceHistoricalData = new YahooFinanceHistoricalData(
            YahooFinanceIntervalEnum.DAY_1,
            YahooFinanceRangeEnum.YEAR_5,
            stockTicker,
        )
        const historicalStockTickerFeatures = await yahooFinanceHistoricalData.get()

        return writeObjectToOutputFile(historicalStockTickerFeatures, apiDataFileLocation)
    }

    const inputDataRaw = fs.readFileSync(apiDataFileLocation)
    const inputData = JSON.parse(inputDataRaw)

    const predictedTimeSeries = await predictTimeSeries(inputData)

    return writeObjectToOutputFile(predictedTimeSeries, predictionFileLocation)
}

main()
