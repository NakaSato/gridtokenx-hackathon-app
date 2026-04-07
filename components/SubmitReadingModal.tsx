'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import toast from 'react-hot-toast';
import { createApiClient } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthProvider';

interface SubmitReadingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  meterSerial: string;
}

export function SubmitReadingModal({ isOpen, onClose, onSuccess, meterSerial }: SubmitReadingModalProps) {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    kwh: '',
    walletAddress: user?.wallet_address || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error('Please login first');
      return;
    }

    const kwh = parseFloat(formData.kwh);
    if (isNaN(kwh) || kwh === 0) {
      toast.error('Please enter a valid kWh amount (can be negative for consumption)');
      return;
    }

    setLoading(true);
    try {
      const client = createApiClient(token);
      const response = await client.submitMeterData({
        meter_serial: meterSerial,
        kwh_amount: kwh,
        wallet_address: formData.walletAddress || undefined,
        reading_timestamp: new Date().toISOString()
      });

      if (response.error) {
        toast.error(response.error);
        return;
      }

      const msg = response.data?.message || '';

      if (response.data?.minted) {
        // Synchronous mint completed
        toast.success(
          `Reading submitted and ${kwh > 0 ? 'minted' : 'burned'} successfully!`,
          { duration: 5000 }
        );
      } else if (msg.toLowerCase().includes('queued') || msg.toLowerCase().includes('processing')) {
        // Async queue accepted – this is the normal happy path
        toast.success(
          `Reading submitted! Minting is being processed in the background.`,
          { duration: 5000 }
        );
      } else {
        // Genuine failure (e.g. Oracle validation, queue push error)
        toast.error(
          `Reading submitted, but minting failed: ${msg || 'unknown error'}. You can retry from the dashboard.`,
          { duration: 6000 }
        );
      }

      onSuccess();
      onClose();

      // Reset form
      setFormData({
        kwh: '',
        walletAddress: user?.wallet_address || '',
      });

    } catch (error) {
      console.error(error);
      toast.error('Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Submit Meter Reading</DialogTitle>
          <DialogDescription>
            Manually submit a reading for meter <strong>{meterSerial}</strong>.
            Positive values generate tokens.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="kwh">Energy Amount (kWh)</Label>
            <Input
              id="kwh"
              type="number"
              step="0.01"
              placeholder="e.g., 10.5 or -5.2"
              value={formData.kwh}
              onChange={(e) => setFormData({ ...formData, kwh: e.target.value })}
              required
            />
            <p className="text-xs text-muted-foreground">
              Use positive for generation (Mint), negative for consumption (Burn).
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="walletAddress">Wallet Address (Optional)</Label>
            <Input
              id="walletAddress"
              placeholder="Recipient wallet address"
              value={formData.walletAddress}
              onChange={(e) => setFormData({ ...formData, walletAddress: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Defaults to registered user wallet.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !token}>
              {loading ? 'Submitting...' : 'Submit Reading'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
