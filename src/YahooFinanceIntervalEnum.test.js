const YahooFinanceIntervalEnum = require('./YahooFinanceIntervalEnum')

describe('YahooFinanceIntervalEnum', () => {
    test('enum returns the correct string representation', () => {
        expect(YahooFinanceIntervalEnum.MINUTE_1.toString()).toEqual('1m')
        expect(YahooFinanceIntervalEnum.MINUTE_5.toString()).toEqual('5m')
        expect(YahooFinanceIntervalEnum.MINUTE_15.toString()).toEqual('15m')
        expect(YahooFinanceIntervalEnum.MINUTE_30.toString()).toEqual('30m')
        expect(YahooFinanceIntervalEnum.MINUTE_60.toString()).toEqual('60m')
        expect(YahooFinanceIntervalEnum.MINUTE_90.toString()).toEqual('90m')
        expect(YahooFinanceIntervalEnum.HOUR_1.toString()).toEqual('1h')
        expect(YahooFinanceIntervalEnum.DAY_1.toString()).toEqual('1d')
        expect(YahooFinanceIntervalEnum.DAY_5.toString()).toEqual('5d')
        expect(YahooFinanceIntervalEnum.WEEK_1.toString()).toEqual('1wk')
        expect(YahooFinanceIntervalEnum.MONTH_1.toString()).toEqual('1mo')
        expect(YahooFinanceIntervalEnum.MONTH_3.toString()).toEqual('3mo')
    })
})
