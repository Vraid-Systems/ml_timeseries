const axios = require('axios')
const ItervalEnum = require('./QuadencyIntervalEnum')
const QuadencyHistoricalData = require('./QuadencyHistoricalData')

jest.mock('axios', () => ({
    get: jest.fn(() => ({
        data: { 'BTC/USD': [['1597529580000', '11973.24509253']] },
    })),
}))

describe('QuadencyHistoricalData', () => {
    beforeEach(() => {
        axios.get.mockClear()
    })

    test('that get calls axios.get with the correct params', async () => {
        const quadencyHistoricalData = new QuadencyHistoricalData(ItervalEnum.HOUR_6, 60, ['ALGO/USD', 'XTZ/USD'])
        const historicalData = await quadencyHistoricalData.get()

        expect(historicalData).not.toBeNull()
        expect(historicalData['BTC/USD'].length).toBe(1)

        expect(axios.get).toBeCalledTimes(1)

        expect(axios.get.mock.calls[0][0]).toEqual(expect.stringContaining('bars=60'))
        expect(axios.get.mock.calls[0][0]).toEqual(expect.stringContaining('interval=6h'))
        expect(axios.get.mock.calls[0][0]).toEqual(expect.stringContaining('pairs=ALGO%2FUSD,XTZ%2FUSD'))
    })
})
