import { cn } from '../utils'

describe('cn utility function', () => {
  it('should merge class names correctly', () => {
    const result = cn('foo', 'bar')
    expect(result).toBe('foo bar')
  })

  it('should handle conditional class names', () => {
    const result = cn('base', true && 'included', false && 'excluded')
    expect(result).toBe('base included')
  })

  it('should merge tailwind classes correctly', () => {
    const result = cn('px-2 py-1', 'px-4')
    expect(result).toBe('py-1 px-4')
  })

  it('should handle undefined and null values', () => {
    const result = cn('base', undefined, null, 'end')
    expect(result).toBe('base end')
  })

  it('should handle empty strings', () => {
    const result = cn('base', '', 'end')
    expect(result).toBe('base end')
  })

  it('should handle object notation for conditional classes', () => {
    const result = cn('base', { active: true, disabled: false })
    expect(result).toBe('base active')
  })

  it('should handle arrays of class names', () => {
    const result = cn(['foo', 'bar'], 'baz')
    expect(result).toContain('foo')
    expect(result).toContain('bar')
    expect(result).toContain('baz')
  })

  it('should handle nested arrays', () => {
    const result = cn('a', ['b', ['c']])
    expect(result).toContain('a')
    expect(result).toContain('b')
    expect(result).toContain('c')
  })

  it('should return empty string for no arguments', () => {
    const result = cn()
    expect(result).toBe('')
  })

  it('should merge conflicting tailwind classes correctly', () => {
    // tailwind-merge should keep the last conflicting class
    const result = cn('text-red-500', 'text-blue-500')
    expect(result).toBe('text-blue-500')
  })

  it('should handle complex tailwind class merging', () => {
    const result = cn(
      'flex items-center justify-center',
      'p-4 md:p-6',
      'bg-white dark:bg-gray-800'
    )
    expect(result).toContain('flex')
    expect(result).toContain('items-center')
    expect(result).toContain('justify-center')
    expect(result).toContain('p-4')
    expect(result).toContain('md:p-6')
    expect(result).toContain('bg-white')
    expect(result).toContain('dark:bg-gray-800')
  })
})
