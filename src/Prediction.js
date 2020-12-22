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
            apiData, 21,
        )
        if (this.modelToRun === 'lstm') {
            timeSeriesModel = new MultiVariableLstm(
                apiData, 21, 0.001, 40,
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
                client_email: 'creator@ml-timeseries.iam.gserviceaccount.com',
                client_id: '113933008067112298322',
                client_x509_cert_url: 'https://www.googleapis.com/robot/v1/metadata/x509/creator%40ml-timeseries.iam.gserviceaccount.com',
                private_key: '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDGJ8NRoJIUSRhj\nleACDcIgzG4Ci1kaOZyh0j/zbIyF6nwm6sm4GyjlJ8RGSI94G7dOYdLFZgOSQ/qB\nF745rjViYR1Pc2gOESMGqp8OuRdX19P4gHCxjGEBmg0ZYoiFoqkstaY7IIvtmnhD\nQOCRiVcggBWsGYyGq/nAFHCPAT8DntZi3GWrsfjSctH3lhggKBD9DNv/I6eG8V8j\nf9au9fz7ja2Sa0Y7zJ/GRPiwa4s03DgH0KcCpQ6B8vOrW7kKU+UODkVF7NwSVMAH\n35Y5eidwuRFEV1XhoZVVbZYyH6161/2vJXhlHD+tKIgERkA5/3SsQ3zOi2QLUxjJ\nOTO5TxY7AgMBAAECggEAI6H43I/cVOuECDxmSNhChXVdfvWh8zZS9UKCn3pwlpBA\n/RqRZZr0sqiBAgaATh/lyaGLrlWW5NF2lYo4edTa4rMF+0iMeKMaQlOiQJqGGRTF\nmFU4bqUIuKoEGwF9/VHvzAtqNg23O+XgJG/hMiqZUU3XF9iMTZdVVPYX+49EzpiL\nRyIdJwUP3oeJS+/o1QHDlO6uNIhYzvUOkeU2cJuuFBh05y4hSdUnHVWoapgznQa0\nyH3Hiruvm0o2/X4ZVvgsPf8m23oXCjC6c6h3xEZBQs2z6ffqdRzlnDuG7Z+vmeAm\ncLiQh2JpfjFt5/nVnuUOBPJWlUiIu9tHCWp3wk012QKBgQDy1ptmueGSASwqdGXo\nTntmlbsc4PaAGGz01VkOXEQ2R4gj4tzgU6brQYtPr9ssvdz18GRxIHmTm9M64EKv\nusS6PRrW6h1Fu+1eX6wam4f6HYJBDJxb1IXAvbilQ0BMacVvrIpDwNQq5/ea+oaK\nn16ixnx+SZkOF4JN2tj0J5TFDwKBgQDQ5S1q7KOy9r0RUAb2YvEZvPcurh6dP4M7\nFN+4iN4pgIyhWXgZv5p8koYjxb9kzYhf+jckQV/uvuWbpegqER4YzfdjRDirbItL\n7RXB2fySDRg2YsnCs5qsns6dGkLGzYVUZ6M8z30sdNdXDpOvxDvgj2wpKzrjfOf+\noy7vM25UFQKBgQDdJ49NZbnFw2WaoHjysQ73JSPMMCCuFhCchPRe/K5ulISq0gAA\nGI7qr72U6/36aEskfDKtSDsQsBgWBYkWC00Ao4ee9IWGLZkGmrDdZonWwisO3NJF\nW24YU3AmqfGT5bwWcRdWjvVqwekg7km7U1rXeVaFmLdYOxbDmqx85tM5BwKBgACK\nt6VxW7NZJIBo/rug4hM5BEMgvH+X7JU4pqPp5vmglbzNaJxYfOQZ1TM+jhKK3fGx\nynbTnJYX9KyEr6d8R+G0lxGw2ZzIOUxHHylTkW4njoqFkxRoNtx/xPVvXgD6A4CG\njEvaFe8Jlo1pQkTQc39Pn+4zaIGyjz9/2N1R+tVJAoGAeo15O7/xLx4qZUtoj1uq\ngr4I/9OyLdAG9nv4wWK44mEWTIrnnYgW6QGjA2KPOQ6AlcV/FDQk6NK4ptHcdI+i\nv58iVj7YoN+vj9sajrCpGzohlH98WEoZb3Byn2C2ZkNNWAZcu/Zv94Xsg+mKeIZB\n51ksbvXFdVfLVEccKFks+k0=\n-----END PRIVATE KEY-----\n',
                private_key_id: '1ebc991141c4f45e7eff512406e618baa31fb26d',
                token_uri: 'https://oauth2.googleapis.com/token',
                type: 'service_account',
            },
            projectId: 'ml-timeseries',
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
    }
}

module.exports = Prediction
