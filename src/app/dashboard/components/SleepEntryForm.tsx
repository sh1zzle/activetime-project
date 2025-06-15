'use client';

import { useState } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { Plus, Bed, CheckCircle, AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import ImportHealthData from './ImportHealthData';

interface SleepEntryFormProps {
  onSuccess?: () => void;
}

export default function SleepEntryForm({ onSuccess }: SleepEntryFormProps) {
  const [startTime, setStartTime] = useState<Date | undefined>();
  const [endTime, setEndTime] = useState<Date | undefined>();
  const [quality, setQuality] = useState<number>(3);
  const [notes, setNotes] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    // Enhanced validation
    if (!startTime || !endTime) {
      setError('Please provide both start and end times');
      setIsLoading(false);
      return;
    }

    if (endTime <= startTime) {
      setError('End time must be after start time');
      setIsLoading(false);
      return;
    }

    // Check if sleep duration is reasonable (between 1 hour and 16 hours)
    const durationHours =
      (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    if (durationHours < 1) {
      setError('Sleep duration must be at least 1 hour');
      setIsLoading(false);
      return;
    }
    if (durationHours > 16) {
      setError('Sleep duration cannot exceed 16 hours');
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post('/api/sleep', {
        startTime: startTime,
        endTime: endTime,
        quality,
        notes: notes.trim() || undefined,
      });

      console.log('Sleep entry saved:', response.data);

      // Reset form
      setStartTime(undefined);
      setEndTime(undefined);
      setQuality(3);
      setNotes('');
      setSuccess(true);

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }

      // Close dialog after successful submission
      setTimeout(() => {
        setIsDialogOpen(false);
        setSuccess(false);
      }, 2000);
    } catch (err) {
      console.error('Error saving sleep entry:', err);
      setError('Failed to save sleep entry. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getQualityLabel = (value: number) => {
    const labels = {
      1: 'Poor',
      2: 'Fair',
      3: 'Good',
      4: 'Very Good',
      5: 'Excellent',
    };
    return labels[value as keyof typeof labels];
  };

  return (
    <div className='bg-white p-6 rounded-lg shadow-md'>
      <div className='flex items-center justify-between mb-4'>
        <div className='flex items-center space-x-2'>
          <Bed className='h-5 w-5 text-blue-600' />
          <h2 className='text-xl font-semibold'>Sleep Tracker</h2>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className='flex items-center'>
              <Plus className='h-4 w-4' />
              Log Sleep
            </Button>
          </DialogTrigger>
          <DialogContent className='sm:max-w-[500px]'>
            <DialogHeader>
              <DialogTitle className='flex items-center space-x-2'>
                <Bed className='h-5 w-5 text-blue-600' />
                <span>Record Sleep Entry</span>
              </DialogTitle>
              <DialogDescription>
                Track your sleep patterns to analyze your rest quality and
                duration.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className='space-y-6'>
              {success && (
                <div className='flex items-center space-x-2 p-3 bg-green-50 text-green-700 rounded-md border border-green-200'>
                  <CheckCircle className='h-4 w-4' />
                  <span>Sleep entry saved successfully!</span>
                </div>
              )}

              {error && (
                <div className='flex items-center space-x-2 p-3 bg-red-50 text-red-700 rounded-md border border-red-200'>
                  <AlertCircle className='h-4 w-4' />
                  <span>{error}</span>
                </div>
              )}

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='startTime'>Sleep Start Time</Label>
                  <DateTimePicker
                    value={startTime}
                    onChange={setStartTime}
                    placeholder='Start Time'
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='endTime'>Sleep End Time</Label>
                  <DateTimePicker
                    value={endTime}
                    onChange={setEndTime}
                    placeholder='End Time'
                  />
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='quality'>
                  Sleep Quality: {getQualityLabel(quality)} ({quality}/5)
                </Label>
                <div className='px-3'>
                  <input
                    type='range'
                    id='quality'
                    min='1'
                    max='5'
                    value={quality}
                    onChange={(e) => setQuality(Number(e.target.value))}
                    className='w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider'
                  />
                  <div className='flex justify-between text-xs text-gray-500 mt-1'>
                    <span>Poor</span>
                    <span>Fair</span>
                    <span>Good</span>
                    <span>Very Good</span>
                    <span>Excellent</span>
                  </div>
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='notes'>Notes (optional)</Label>
                <textarea
                  id='notes'
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none'
                  placeholder='How was your sleep? Any factors that affected it?'
                />
              </div>

              <DialogFooter>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type='submit'
                  disabled={isLoading}
                  className='min-w-[100px]'
                >
                  {isLoading ? 'Saving...' : 'Save Entry'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Sleep Summary Card */}
      <div className='bg-gray-50 rounded-lg p-4'>
        <div className='text-sm text-gray-600 mb-2'>Quick Stats</div>
        <div className='grid grid-cols-2 gap-4 text-sm'>
          <div>
            <div className='font-medium text-gray-900'>Last Entry</div>
            <div className='text-gray-500'>
              {startTime && endTime
                ? format(endTime, 'MMM d, HH:mm')
                : 'No recent entry'}
            </div>
          </div>
          <div>
            <div className='font-medium text-gray-900'>Duration</div>
            <div className='text-gray-500'>
              {startTime && endTime
                ? `${
                    Math.round(
                      ((endTime.getTime() - startTime.getTime()) /
                        (1000 * 60 * 60)) *
                        10
                    ) / 10
                  }h`
                : '-- hours'}
            </div>
          </div>
        </div>
      </div>

      <div className='mt-6'>
        <ImportHealthData />
      </div>
    </div>
  );
}
