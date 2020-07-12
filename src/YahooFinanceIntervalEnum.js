class YahooFinanceIntervalEnum {
    constructor(name) {
        this.name = name
    }

    toString() {
        return this.name
    }
}

YahooFinanceIntervalEnum.MINUTE_1 = new YahooFinanceIntervalEnum('1m')
YahooFinanceIntervalEnum.MINUTE_5 = new YahooFinanceIntervalEnum('5m')
YahooFinanceIntervalEnum.MINUTE_15 = new YahooFinanceIntervalEnum('15m')
YahooFinanceIntervalEnum.MINUTE_30 = new YahooFinanceIntervalEnum('30m')
YahooFinanceIntervalEnum.MINUTE_60 = new YahooFinanceIntervalEnum('60m')
YahooFinanceIntervalEnum.MINUTE_90 = new YahooFinanceIntervalEnum('90m')
YahooFinanceIntervalEnum.HOUR_1 = new YahooFinanceIntervalEnum('1h')
YahooFinanceIntervalEnum.DAY_1 = new YahooFinanceIntervalEnum('1d')
YahooFinanceIntervalEnum.DAY_5 = new YahooFinanceIntervalEnum('5d')
YahooFinanceIntervalEnum.WEEK_1 = new YahooFinanceIntervalEnum('1wk')
YahooFinanceIntervalEnum.MONTH_1 = new YahooFinanceIntervalEnum('1mo')
YahooFinanceIntervalEnum.MONTH_3 = new YahooFinanceIntervalEnum('3mo')

module.exports = YahooFinanceIntervalEnum
