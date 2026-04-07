import {
  EXTERNAL_LINKS,
  getExternalLink,
  isExternalUrl,
  ExternalLinkKey,
} from '../links'

describe('links', () => {
  describe('EXTERNAL_LINKS', () => {
    it('should have all required link keys', () => {
      const requiredKeys = [
        'docs',
        'twitter',
        'telegram',
        'discord',
        'medium',
        'youtube',
        'website',
        'solanaExplorer',
      ]

      requiredKeys.forEach((key) => {
        expect(EXTERNAL_LINKS).toHaveProperty(key)
      })
    })

    it('should have valid URL format for all links', () => {
      Object.values(EXTERNAL_LINKS).forEach((url) => {
        expect(url).toMatch(/^https?:\/\//)
      })
    })

    it('should have gridtokenx.com as default website', () => {
      expect(EXTERNAL_LINKS.website).toContain('gridtokenx.com')
    })

    it('should have solana explorer URL', () => {
      expect(EXTERNAL_LINKS.solanaExplorer).toContain('gridtokenx.com')
    })
  })

  describe('getExternalLink', () => {
    it('should return correct URL for valid key', () => {
      const result = getExternalLink('twitter')
      expect(result).toBe(EXTERNAL_LINKS.twitter)
    })

    it('should return docs URL', () => {
      const result = getExternalLink('docs')
      expect(result).toBe(EXTERNAL_LINKS.docs)
    })

    it('should return website URL', () => {
      const result = getExternalLink('website')
      expect(result).toBe(EXTERNAL_LINKS.website)
    })

    it('should return solana explorer URL', () => {
      const result = getExternalLink('solanaExplorer')
      expect(result).toBe(EXTERNAL_LINKS.solanaExplorer)
    })

    it('should work with all valid keys', () => {
      const keys: ExternalLinkKey[] = [
        'docs',
        'twitter',
        'telegram',
        'discord',
        'medium',
        'youtube',
        'website',
        'solanaExplorer',
      ]

      keys.forEach((key) => {
        const result = getExternalLink(key)
        expect(result).toBeDefined()
        expect(typeof result).toBe('string')
      })
    })
  })

  describe('isExternalUrl', () => {
    it('should return true for https URLs', () => {
      expect(isExternalUrl('https://example.com')).toBe(true)
    })

    it('should return true for http URLs', () => {
      expect(isExternalUrl('http://example.com')).toBe(true)
    })

    it('should return false for relative paths', () => {
      expect(isExternalUrl('/dashboard')).toBe(false)
    })

    it('should return false for relative paths without leading slash', () => {
      expect(isExternalUrl('dashboard')).toBe(false)
    })

    it('should return false for anchor links', () => {
      expect(isExternalUrl('#section')).toBe(false)
    })

    it('should return false for mailto links', () => {
      expect(isExternalUrl('mailto:test@example.com')).toBe(false)
    })

    it('should return false for tel links', () => {
      expect(isExternalUrl('tel:+1234567890')).toBe(false)
    })

    it('should return false for empty string', () => {
      expect(isExternalUrl('')).toBe(false)
    })

    it('should handle URLs with paths', () => {
      expect(isExternalUrl('https://example.com/path/to/page')).toBe(true)
    })

    it('should handle URLs with query parameters', () => {
      expect(isExternalUrl('https://example.com?query=value')).toBe(true)
    })

    it('should handle URLs with fragments', () => {
      expect(isExternalUrl('https://example.com#section')).toBe(true)
    })
  })
})
