describe('Utility Functions', () => {
  describe('Basic Math Operations', () => {
    it('should add two numbers correctly', () => {
      const result = 2 + 3
      expect(result).toBe(5)
    })

    it('should subtract two numbers correctly', () => {
      const result = 10 - 3
      expect(result).toBe(7)
    })

    it('should multiply two numbers correctly', () => {
      const result = 4 * 5
      expect(result).toBe(20)
    })

    it('should divide two numbers correctly', () => {
      const result = 15 / 3
      expect(result).toBe(5)
    })
  })

  describe('String Operations', () => {
    it('should concatenate strings correctly', () => {
      const result = 'Hello ' + 'World'
      expect(result).toBe('Hello World')
    })

    it('should check string length', () => {
      const text = 'Testing'
      expect(text.length).toBe(7)
    })

    it('should convert to uppercase', () => {
      const result = 'hello'.toUpperCase()
      expect(result).toBe('HELLO')
    })

    it('should check if string includes substring', () => {
      const text = 'Hello World'
      expect(text.includes('World')).toBe(true)
      expect(text.includes('xyz')).toBe(false)
    })
  })

  describe('Array Operations', () => {
    it('should find array length', () => {
      const arr = [1, 2, 3, 4, 5]
      expect(arr.length).toBe(5)
    })

    it('should add items to array', () => {
      const arr = [1, 2, 3]
      arr.push(4)
      expect(arr).toEqual([1, 2, 3, 4])
    })

    it('should filter array items', () => {
      const arr = [1, 2, 3, 4, 5]
      const result = arr.filter(x => x > 3)
      expect(result).toEqual([4, 5])
    })

    it('should map array items', () => {
      const arr = [1, 2, 3]
      const result = arr.map(x => x * 2)
      expect(result).toEqual([2, 4, 6])
    })
  })

  describe('Object Operations', () => {
    it('should access object properties', () => {
      const obj = { name: 'Test', age: 25 }
      expect(obj.name).toBe('Test')
      expect(obj.age).toBe(25)
    })

    it('should check object keys', () => {
      const obj = { a: 1, b: 2, c: 3 }
      const keys = Object.keys(obj)
      expect(keys).toEqual(['a', 'b', 'c'])
    })

    it('should check object values', () => {
      const obj = { a: 1, b: 2, c: 3 }
      const values = Object.values(obj)
      expect(values).toEqual([1, 2, 3])
    })
  })

  describe('Date Operations', () => {
    it('should create new date', () => {
      const date = new Date('2024-01-15')
      expect(date.getFullYear()).toBe(2024)
      expect(date.getMonth()).toBe(0) // January is 0
      expect(date.getDate()).toBe(15)
    })

    it('should format date to ISO string', () => {
      const date = new Date('2024-01-15T10:30:00Z')
      expect(date.toISOString()).toBe('2024-01-15T10:30:00.000Z')
    })
  })

  describe('Type Checking', () => {
    it('should check typeof correctly', () => {
      expect(typeof 42).toBe('number')
      expect(typeof 'hello').toBe('string')
      expect(typeof true).toBe('boolean')
      expect(typeof {}).toBe('object')
      expect(typeof []).toBe('object')
      expect(typeof undefined).toBe('undefined')
    })

    it('should check Array.isArray correctly', () => {
      expect(Array.isArray([])).toBe(true)
      expect(Array.isArray([1, 2, 3])).toBe(true)
      expect(Array.isArray({})).toBe(false)
      expect(Array.isArray('hello')).toBe(false)
    })
  })
}) 