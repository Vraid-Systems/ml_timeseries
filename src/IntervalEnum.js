class IntervalEnum {
    constructor(name) {
        this.name = name
    }

    toString() {
        return this.name
    }
}

IntervalEnum.MINUTE_1 = new IntervalEnum('1m')
IntervalEnum.MINUTE_5 = new IntervalEnum('5m')
IntervalEnum.MINUTE_15 = new IntervalEnum('15m')
IntervalEnum.MINUTE_30 = new IntervalEnum('30m')
IntervalEnum.HOUR_1 = new IntervalEnum('1h')
IntervalEnum.HOUR_6 = new IntervalEnum('6h')
IntervalEnum.DAY_1 = new IntervalEnum('1d')

module.exports = IntervalEnum
