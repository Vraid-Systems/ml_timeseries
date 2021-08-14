const fs = require('fs')
const lodash = require('lodash')

const Firestore = require('@google-cloud/firestore')

const MultiVariableArima = require('./MultiVariableArima')
const MultiVariableLstm = require('./MultiVariableLstm')
const QuadencyHistoricalData = require('./QuadencyHistoricalData')
const QuadencyItervalEnum = require('./QuadencyIntervalEnum')
const YahooFinanceHistoricalData = require('./YahooFinanceHistoricalData')
const YahooFinanceIntervalEnum = require('./YahooFinanceIntervalEnum')
const YahooFinanceRangeEnum = require('./YahooFinanceRangeEnum')

class Prediction {
    constructor(modelToRun, parentObjects) {
        this.cacheApiData = null
        this.cachePredictionData = null
        this.createdTime = new Date().getTime()
        this.locationOutputDirectory = '/tmp/ml_timeseries'
        this.locationOutputFile = '/tmp/ml_timeseries/labeled.json'
        this.modelToRun = modelToRun
        this.parentObjects = parentObjects
        this.parentObjectsCleaned = this.parentObjects.map((ticker) => ticker.replace('CRYPTO:', '').replace('STOCK:', '').replace('USD=X', ''))
    }

    async calculatePrediction() {
        if (this.cachePredictionData) {
            return this.cachePredictionData
        }

        const apiData = await this.getApiData()

        let timeSeriesModel = new MultiVariableArima(
            apiData, 42,
        )
        if (this.modelToRun === 'lstm') {
            timeSeriesModel = new MultiVariableLstm(
                apiData, 42, 0.001, 42,
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

        this.cachePredictionData = predictedTimeSeries
        return this.cachePredictionData
    }

    async getApiData() {
        if (this.cacheApiData) {
            return this.cacheApiData
        }

        if (this.parentObjects.toString().includes('CRYPTO')) {
            this.cacheApiData = await this.getCryptoData()
        } else {
            this.cacheApiData = await this.getStockData()
        }

        return this.cacheApiData
    }

    async getCryptoData() {
        const daysIn5Years = 1825
        const quadencyHistoricalData = new QuadencyHistoricalData(
            QuadencyItervalEnum.DAY_1, daysIn5Years, this.parentObjectsCleaned,
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

        return flattenedFeatureTimeSeries
    }

    async getStockData() {
        const yahooFinanceHistoricalData = new YahooFinanceHistoricalData(
            YahooFinanceIntervalEnum.DAY_1,
            YahooFinanceRangeEnum.YEAR_5,
            this.parentObjectsCleaned.join(), // TODO handle multiple tickers
        )
        return yahooFinanceHistoricalData.get()
    }

    async writeToFile() {
        const apiData = await this.getApiData()
        const predictionData = await this.calculatePrediction()

        let labelPostfix = 'actual'
        const labelData = (inputDataBar) => {
            const labeledObject = {}

            for (
                let featureIndex = 0;
                featureIndex < this.parentObjectsCleaned.length;
                featureIndex += 1
            ) {
                labeledObject[`${this.parentObjectsCleaned[featureIndex]} ${labelPostfix}`] = inputDataBar[featureIndex + 1]
            }

            return [inputDataBar[0], labeledObject]
        }
        const labeledApiData = lodash.map(apiData, labelData)
        labelPostfix = 'predicted'
        const labeledPredictionData = lodash.map(predictionData, labelData)

        const predictionObject = labeledApiData.concat(labeledPredictionData)

        const humanReadableJSON = `const labeledData = ${JSON.stringify(predictionObject, null, 4)}`
        if (!fs.existsSync(this.locationOutputDirectory)) {
            fs.mkdirSync(this.locationOutputDirectory)
        }
        return fs.writeFileSync(this.locationOutputFile, humanReadableJSON)
    }

    async writeToFirestore() {
        const apiData = await this.getApiData()
        const predictionData = await this.calculatePrediction()

        const firestore = new Firestore({
            credentials: {
                auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
                auth_uri: 'https://accounts.google.com/o/oauth2/auth',
                client_email: 'creator@[project id].iam.gserviceaccount.com',
                client_id: '[client id]',
                client_x509_cert_url: 'https://www.googleapis.com/robot/v1/metadata/x509/creator%40[project id].iam.gserviceaccount.com',
                private_key: '[private key]',
                private_key_id: '[private key id]',
                token_uri: 'https://oauth2.googleapis.com/token',
                type: 'service_account',
            },
            projectId: '[project id]',
        })

        const firestoreFormatter = (inputDataBar, isHistorical, writeBatch) => {
            for (
                let featureIndex = 0;
                featureIndex < this.parentObjectsCleaned.length;
                featureIndex += 1
            ) {
                const occurrenceTime = inputDataBar[0]

                const featureName = this.parentObjectsCleaned[featureIndex]
                const featureText = `${featureName} ${isHistorical ? 'historical' : 'predicted'}`
                const featureValue = inputDataBar[featureIndex + 1]

                const firestoreFeatureName = featureName.replace('/', '')
                const firestoreDocId = isHistorical ? `${firestoreFeatureName}-${occurrenceTime}` : `${firestoreFeatureName}-${this.createdTime}-${occurrenceTime}`

                const predictionRef = firestore.collection(firestoreFeatureName).doc(firestoreDocId)
                writeBatch.set(predictionRef, {
                    created: this.createdTime,
                    isHistorical,
                    label: featureText,
                    orderedId: `${this.createdTime}-${occurrenceTime}`,
                    parentObjectId: featureName,
                    time: occurrenceTime,
                    value: featureValue,
                })
            }
        }

        const firestoreChunkedApiData = lodash.chunk(apiData, 100)
        for (
            let chunkIndex = 0;
            chunkIndex <= firestoreChunkedApiData.length;
            chunkIndex += 1
        ) {
            const writeBatch = firestore.batch()

            const writeData = (inputDataBar) => {
                firestoreFormatter(inputDataBar, true, writeBatch)
            }
            lodash.forEach(firestoreChunkedApiData[chunkIndex], writeData)

            // eslint-disable-next-line no-await-in-loop
            await writeBatch.commit()
        }

        const firestoreChunkedPredictionData = lodash.chunk(predictionData, 100)
        for (
            let chunkIndex = 0;
            chunkIndex <= firestoreChunkedPredictionData.length;
            chunkIndex += 1
        ) {
            const writeBatch = firestore.batch()

            const writeData = (inputDataBar) => {
                firestoreFormatter(inputDataBar, false, writeBatch)
            }
            lodash.forEach(firestoreChunkedPredictionData[chunkIndex], writeData)

            // eslint-disable-next-line no-await-in-loop
            await writeBatch.commit()
        }

        const writeBatch = firestore.batch()
        for (
            let featureIndex = 0;
            featureIndex < this.parentObjectsCleaned.length;
            featureIndex += 1
        ) {
            const featureName = this.parentObjectsCleaned[featureIndex]
            const firestoreFeatureName = featureName.replace('/', '')

            const predictionRef = firestore.collection('Prediction').doc(`${firestoreFeatureName}-${this.createdTime}`)
            writeBatch.set(predictionRef, {
                created: this.createdTime,
                parentObjectId: featureName,
            })
        }
        await writeBatch.commit()
    }
}

module.exports = Prediction
