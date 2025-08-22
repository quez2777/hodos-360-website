import { cn, formatDate, truncate, slugify, getErrorMessage } from '@/lib/utils'

describe('utils', () => {
  describe('cn', () => {
    it('combines class names correctly', () => {
      expect(cn('foo', 'bar')).toBe('foo bar')
      expect(cn('foo', { bar: true, baz: false })).toBe('foo bar')
      expect(cn('foo', undefined, 'bar')).toBe('foo bar')
    })
  })

  describe('formatDate', () => {
    it('formats dates correctly', () => {
      const date = new Date('2023-12-25')
      expect(formatDate(date)).toBe('December 25, 2023')
      expect(formatDate(date, { month: 'short' })).toBe('Dec 25, 2023')
    })
  })

  describe('truncate', () => {
    it('truncates long strings', () => {
      const longText = 'This is a very long text that needs to be truncated'
      expect(truncate(longText, 20)).toBe('This is a very long...')
      expect(truncate('Short text', 20)).toBe('Short text')
    })
  })

  describe('slugify', () => {
    it('converts strings to slugs', () => {
      expect(slugify('Hello World')).toBe('hello-world')
      expect(slugify('HODOS 360 LLC')).toBe('hodos-360-llc')
      expect(slugify('AI & Machine Learning')).toBe('ai-machine-learning')
    })
  })

  describe('getErrorMessage', () => {
    it('extracts error messages correctly', () => {
      expect(getErrorMessage(new Error('Test error'))).toBe('Test error')
      expect(getErrorMessage('String error')).toBe('String error')
      expect(getErrorMessage({ message: 'Object error' })).toBe('Object error')
      expect(getErrorMessage(null)).toBe('An unknown error occurred')
    })
  })
})