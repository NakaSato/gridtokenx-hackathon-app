import { CAMPUS_CONFIG, ENERGY_GRID_CONFIG, P2P_CONFIG } from '../constants'

describe('constants', () => {
  describe('CAMPUS_CONFIG', () => {
    it('should have correct campus name', () => {
      expect(CAMPUS_CONFIG.name).toBe('UTCC Smart Grid')
    })

    it('should have valid center coordinates', () => {
      expect(CAMPUS_CONFIG.center.longitude).toBeGreaterThan(100)
      expect(CAMPUS_CONFIG.center.longitude).toBeLessThan(101)
      expect(CAMPUS_CONFIG.center.latitude).toBeGreaterThan(13)
      expect(CAMPUS_CONFIG.center.latitude).toBeLessThan(14)
    })

    it('should have positive default zoom', () => {
      expect(CAMPUS_CONFIG.defaultZoom).toBeGreaterThan(0)
      expect(CAMPUS_CONFIG.defaultZoom).toBeLessThanOrEqual(20)
    })

    it('should have valid efficiency percentage', () => {
      expect(CAMPUS_CONFIG.efficiency).toMatch(/^\d+\.\d+%$/)
    })

    it('should have total capacity defined', () => {
      expect(CAMPUS_CONFIG.totalCapacity).toBeDefined()
      expect(CAMPUS_CONFIG.totalCapacity).toContain('kWh')
    })
  })

  describe('ENERGY_GRID_CONFIG', () => {
    it('should have default location coordinates', () => {
      expect(ENERGY_GRID_CONFIG.defaultLocation.latitude).toBeDefined()
      expect(ENERGY_GRID_CONFIG.defaultLocation.longitude).toBeDefined()
    })

    it('should have animation settings with positive values', () => {
      expect(ENERGY_GRID_CONFIG.animation.throttleMs).toBeGreaterThan(0)
      expect(ENERGY_GRID_CONFIG.animation.dashSpeed).toBeGreaterThan(0)
      expect(ENERGY_GRID_CONFIG.animation.pulseCycle).toBeGreaterThan(0)
    })

    it('should have power thresholds in descending order', () => {
      const { high, medium, low } = ENERGY_GRID_CONFIG.powerThresholds
      expect(high).toBeGreaterThan(medium)
      expect(medium).toBeGreaterThan(low)
    })

    it('should have positive progress bar max capacity', () => {
      expect(ENERGY_GRID_CONFIG.progressBar.maxCapacity).toBeGreaterThan(0)
    })
  })

  describe('P2P_CONFIG', () => {
    it('should have at least one trading zone', () => {
      expect(P2P_CONFIG.zones.length).toBeGreaterThan(0)
    })

    it('should have zones with id and name', () => {
      P2P_CONFIG.zones.forEach((zone) => {
        expect(zone.id).toBeDefined()
        expect(zone.name).toBeDefined()
        expect(typeof zone.id).toBe('number')
        expect(typeof zone.name).toBe('string')
      })
    })

    it('should have positive default price', () => {
      expect(P2P_CONFIG.defaultPrice).toBeGreaterThan(0)
    })

    it('should have quick amount percentages between 0 and 100', () => {
      P2P_CONFIG.quickAmountPercentages.forEach((percentage) => {
        expect(percentage).toBeGreaterThan(0)
        expect(percentage).toBeLessThanOrEqual(100)
      })
    })

    it('should have positive grid prices', () => {
      expect(P2P_CONFIG.defaultGridImportPrice).toBeGreaterThan(0)
      expect(P2P_CONFIG.defaultGridExportPrice).toBeGreaterThan(0)
    })

    it('should have import price higher than export price', () => {
      expect(P2P_CONFIG.defaultGridImportPrice).toBeGreaterThan(
        P2P_CONFIG.defaultGridExportPrice
      )
    })

    it('should have positive items per page', () => {
      expect(P2P_CONFIG.itemsPerPage).toBeGreaterThan(0)
    })
  })
})
