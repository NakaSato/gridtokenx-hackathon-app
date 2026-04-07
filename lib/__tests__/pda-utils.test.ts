import {
  getPoolPDA,
  getCustodyPDA,
  getUserPDA,
  getOptionDetailPDA,
  getCustodyTokenAccountPDA,
  getContractPDA,
  getTransferAuthorityPDA,
  getLpTokenMintPDA,
  getPrivateBalancePDA,
  getNullifierSetPDA,
  getMintAuthorityPDA,
} from '../pda-utils'

// Mock @solana/web3.js and @coral-xyz/anchor at the module level
jest.mock('@solana/web3.js', () => {
  const mockPublicKey = {
    toBuffer: jest.fn(() => Buffer.from('mock_public_key')),
  }

  return {
    PublicKey: {
      findProgramAddressSync: jest.fn(() => [mockPublicKey, 1]),
    },
  }
})

jest.mock('@coral-xyz/anchor', () => ({
  BN: class BN {
    value: number
    constructor(value: number) {
      this.value = value
    }
    toArrayLike(buffer: typeof Buffer, endian: string, length: number) {
      const buf = Buffer.alloc(length)
      buf.writeBigInt64BE(BigInt(this.value))
      return buf
    }
  },
}))

describe('pda-utils', () => {
  const mockProgramId = { toBuffer: () => Buffer.from('program') } as any
  const mockPoolPDA = { toBuffer: () => Buffer.from('pool_pda') } as any
  const mockMint = { toBuffer: () => Buffer.from('mint') } as any
  const mockOwner = { toBuffer: () => Buffer.from('owner') } as any
  const mockCustodyPDA = { toBuffer: () => Buffer.from('custody_pda') } as any

  const { PublicKey } = require('@solana/web3.js')

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getPoolPDA', () => {
    it('should derive pool PDA with correct seeds', () => {
      const poolName = 'energy-pool'

      getPoolPDA(poolName, mockProgramId)

      expect(PublicKey.findProgramAddressSync).toHaveBeenCalledWith(
        [Buffer.from('pool'), Buffer.from(poolName)],
        mockProgramId
      )
    })

    it('should return the derived public key', () => {
      const result = getPoolPDA('test-pool', mockProgramId)

      expect(result).toBeDefined()
      expect(result.toBuffer).toBeDefined()
    })

    it('should handle different pool names', () => {
      getPoolPDA('solar-pool', mockProgramId)
      getPoolPDA('wind-pool', mockProgramId)

      expect(PublicKey.findProgramAddressSync).toHaveBeenCalledTimes(2)
    })
  })

  describe('getCustodyPDA', () => {
    it('should derive custody PDA with correct seeds', () => {
      getCustodyPDA(mockPoolPDA, mockMint, mockProgramId)

      expect(PublicKey.findProgramAddressSync).toHaveBeenCalledWith(
        [Buffer.from('custody'), mockPoolPDA.toBuffer(), mockMint.toBuffer()],
        mockProgramId
      )
    })

    it('should return the derived public key', () => {
      const result = getCustodyPDA(mockPoolPDA, mockMint, mockProgramId)

      expect(result).toBeDefined()
    })
  })

  describe('getUserPDA', () => {
    it('should derive user PDA with correct seeds', () => {
      getUserPDA(mockOwner, mockProgramId)

      expect(PublicKey.findProgramAddressSync).toHaveBeenCalledWith(
        [Buffer.from('user'), mockOwner.toBuffer()],
        mockProgramId
      )
    })

    it('should return the derived public key', () => {
      const result = getUserPDA(mockOwner, mockProgramId)

      expect(result).toBeDefined()
    })
  })

  describe('getOptionDetailPDA', () => {
    it('should derive option detail PDA with number index', () => {
      const index = 5

      getOptionDetailPDA(
        mockOwner,
        index,
        mockPoolPDA,
        mockCustodyPDA,
        mockProgramId
      )

      expect(PublicKey.findProgramAddressSync).toHaveBeenCalledWith(
        [
          Buffer.from('option'),
          mockOwner.toBuffer(),
          expect.any(Buffer),
          mockPoolPDA.toBuffer(),
          mockCustodyPDA.toBuffer(),
        ],
        mockProgramId
      )
    })

    it('should derive option detail PDA with BN index', () => {
      const { BN } = require('@coral-xyz/anchor')
      const index = new BN(10)

      getOptionDetailPDA(
        mockOwner,
        index,
        mockPoolPDA,
        mockCustodyPDA,
        mockProgramId
      )

      expect(PublicKey.findProgramAddressSync).toHaveBeenCalledWith(
        expect.arrayContaining([
          Buffer.from('option'),
          mockOwner.toBuffer(),
          expect.any(Buffer),
          mockPoolPDA.toBuffer(),
          mockCustodyPDA.toBuffer(),
        ]),
        mockProgramId
      )
    })

    it('should return the derived public key', () => {
      const result = getOptionDetailPDA(
        mockOwner,
        1,
        mockPoolPDA,
        mockCustodyPDA,
        mockProgramId
      )

      expect(result).toBeDefined()
    })
  })

  describe('getCustodyTokenAccountPDA', () => {
    it('should derive custody token account PDA with correct seeds', () => {
      getCustodyTokenAccountPDA(mockPoolPDA, mockMint, mockProgramId)

      expect(PublicKey.findProgramAddressSync).toHaveBeenCalledWith(
        [
          Buffer.from('custody_token_account'),
          mockPoolPDA.toBuffer(),
          mockMint.toBuffer(),
        ],
        mockProgramId
      )
    })

    it('should return the derived public key', () => {
      const result = getCustodyTokenAccountPDA(
        mockPoolPDA,
        mockMint,
        mockProgramId
      )

      expect(result).toBeDefined()
    })
  })

  describe('getContractPDA', () => {
    it('should derive contract PDA with correct seeds', () => {
      getContractPDA(mockProgramId)

      expect(PublicKey.findProgramAddressSync).toHaveBeenCalledWith(
        [Buffer.from('contract')],
        mockProgramId
      )
    })

    it('should return the derived public key', () => {
      const result = getContractPDA(mockProgramId)

      expect(result).toBeDefined()
    })
  })

  describe('getTransferAuthorityPDA', () => {
    it('should derive transfer authority PDA with correct seeds', () => {
      getTransferAuthorityPDA(mockProgramId)

      expect(PublicKey.findProgramAddressSync).toHaveBeenCalledWith(
        [Buffer.from('transfer_authority')],
        mockProgramId
      )
    })

    it('should return the derived public key', () => {
      const result = getTransferAuthorityPDA(mockProgramId)

      expect(result).toBeDefined()
    })
  })

  describe('getLpTokenMintPDA', () => {
    it('should derive LP token mint PDA with correct seeds', () => {
      const poolName = 'liquidity-pool'

      getLpTokenMintPDA(poolName, mockProgramId)

      expect(PublicKey.findProgramAddressSync).toHaveBeenCalledWith(
        [Buffer.from('lp_token_mint'), Buffer.from(poolName)],
        mockProgramId
      )
    })

    it('should return the derived public key', () => {
      const result = getLpTokenMintPDA('test-pool', mockProgramId)

      expect(result).toBeDefined()
    })
  })

  describe('getPrivateBalancePDA', () => {
    it('should derive private balance PDA with correct seeds', () => {
      getPrivateBalancePDA(mockOwner, mockMint, mockProgramId)

      expect(PublicKey.findProgramAddressSync).toHaveBeenCalledWith(
        [
          Buffer.from('private_balance'),
          mockOwner.toBuffer(),
          mockMint.toBuffer(),
        ],
        mockProgramId
      )
    })

    it('should return the derived public key', () => {
      const result = getPrivateBalancePDA(mockOwner, mockMint, mockProgramId)

      expect(result).toBeDefined()
    })
  })

  describe('getNullifierSetPDA', () => {
    it('should derive nullifier set PDA with correct seeds', () => {
      getNullifierSetPDA(mockMint, mockProgramId)

      expect(PublicKey.findProgramAddressSync).toHaveBeenCalledWith(
        [Buffer.from('nullifier_set'), mockMint.toBuffer()],
        mockProgramId
      )
    })

    it('should return the derived public key', () => {
      const result = getNullifierSetPDA(mockMint, mockProgramId)

      expect(result).toBeDefined()
    })
  })

  describe('getMintAuthorityPDA', () => {
    it('should derive mint authority PDA with correct seeds', () => {
      getMintAuthorityPDA(mockMint, mockProgramId)

      expect(PublicKey.findProgramAddressSync).toHaveBeenCalledWith(
        [Buffer.from('mint_authority'), mockMint.toBuffer()],
        mockProgramId
      )
    })

    it('should return the derived public key', () => {
      const result = getMintAuthorityPDA(mockMint, mockProgramId)

      expect(result).toBeDefined()
    })
  })
})
