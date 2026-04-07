'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'

interface ClaimStealthModalProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export default function ClaimStealthModal({ open, onOpenChange }: ClaimStealthModalProps) {
  const [stealthLink, setStealthLink] = useState('')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Claim Stealth Payment</DialogTitle>
          <DialogDescription>
            Paste your stealth payment link or scan the QR code to claim a private payment sent to you.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Stealth Link</label>
            <Input
              placeholder="gridtokenx://stealth/..."
              value={stealthLink}
              onChange={(e) => setStealthLink(e.target.value)}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            The stealth link contains an encrypted viewing key that allows you to claim the payment privately.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange?.(false)}>
            Cancel
          </Button>
          <Button disabled={!stealthLink}>Claim Payment</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
