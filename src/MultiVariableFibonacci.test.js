const MultiVariableFibonacci = require('./MultiVariableFibonacci')

describe('MultiVariableFibonacci', () => {
    test('that extension from bear is automatically detected', () => {
        const downtrendData = [
            [1612853317, 4, 8],
            [1612853417, 3, 7],
            [1612853517, 2, 6],
            [1612853617, 1, 5],
        ]

        const multiVariableFibonacci = new MultiVariableFibonacci(downtrendData)
        const output = multiVariableFibonacci.calculate()

        expect(output).not.toBeNull()
        expect(output.length).toBe(2)
        expect(output[0]).toEqual([2.854, 4, 5.854])
        expect(output[1]).toEqual([6.854, 8, 9.854])
    })

    test('that retracement from bull is automatically detected', () => {
        const uptrendData = [
            [1612853317, 1, 5],
            [1612853417, 2, 6],
            [1612853517, 3, 7],
            [1612853617, 4, 8],
        ]

        const multiVariableFibonacci = new MultiVariableFibonacci(uptrendData)
        const output = multiVariableFibonacci.calculate()

        expect(output).not.toBeNull()
        expect(output.length).toBe(2)
        expect(output[0]).toEqual([3.292, 2.854, 2.146])
        expect(output[1]).toEqual([7.292, 6.854, 6.146])
    })
})
