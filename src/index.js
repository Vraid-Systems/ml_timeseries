const lodash = require('lodash')

const Prediction = require('./Prediction')

const cryptoTickers = process.env.CRYPTO ? process.env.CRYPTO.split(',').map((cryptoTicker) => `CRYPTO:${cryptoTicker}`) : []
const model = process.env.MODEL ? process.env.MODEL.toLowerCase() : 'arima'
const savePrediction = !!process.env.SAVE
const stockTickers = process.env.STOCK ? process.env.STOCK.split(',').map((stockTicker) => `STOCK:${stockTicker}`) : []

const main = async () => {
    const prediction = new Prediction(model, lodash.union(cryptoTickers, stockTickers))
    if (savePrediction) {
        await prediction.writeToFirestore()
    }
    return prediction.writeToFile()
}

main()
