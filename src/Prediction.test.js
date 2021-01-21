const axios = require('axios')
const Predicton = require('./Prediction')

jest.mock('axios', () => ({
    get: jest.fn().mockImplementationOnce(
        () => ({
            data: {
                chart: {
                    result: [{
                        meta: {
                            currency: 'USD',
                            symbol: 'BEP',
                            exchangeName: 'NYQ',
                            instrumentType: 'EQUITY',
                            firstTradeDate: 1132065000,
                            regularMarketTime: 1597435201,
                            gmtoffset: -14400,
                            timezone: 'EDT',
                            exchangeTimezoneName: 'America/New_York',
                            regularMarketPrice: 43.4,
                            chartPreviousClose: 43.75,
                            previousClose: 43.75,
                            scale: 3,
                            priceHint: 2,
                            currentTradingPeriod: {
                                pre: {
                                    timezone: 'EDT', start: 1597392000, end: 1597411800, gmtoffset: -14400,
                                },
                                regular: {
                                    timezone: 'EDT', start: 1597411800, end: 1597435200, gmtoffset: -14400,
                                },
                                post: {
                                    timezone: 'EDT', start: 1597435200, end: 1597449600, gmtoffset: -14400,
                                },
                            },
                            tradingPeriods: [[{
                                timezone: 'EDT', start: 1597411800, end: 1597435200, gmtoffset: -14400,
                            }]],
                            dataGranularity: '1m',
                            range: '1m',
                            validRanges: ['1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y', '10y', 'ytd', 'max'],
                        },
                        timestamp: [1597435140],
                        indicators: {
                            quote: [{
                                high: [43.400001525878906],
                                close: [43.349998474121094],
                                open: [43.3849983215332],
                                volume: [0],
                                low: [43.349998474121094],
                            }],
                        },
                    }],
                    error: null,
                },
            },
        }),
    ).mockImplementationOnce(
        () => ({
            data: {
                chart: {
                    result: [{
                        meta: {
                            currency: 'USD',
                            symbol: 'BEP',
                            exchangeName: 'NYQ',
                            instrumentType: 'EQUITY',
                            firstTradeDate: 1132065000,
                            regularMarketTime: 1607435140,
                            gmtoffset: -14400,
                            timezone: 'EDT',
                            exchangeTimezoneName: 'America/New_York',
                            regularMarketPrice: 43.4,
                            chartPreviousClose: 43.75,
                            previousClose: 43.75,
                            scale: 3,
                            priceHint: 2,
                            currentTradingPeriod: {
                                pre: {
                                    timezone: 'EDT', start: 1597392000, end: 1597411800, gmtoffset: -14400,
                                },
                                regular: {
                                    timezone: 'EDT', start: 1597411800, end: 1597435200, gmtoffset: -14400,
                                },
                                post: {
                                    timezone: 'EDT', start: 1597435200, end: 1597449600, gmtoffset: -14400,
                                },
                            },
                            tradingPeriods: [[{
                                timezone: 'EDT', start: 1597411800, end: 1597435200, gmtoffset: -14400,
                            }]],
                            dataGranularity: '1m',
                            range: '1m',
                            validRanges: ['1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y', '10y', 'ytd', 'max'],
                        },
                        timestamp: [1607435140],
                        indicators: {
                            quote: [{
                                high: [43.400001525878906],
                                close: [43.349998474121094],
                                open: [43.3849983215332],
                                volume: [4],
                                low: [43.349998474121094],
                            }],
                        },
                    }],
                    error: null,
                },
            },
        }),
    ),
}))

describe('Prediction', () => {
    beforeEach(() => {
        axios.get.mockClear()
    })

    jest.setTimeout(300000) // 5 minutes

    test('verify that prediction data is created', async () => {
        const prediction = new Predicton('ARIMA', ['STOCK:AUDUSD=X'])
        const predictionData = await prediction.calculatePrediction()

        expect(predictionData).not.toBeNull()
        expect(predictionData.length).toBe(42)
    })
})
