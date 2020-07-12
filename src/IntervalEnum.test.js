const IntervalEnum = require('./IntervalEnum')

describe('IntervalEnum', () => {
    test('enum returns the correct string representation', () => {
        expect(IntervalEnum.MINUTE_1.toString()).toEqual('1m')
        expect(IntervalEnum.MINUTE_5.toString()).toEqual('5m')
        expect(IntervalEnum.MINUTE_15.toString()).toEqual('15m')
        expect(IntervalEnum.MINUTE_30.toString()).toEqual('30m')
        expect(IntervalEnum.HOUR_1.toString()).toEqual('1h')
        expect(IntervalEnum.HOUR_6.toString()).toEqual('6h')
        expect(IntervalEnum.DAY_1.toString()).toEqual('1d')
    })
})
