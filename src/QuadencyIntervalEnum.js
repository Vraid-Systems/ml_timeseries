class QuadencyIntervalEnum {
    constructor(name) {
        this.name = name
    }

    toString() {
        return this.name
    }
}

QuadencyIntervalEnum.MINUTE_1 = new QuadencyIntervalEnum('1m')
QuadencyIntervalEnum.MINUTE_5 = new QuadencyIntervalEnum('5m')
QuadencyIntervalEnum.MINUTE_15 = new QuadencyIntervalEnum('15m')
QuadencyIntervalEnum.MINUTE_30 = new QuadencyIntervalEnum('30m')
QuadencyIntervalEnum.HOUR_1 = new QuadencyIntervalEnum('1h')
QuadencyIntervalEnum.HOUR_6 = new QuadencyIntervalEnum('6h')
QuadencyIntervalEnum.DAY_1 = new QuadencyIntervalEnum('1d')

module.exports = QuadencyIntervalEnum
