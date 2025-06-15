'use client';

import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  TrendingUp,
  Target,
  Zap,
  Clock,
  CheckSquare,
  Plus,
  RefreshCw,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { Badge } from '@/components/ui/badge';

interface ProductivityFormData {
  date: string;
  productivityRating: number;
  tasksCompleted: number;
  focusQuality: number;
  energyLevel: number;
  workHours: number;
  notes: string;
}

interface ProductivityEntryFormProps {
  onSuccess?: () => void;
}

export default function ProductivityEntryForm({
  onSuccess,
}: ProductivityEntryFormProps = {}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const [formData, setFormData] = useState<ProductivityFormData>({
    date: new Date().toISOString().split('T')[0],
    productivityRating: 3,
    tasksCompleted: 0,
    focusQuality: 3,
    energyLevel: 3,
    workHours: 8,
    notes: '',
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleRatingChange = (field: string, rating: number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: rating,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      await axios.post('/api/productivity', formData);
      setSuccess(true);
      onSuccess?.();
      setTimeout(() => {
        router.refresh();
        setSuccess(false);
      }, 2000);
    } catch (err: unknown) {
      console.error('Error submitting productivity entry:', err);
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as {
          response?: { status?: number; data?: { error?: string } };
        };
        if (axiosError.response?.status === 409) {
          setError(
            'You already have a productivity entry for this date. Please choose a different date or update the existing entry.'
          );
        } else {
          setError(
            axiosError.response?.data?.error ||
              'Failed to save productivity entry. Please try again.'
          );
        }
      } else {
        setError('Failed to save productivity entry. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 3.5) return 'text-blue-600';
    if (rating >= 2.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRatingLabel = (rating: number) => {
    if (rating >= 4.5) return 'Excellent';
    if (rating >= 3.5) return 'Good';
    if (rating >= 2.5) return 'Fair';
    return 'Poor';
  };

  const RatingSelector = ({
    label,
    value,
    onChange,
    icon: Icon,
  }: {
    label: string;
    value: number;
    onChange: (rating: number) => void;
    icon: React.ComponentType<{ className?: string }>;
  }) => (
    <div className='space-y-2'>
      <Label className='flex items-center space-x-2'>
        <Icon className='h-4 w-4' />
        <span>{label}</span>
        <Badge variant='outline' className={getRatingColor(value)}>
          {getRatingLabel(value)}
        </Badge>
      </Label>
      <div className='flex space-x-1'>
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type='button'
            onClick={() => onChange(rating)}
            className={`w-8 h-8 rounded-full border-2 transition-colors ${
              rating <= value
                ? 'bg-blue-500 border-blue-500 text-white'
                : 'border-gray-300 hover:border-blue-300'
            }`}
          >
            {rating}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <Card className='w-full max-w-2xl mx-auto'>
      <CardHeader>
        <CardTitle className='flex items-center space-x-2'>
          <TrendingUp className='h-5 w-5 text-blue-600' />
          <span>Log Productivity</span>
        </CardTitle>
        <p className='text-sm text-gray-600'>
          Track your daily productivity metrics to understand your performance
          patterns.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className='space-y-6'>
          {/* Date */}
          <div className='space-y-2'>
            <Label htmlFor='date' className='flex items-center space-x-2'>
              <Calendar className='h-4 w-4' />
              <span>Date</span>
            </Label>
            <Input
              id='date'
              name='date'
              type='date'
              value={formData.date}
              onChange={handleInputChange}
              max={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          {/* Rating Fields */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <RatingSelector
              label='Overall Productivity'
              value={formData.productivityRating}
              onChange={(rating) =>
                handleRatingChange('productivityRating', rating)
              }
              icon={TrendingUp}
            />
            <RatingSelector
              label='Focus Quality'
              value={formData.focusQuality}
              onChange={(rating) => handleRatingChange('focusQuality', rating)}
              icon={Target}
            />
            <RatingSelector
              label='Energy Level'
              value={formData.energyLevel}
              onChange={(rating) => handleRatingChange('energyLevel', rating)}
              icon={Zap}
            />
          </div>

          {/* Numeric Fields */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label
                htmlFor='tasksCompleted'
                className='flex items-center space-x-2'
              >
                <CheckSquare className='h-4 w-4' />
                <span>Tasks Completed</span>
              </Label>
              <Input
                id='tasksCompleted'
                name='tasksCompleted'
                type='number'
                min='0'
                value={formData.tasksCompleted}
                onChange={handleInputChange}
                placeholder='0'
                required
              />
            </div>
            <div className='space-y-2'>
              <Label
                htmlFor='workHours'
                className='flex items-center space-x-2'
              >
                <Clock className='h-4 w-4' />
                <span>Work Hours</span>
              </Label>
              <Input
                id='workHours'
                name='workHours'
                type='number'
                min='0'
                max='24'
                step='0.5'
                value={formData.workHours}
                onChange={handleInputChange}
                placeholder='8'
                required
              />
            </div>
          </div>

          {/* Notes */}
          <div className='space-y-2'>
            <Label htmlFor='notes'>Notes (Optional)</Label>
            <textarea
              id='notes'
              name='notes'
              value={formData.notes}
              onChange={handleInputChange}
              placeholder='Any additional notes about your productivity today...'
              rows={3}
              className='flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className='bg-red-50 border border-red-200 rounded-md p-3'>
              <p className='text-sm text-red-600'>{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className='bg-green-50 border border-green-200 rounded-md p-3'>
              <p className='text-sm text-green-600'>
                Productivity entry saved successfully! 🎉
              </p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type='submit'
            disabled={isSubmitting}
            className='w-full'
            size='lg'
          >
            {isSubmitting ? (
              <>
                <RefreshCw className='h-4 w-4 mr-2 animate-spin' />
                Saving...
              </>
            ) : (
              <>
                <Plus className='h-4 w-4 mr-2' />
                Log Productivity
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
