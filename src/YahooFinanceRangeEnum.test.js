const YahooFinanceRangeEnum = require('./YahooFinanceRangeEnum')

describe('YahooFinanceRangeEnum', () => {
    test('enum returns the correct string representation', () => {
        expect(YahooFinanceRangeEnum.DAY_1.toString()).toEqual('1d')
        expect(YahooFinanceRangeEnum.DAY_5.toString()).toEqual('5d')
        expect(YahooFinanceRangeEnum.MONTH_1.toString()).toEqual('1mo')
        expect(YahooFinanceRangeEnum.MONTH_3.toString()).toEqual('3mo')
        expect(YahooFinanceRangeEnum.MONTH_6.toString()).toEqual('6mo')
        expect(YahooFinanceRangeEnum.YEAR_1.toString()).toEqual('1y')
        expect(YahooFinanceRangeEnum.YEAR_2.toString()).toEqual('2y')
        expect(YahooFinanceRangeEnum.YEAR_5.toString()).toEqual('5y')
        expect(YahooFinanceRangeEnum.YEAR_10.toString()).toEqual('10y')
        expect(YahooFinanceRangeEnum.YTD.toString()).toEqual('ytd')
        expect(YahooFinanceRangeEnum.MAX.toString()).toEqual('max')
    })
})
