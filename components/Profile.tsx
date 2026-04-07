'use client'
import { DialogTitle } from '@radix-ui/react-dialog'
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog'
import { Separator } from './ui/separator'
import { Label } from './ui/label'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { useState, useRef, useEffect, useCallback } from 'react'
import { User, Upload, Copy, Check, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { useWallet } from '@solana/wallet-adapter-react'
import { useAuth } from '@/contexts/AuthProvider'
import { useApiClient } from '@/hooks/useApi'
import type { UserProfile } from '@/types/auth'
import toast from 'react-hot-toast'

interface TradingStats {
  totalTrades: number
  totalVolume: string
  winRate: string
  totalPnl: string
}

export default function Profile() {
  const { publicKey, connected } = useWallet()
  const { user: authUser, isAuthenticated, token } = useAuth()
  const client = useApiClient(token || undefined)

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<TradingStats>({
    totalTrades: 0,
    totalVolume: '0 kWh',
    winRate: '0%',
    totalPnl: '+0 THB'
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  // Local form state for editing
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [meterZone, setMeterZone] = useState<number | null>(null)
  const [meterId, setMeterId] = useState<string | null>(null)

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchProfileData = useCallback(async () => {
    setIsLoading(true)
    try {
      // 1. Fetch real user profile
      const profileResponse = await client.getProfile()
      if (profileResponse.data) {
        const userData = profileResponse.data as UserProfile
        setProfile(userData)
        setUsername(userData.username || '')
        setEmail(userData.email || '')
        setFirstName(userData.first_name || '')
        setLastName(userData.last_name || '')
      }

      // 2. Fetch Meter Info (Zone)
      const metersResponse = await client.getMyMeters()
      if (metersResponse.data && metersResponse.data.length > 0) {
        const primaryMeter = metersResponse.data[0]
        setMeterZone(primaryMeter.zone_id ?? null)
        setMeterId(primaryMeter.id)
      }

      // 3. Fetch trading analytics (7d by default)
      const statsResponse = await client.getUserAnalytics({ timeframe: '7d' })
      if (statsResponse.data) {
        const s = statsResponse.data
        const totalCreated = (s.as_seller.offers_created || 0) + (s.as_buyer.orders_created || 0)
        const totalFulfilled = (s.as_seller.offers_fulfilled || 0) + (s.as_buyer.orders_fulfilled || 0)
        const winRate = totalCreated > 0
          ? ((totalFulfilled / totalCreated) * 100).toFixed(1)
          : '0.0'

        setStats({
          totalTrades: s.overall.total_transactions || 0,
          totalVolume: `${(s.overall.total_volume_kwh || 0).toLocaleString()} kWh`,
          winRate: `${winRate}%`,
          totalPnl: `${s.overall.net_revenue_usd >= 0 ? '+' : ''}${s.overall.net_revenue_usd.toLocaleString()} THB`
        })
      }
    } catch (error) {
      console.error('Failed to fetch profile data:', error)
      toast.error('Failed to load profile data')
    } finally {
      setIsLoading(false)
    }
  }, [client])

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchProfileData()
    }
  }, [isAuthenticated, token, fetchProfileData])

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB')
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    try {
      const response = await client.updateProfile({
        email,
        first_name: firstName,
        last_name: lastName
      })
      if (response.status === 200) {
        toast.success('Profile updated successfully')
        setIsEditing(false)
        fetchProfileData()
      } else {
        toast.error(response.error || 'Failed to update profile')
      }
    } catch (error) {
      toast.error('Error updating profile')
    }
  }

  const handleCancel = () => {
    if (profile) {
      setUsername(profile.username || '')
      setEmail(profile.email || '')
      setFirstName(profile.first_name || '')
      setLastName(profile.last_name || '')
    }
    setIsEditing(false)
  }

  const handleCopyAddress = async () => {
    const address = profile?.wallet_address || publicKey?.toBase58()
    if (address) {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }

  return (
    <Dialog>
      <DialogTrigger className="hidden sm:flex">
        <div className="rounded-sm bg-secondary p-[9px] text-foreground hover:text-primary">
          <User className="h-4 w-4" />
        </div>
      </DialogTrigger>
      <DialogContent className="flex w-[520px] flex-col border-none bg-accent p-5 sm:rounded-sm">
        <DialogTitle className="text-base font-medium text-foreground">
          Profile {isLoading && <Loader2 className="inline ml-2 h-4 w-4 animate-spin" />}
        </DialogTitle>
        <Separator className="bg-secondary" />
        <div className="flex w-full flex-col space-y-5">
          {/* Profile Picture */}
          <div className="flex w-full flex-col items-center space-y-3">
            <div
              className="group relative flex h-20 w-20 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-gradient-primary"
              onClick={handleAvatarClick}
            >
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt="Profile Avatar"
                  fill
                  className="object-cover"
                />
              ) : (
                <User className="h-10 w-10 text-background" />
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                <Upload className="h-6 w-6 text-white" />
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              variant="ghost"
              className="text-xs text-primary hover:text-primary/80"
              onClick={handleAvatarClick}
            >
              Change Avatar
            </Button>
          </div>

          {/* Wallet Address */}
          {(profile?.wallet_address || (connected && publicKey)) && (
            <div className="flex w-full flex-col space-y-[14px]">
              <div className="flex justify-between items-center">
                <Label className="text-xs font-medium text-foreground">
                  Wallet Address
                </Label>
                {meterZone !== null && (
                  <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                    Zone {meterZone}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between rounded-sm border bg-secondary px-3 py-2">
                <span className="font-mono text-xs text-foreground">
                  {shortenAddress(profile?.wallet_address || publicKey!.toBase58())}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyAddress}
                  className="h-6 w-6 p-0 hover:bg-accent"
                >
                  {copied ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3 text-secondary-foreground" />
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Username */}
          <div className="flex w-full flex-col space-y-[14px]">
            <Label className="text-xs font-medium text-foreground">
              Username
            </Label>
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="rounded-sm border bg-secondary px-3 py-2 text-xs focus:border-primary"
              disabled={true} // Username usually immutable
            />
          </div>

          {/* Display Name */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex w-full flex-col space-y-[14px]">
              <Label className="text-xs font-medium text-foreground">First Name</Label>
              <Input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="rounded-sm border bg-secondary px-3 py-2 text-xs focus:border-primary"
                disabled={!isEditing}
              />
            </div>
            <div className="flex w-full flex-col space-y-[14px]">
              <Label className="text-xs font-medium text-foreground">Last Name</Label>
              <Input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="rounded-sm border bg-secondary px-3 py-2 text-xs focus:border-primary"
                disabled={!isEditing}
              />
            </div>
          </div>

          {/* Email */}
          <div className="flex w-full flex-col space-y-[14px]">
            <Label className="text-xs font-medium text-foreground">Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-sm border bg-secondary px-3 py-2 text-xs focus:border-primary"
              disabled={!isEditing}
            />
          </div>

          {/* Stats */}
          <div className="flex w-full flex-col space-y-3">
            <Label className="text-xs font-medium text-foreground">
              Trading Stats (Last 7 Days)
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col rounded-sm bg-secondary p-3">
                <span className="text-xs text-secondary-foreground">
                  Total Trades
                </span>
                <span className="text-base font-semibold text-foreground">
                  {stats.totalTrades}
                </span>
              </div>
              <div className="flex flex-col rounded-sm bg-secondary p-3">
                <span className="text-xs text-secondary-foreground">
                  Total Volume
                </span>
                <span className="text-base font-semibold text-foreground">
                  {stats.totalVolume}
                </span>
              </div>
              <div className="flex flex-col rounded-sm bg-secondary p-3">
                <span className="text-xs text-secondary-foreground">
                  Trade Fulfillment
                </span>
                <span className="text-base font-semibold text-green-500">
                  {stats.winRate}
                </span>
              </div>
              <div className="flex flex-col rounded-sm bg-secondary p-3">
                <span className="text-xs text-secondary-foreground">
                  Net Revenue
                </span>
                <span className={`text-base font-semibold ${stats.totalPnl.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                  {stats.totalPnl}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            {isEditing ? (
              <>
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="flex-1 border-secondary text-xs hover:border-primary"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  className="flex-1 bg-primary text-xs text-background hover:bg-gradient-primary"
                >
                  Save Changes
                </Button>
              </>
            ) : (
              <Button
                onClick={() => setIsEditing(true)}
                className="w-full bg-primary text-xs text-background hover:bg-gradient-primary"
              >
                Edit Profile
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
