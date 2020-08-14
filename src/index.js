const express = require('express')
const fs = require('fs')
const Prediction = require('./Prediction')

const basePredictionsPath = '/tmp/ml_trader/predictions'

// regular prediction creation
const watchlistCsv = process.env.WATCHLIST_CSV || ''
const watchlist = watchlistCsv.split(',')
watchlist.forEach((predictionCommand) => {
    const prediction = new Prediction(predictionCommand, basePredictionsPath)
    prediction.schedule()
})

// serve predictions for viewing
const app = express()

app.use(express.static('public'))

app.get('/predictions', (req, res) => {
    const predictions = {}

    const availablePredictedTickers = fs.readdirSync(basePredictionsPath)

    availablePredictedTickers.forEach((availablePredictedTicker) => {
        predictions[availablePredictedTicker] = {}

        const predictionsForTickerBasePath = `${basePredictionsPath}/${availablePredictedTicker}`
        const filenames = fs.readdirSync(predictionsForTickerBasePath)

        console.log(`Found predictions ${filenames} for ${availablePredictedTicker}`)

        filenames.forEach((filename) => {
            const predictionJsonString = fs.readFileSync(`${predictionsForTickerBasePath}/${filename}`)
            predictions[availablePredictedTicker][filename] = JSON.parse(predictionJsonString)
        })
    })

    res.set('Content-Type', 'application/json')
    res.send(predictions)
})

app.listen(3049, () => console.log(`HTTP listening on ${3049}`))
