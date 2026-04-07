'use client'

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react'
import { useApiClient } from '@/hooks/useApi'
import type {
  LoginResponse,
  RegisterResponse,
  UserProfile,
  ProfileUpdateRequest,
  Role,
} from '@/types/auth'

interface User {
  id?: string
  username: string
  email: string
  role: string
  blockchain_registered: boolean
  email_verified?: boolean
  wallet_address?: string
  balance?: number
  locked_amount?: number
  locked_energy?: number
}

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (
    username: string,
    password: string,
    rememberMe?: boolean
  ) => Promise<LoginResponse>
  logout: () => Promise<void>
  register: (userData: {
    username: string
    email: string
    password: string
    first_name: string
    last_name: string
    role?: Role
    wallet_address?: string
  }) => Promise<RegisterResponse>
  loginWithWallet: (data: {
    wallet_address: string
    signature: string
    message: string
    timestamp: number
  }) => Promise<LoginResponse>
  getProfile: () => Promise<UserProfile | null>
  updateProfile: (profileData: ProfileUpdateRequest) => Promise<UserProfile>
  updateWallet: (walletAddress: string) => Promise<UserProfile | null>
  checkAuth: () => Promise<void>
  refreshToken: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const apiClient = useApiClient()

  // Check authentication status on mount
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    setIsLoading(true)
    try {
      // Try to get token from localStorage first, then sessionStorage
      const storedToken =
        localStorage.getItem('access_token') ||
        sessionStorage.getItem('access_token')
      const storedUser =
        localStorage.getItem('user') || sessionStorage.getItem('user')
      const expiresAt =
        localStorage.getItem('token_expires_at') ||
        sessionStorage.getItem('token_expires_at')

      if (storedToken && storedUser) {
        // Check if token is expired
        if (expiresAt && Date.now() > parseInt(expiresAt)) {
          await logout()
          return
        }

        setToken(storedToken)
        try {
          if (storedUser && storedUser !== 'undefined') {
            setUser(JSON.parse(storedUser))
          } else {
            // Invalid user data, clear storage
            await logout()
            return
          }
        } catch (e) {
          console.error('Failed to parse stored user:', e)
          await logout()
          return
        }

        // Set token in API client
        apiClient.setToken(storedToken)

        // Validate token with backend and update user state with latest profile
        try {
          const response = await apiClient.getProfile()
          if (response.error || !response.data) {
            await logout()
            return
          }
          // Update user state with latest profile data (includes wallet_address)
          const profileData = response.data as User
          const updatedUser = { ...JSON.parse(storedUser), ...profileData }
          setUser(updatedUser)
          // Persist updated user data
          if (localStorage.getItem('user')) {
            localStorage.setItem('user', JSON.stringify(updatedUser))
          }
          if (sessionStorage.getItem('user')) {
            sessionStorage.setItem('user', JSON.stringify(updatedUser))
          }
        } catch (error) {
          console.error('Token validation failed:', error)
          await logout()
          return
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      await logout()
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (
    username: string,
    password: string,
    rememberMe: boolean = false
  ): Promise<LoginResponse> => {
    setIsLoading(true)
    try {
      const response = await apiClient.login(username, password)

      if (response.error || !response.data) {
        throw new Error(response.error || 'Login failed')
      }

      const loginData: LoginResponse = response.data
      const expirationTime = Date.now() + loginData.expires_in * 1000

      // Store token and user data
      if (rememberMe) {
        localStorage.setItem('access_token', loginData.access_token)
        localStorage.setItem('token_expires_at', String(expirationTime))
        localStorage.setItem('user', JSON.stringify(loginData.user))
      } else {
        sessionStorage.setItem('access_token', loginData.access_token)
        sessionStorage.setItem('token_expires_at', String(expirationTime))
        sessionStorage.setItem('user', JSON.stringify(loginData.user))
      }

      setToken(loginData.access_token)
      setUser(loginData.user)
      apiClient.setToken(loginData.access_token)

      return loginData
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      // Call backend logout endpoint
      if (token) {
        await apiClient.logout()
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Clear local storage regardless of backend response
      localStorage.removeItem('access_token')
      localStorage.removeItem('token_expires_at')
      localStorage.removeItem('user')
      sessionStorage.removeItem('access_token')
      sessionStorage.removeItem('token_expires_at')
      sessionStorage.removeItem('user')

      setToken(null)
      setUser(null)
      apiClient.clearToken()
    }
  }

  const register = async (userData: {
    username: string
    email: string
    password: string
    first_name: string
    last_name: string
    role?: Role
    wallet_address?: string
  }): Promise<RegisterResponse> => {
    setIsLoading(true)
    try {
      const response = await apiClient.register(userData)

      if (response.error || !response.data) {
        throw new Error(response.error || 'Registration failed')
      }

      return response.data
    } finally {
      setIsLoading(false)
    }
  }

  const loginWithWallet = async (data: {
    wallet_address: string
    signature: string
    message: string
    timestamp: number
  }): Promise<LoginResponse> => {
    setIsLoading(true)
    try {
      const response = await apiClient.verifyWalletSignature(data)

      if (response.error || !response.data) {
        throw new Error(response.error || 'Wallet login failed')
      }

      const loginData: LoginResponse = response.data
      const expirationTime = Date.now() + loginData.expires_in * 1000

      // Store token and user data (always in session for safety, or local based on preference)
      // For wallet, we default to localStorage for convenience like standard dApps
      localStorage.setItem('access_token', loginData.access_token)
      localStorage.setItem('token_expires_at', String(expirationTime))
      localStorage.setItem('user', JSON.stringify(loginData.user))

      setToken(loginData.access_token)
      setUser(loginData.user)
      apiClient.setToken(loginData.access_token)

      return loginData
    } finally {
      setIsLoading(false)
    }
  }

  const getProfile = async (): Promise<UserProfile | null> => {
    try {
      const response = await apiClient.getProfile()
      if (response.error || !response.data) {
        return null
      }
      return response.data as UserProfile
    } catch (error) {
      console.error('Get profile failed:', error)
      return null
    }
  }

  const updateProfile = async (
    profileData: ProfileUpdateRequest
  ): Promise<UserProfile> => {
    try {
      const response = await apiClient.updateProfile(profileData)
      if (response.error || !response.data) {
        throw new Error(response.error || 'Profile update failed')
      }
      return response.data as UserProfile
    } catch (error) {
      console.error('Update profile failed:', error)
      throw error
    }
  }

  const updateWallet = async (
    walletAddress: string
  ): Promise<UserProfile | null> => {
    try {
      // Ensure we have a valid token
      if (!token) {
        throw new Error('Not authenticated. Please sign in first.')
      }

      // Validate wallet address format (basic check)
      if (!walletAddress || walletAddress.length < 32) {
        throw new Error('Invalid wallet address format')
      }

      const response = await apiClient.updateWallet(walletAddress)

      if (response.error || !response.data) {
        // Provide more specific error messages based on status code
        let errorMessage = 'Wallet update failed'

        if (response.status === 401) {
          errorMessage = 'Authentication expired. Please sign in again.'
          await logout()
        } else if (response.status === 400) {
          errorMessage = response.error || 'Invalid wallet address'
        } else if (response.status === 409) {
          errorMessage = 'This wallet is already linked to another account'
        } else if (response.error) {
          errorMessage = response.error
        }

        throw new Error(errorMessage)
      }

      // Update local user state with new wallet address
      if (user) {
        const updatedUser = { ...user, wallet_address: walletAddress }
        setUser(updatedUser)

        // Update in both storage locations
        const storedInLocal = localStorage.getItem('user')
        const storedInSession = sessionStorage.getItem('user')

        if (storedInLocal) {
          localStorage.setItem('user', JSON.stringify(updatedUser))
        }
        if (storedInSession) {
          sessionStorage.setItem('user', JSON.stringify(updatedUser))
        }
      }

      return response.data
    } catch (error) {
      console.error('Update wallet failed:', error)
      throw error
    }
  }

  const refreshToken = async (): Promise<boolean> => {
    try {
      // This would implement token refresh logic
      // For now, we'll just check if current token is still valid
      const response = await apiClient.getProfile()
      return !response.error && !!response.data
    } catch (error) {
      console.error('Token refresh failed:', error)
      return false
    }
  }

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    logout,
    register,
    loginWithWallet,
    getProfile,
    updateProfile,
    updateWallet,
    checkAuth,
    refreshToken,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
