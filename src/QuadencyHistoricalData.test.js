const axios = require('axios')
const ItervalEnum = require('./IntervalEnum')
const QuadencyHistoricalData = require('./QuadencyHistoricalData')

jest.mock('axios', () => ({
    get: jest.fn(() => ({
        data: [],
    })),
}))

describe('QuadencyHistoricalData', () => {
    beforeEach(() => {
        axios.get.mockClear()
    })

    test('that get calls axios.get with the correct params', async () => {
        const historicalData = new QuadencyHistoricalData(ItervalEnum.HOUR_6, 60, ['ALGO/USD', 'XTZ/USD'])

        await historicalData.get()
        expect(axios.get).toBeCalledTimes(1)
        expect(axios.get.mock.calls[0][0]).toEqual(expect.stringContaining('bars=60'))
        expect(axios.get.mock.calls[0][0]).toEqual(expect.stringContaining('interval=6h'))
        expect(axios.get.mock.calls[0][0]).toEqual(expect.stringContaining('pairs=ALGO%2FUSD,XTZ%2FUSD'))
    })
})
