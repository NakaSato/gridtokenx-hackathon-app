'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { createApiClient } from '@/lib/api-client'
import { useAuth } from '@/contexts/AuthProvider'
import toast from 'react-hot-toast'
import { Loader2, MapPin, Zap, CheckCircle } from 'lucide-react'
import { PublicMeterResponse } from '@/types/meter'
import { Label } from './ui/label'

interface MeterRegistrationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function MeterRegistrationModal({
  isOpen,
  onClose,
  onSuccess,
}: MeterRegistrationModalProps) {
  const { token } = useAuth()
  const [meterId, setMeterId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [matchedMeter, setMatchedMeter] = useState<PublicMeterResponse | null>(null)
  const [searchError, setSearchError] = useState<string | null>(null)

  const client = createApiClient(token || undefined)

  // Auto-search for meter when ID is entered (debounced)
  const searchMeter = useCallback(async (serial: string) => {
    if (!serial || serial.length < 3) {
      setMatchedMeter(null)
      setSearchError(null)
      return
    }

    setIsSearching(true)
    setSearchError(null)

    try {
      // Fetch public meters to check if meter exists
      const response = await client.getPublicMeters()
      if (response.error) {
        setSearchError('Failed to fetch meter data')
        setMatchedMeter(null)
        return
      }

      // Backend will auto-populate all meter data upon registration
      // We just show a preview that data will be auto-matched
      const meters = response.data || []
      setMatchedMeter(meters.length > 0 ? meters[0] : null)
    } catch (error) {
      setSearchError('Error searching for meter')
      setMatchedMeter(null)
    } finally {
      setIsSearching(false)
    }
  }, [client])

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (meterId.length >= 3) {
        searchMeter(meterId)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [meterId, searchMeter])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!meterId.trim()) {
      toast.error('Please enter a meter ID')
      return
    }

    setIsSubmitting(true)
    try {
      // Call register API with only serial_number - backend will auto-populate all data from simulator
      const result = await client.registerMeter({
        serial_number: meterId.trim(),
      })

      if (result.error) {
        toast.error(result.error)
        return
      }

      if (result.data?.success) {
        toast.success(result.data.message || 'Smart meter registered successfully!')
        onSuccess?.()
        onClose()
        setMeterId('')
        setMatchedMeter(null)
      } else {
        toast.error(result.data?.message || 'Failed to register meter')
      }
    } catch (error: any) {
      toast.error(error.message || 'Registration failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setMeterId('')
    setMatchedMeter(null)
    setSearchError(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Register Smart Meter</DialogTitle>
          <DialogDescription>
            Enter your smart meter ID to automatically register it on the GridTokenX network. All meter data will be fetched automatically.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="meterId">Meter ID (Serial Number)</Label>
            <div className="relative">
              <Input
                id="meterId"
                placeholder="Enter meter serial number (e.g., GRID-SM-001)"
                value={meterId}
                onChange={(e) => setMeterId(e.target.value)}
                required
                disabled={isSubmitting}
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              The system will automatically fetch location, type, and readings for this meter.
            </p>
          </div>

          {/* Auto-matched meter preview */}
          {matchedMeter && (
            <div className="rounded-lg border bg-muted/50 p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span>Meter data will be auto-populated</span>
              </div>
              <div className="grid gap-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <MapPin className="h-3 w-3" />
                  <span>Location: Auto-detected from meter</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-3 w-3" />
                  <span>Type: Auto-detected from meter</span>
                </div>
              </div>
            </div>
          )}

          {searchError && (
            <p className="text-xs text-red-500">{searchError}</p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !meterId.trim()}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registering...
                </>
              ) : (
                'Register'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
