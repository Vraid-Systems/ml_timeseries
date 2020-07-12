const QuadencyIntervalEnum = require('./QuadencyIntervalEnum')

describe('QuadencyIntervalEnum', () => {
    test('enum returns the correct string representation', () => {
        expect(QuadencyIntervalEnum.MINUTE_1.toString()).toEqual('1m')
        expect(QuadencyIntervalEnum.MINUTE_5.toString()).toEqual('5m')
        expect(QuadencyIntervalEnum.MINUTE_15.toString()).toEqual('15m')
        expect(QuadencyIntervalEnum.MINUTE_30.toString()).toEqual('30m')
        expect(QuadencyIntervalEnum.HOUR_1.toString()).toEqual('1h')
        expect(QuadencyIntervalEnum.HOUR_6.toString()).toEqual('6h')
        expect(QuadencyIntervalEnum.DAY_1.toString()).toEqual('1d')
    })
})
