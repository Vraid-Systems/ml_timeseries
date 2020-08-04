class YahooFinanceRangeEnum {
    constructor(name) {
        this.name = name
    }

    toString() {
        return this.name
    }
}

YahooFinanceRangeEnum.DAY_1 = new YahooFinanceRangeEnum('1d')
YahooFinanceRangeEnum.DAY_5 = new YahooFinanceRangeEnum('5d')
YahooFinanceRangeEnum.MONTH_1 = new YahooFinanceRangeEnum('1mo')
YahooFinanceRangeEnum.MONTH_3 = new YahooFinanceRangeEnum('3mo')
YahooFinanceRangeEnum.MONTH_6 = new YahooFinanceRangeEnum('6mo')
YahooFinanceRangeEnum.YEAR_1 = new YahooFinanceRangeEnum('1y')
YahooFinanceRangeEnum.YEAR_2 = new YahooFinanceRangeEnum('2y')
YahooFinanceRangeEnum.YEAR_5 = new YahooFinanceRangeEnum('5y')
YahooFinanceRangeEnum.YEAR_10 = new YahooFinanceRangeEnum('10y')
YahooFinanceRangeEnum.YTD = new YahooFinanceRangeEnum('ytd')
YahooFinanceRangeEnum.MAX = new YahooFinanceRangeEnum('max')

module.exports = YahooFinanceRangeEnum
