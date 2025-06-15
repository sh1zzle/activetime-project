'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  TrendingUp,
  Target,
  Zap,
  CheckSquare,
  Clock,
  Calendar,
  FileText,
  Trash2,
  RefreshCw,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ProductivityEntry {
  _id: string;
  date: string;
  productivityRating: number;
  tasksCompleted: number;
  focusQuality: number;
  energyLevel: number;
  workHours: number;
  notes?: string;
  efficiencyScore: number;
  performanceScore: number;
  createdAt: string;
  updatedAt: string;
}

export default function ProductivityHistory() {
  const [entries, setEntries] = useState<ProductivityEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  const fetchEntries = useCallback(async (pageNum: number = 1) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get(
        `/api/productivity?page=${pageNum}&limit=20`
      );
      setEntries(response.data.data);
      setTotalPages(response.data.pagination.pages);
      setPage(pageNum);
    } catch (err) {
      console.error('Error fetching productivity entries:', err);
      setError('Failed to load productivity history. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this productivity entry?')) {
      return;
    }

    try {
      await axios.delete(`/api/productivity?id=${id}`);
      fetchEntries(page); // Refresh current page
    } catch (err) {
      console.error('Error deleting productivity entry:', err);
      alert('Failed to delete entry. Please try again.');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getRatingBadge = (rating: number) => {
    let color = 'bg-gray-500';

    if (rating >= 4.5) {
      color = 'bg-green-500';
    } else if (rating >= 3.5) {
      color = 'bg-blue-500';
    } else if (rating >= 2.5) {
      color = 'bg-yellow-500';
    } else {
      color = 'bg-red-500';
    }

    return (
      <Badge variant='outline' className={`text-white ${color}`}>
        {rating.toFixed(1)}
      </Badge>
    );
  };

  const getEfficiencyColor = (score: number) => {
    if (score >= 3) return 'text-green-600';
    if (score >= 2) return 'text-blue-600';
    if (score >= 1) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center space-x-2'>
            <TrendingUp className='h-5 w-5' />
            <span>Productivity History</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex items-center justify-center py-8'>
            <RefreshCw className='h-6 w-6 animate-spin text-blue-500' />
            <span className='ml-2 text-gray-600'>
              Loading your productivity history...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center space-x-2'>
            <TrendingUp className='h-5 w-5' />
            <span>Productivity History</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-center py-8'>
            <div className='text-red-500 mb-4'>{error}</div>
            <Button onClick={() => fetchEntries(page)} variant='outline'>
              <RefreshCw className='h-4 w-4 mr-2' />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (entries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center space-x-2'>
            <TrendingUp className='h-5 w-5' />
            <span>Productivity History</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-center py-12'>
            <TrendingUp className='h-12 w-12 text-gray-400 mx-auto mb-4' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>
              No Productivity Data
            </h3>
            <p className='text-gray-500 mb-4'>
              Start logging your daily productivity to see your history and
              trends.
            </p>
            <Badge variant='outline'>Track your first productive day!</Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center space-x-2'>
            <TrendingUp className='h-5 w-5 text-blue-600' />
            <span>Productivity History</span>
          </CardTitle>
          <Button
            onClick={() => fetchEntries(page)}
            variant='outline'
            size='sm'
          >
            <RefreshCw className='h-4 w-4 mr-2' />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {entries.map((entry) => (
            <div
              key={entry._id}
              className='border rounded-lg p-4 hover:bg-gray-50 transition-colors'
            >
              <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0'>
                {/* Date and Basic Info */}
                <div className='flex items-center space-x-4'>
                  <div className='flex items-center space-x-2'>
                    <Calendar className='h-4 w-4 text-gray-500' />
                    <span className='font-medium'>
                      {formatDate(entry.date)}
                    </span>
                  </div>
                </div>

                {/* Metrics */}
                <div className='grid grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6'>
                  <div className='text-center'>
                    <div className='flex items-center justify-center space-x-1 mb-1'>
                      <TrendingUp className='h-3 w-3 text-blue-500' />
                      <span className='text-xs text-gray-500'>
                        Productivity
                      </span>
                    </div>
                    {getRatingBadge(entry.productivityRating)}
                  </div>

                  <div className='text-center'>
                    <div className='flex items-center justify-center space-x-1 mb-1'>
                      <Target className='h-3 w-3 text-green-500' />
                      <span className='text-xs text-gray-500'>Focus</span>
                    </div>
                    {getRatingBadge(entry.focusQuality)}
                  </div>

                  <div className='text-center'>
                    <div className='flex items-center justify-center space-x-1 mb-1'>
                      <Zap className='h-3 w-3 text-yellow-500' />
                      <span className='text-xs text-gray-500'>Energy</span>
                    </div>
                    {getRatingBadge(entry.energyLevel)}
                  </div>

                  <div className='text-center'>
                    <div className='flex items-center justify-center space-x-1 mb-1'>
                      <CheckSquare className='h-3 w-3 text-purple-500' />
                      <span className='text-xs text-gray-500'>Tasks</span>
                    </div>
                    <Badge variant='secondary'>{entry.tasksCompleted}</Badge>
                  </div>

                  <div className='text-center'>
                    <div className='flex items-center justify-center space-x-1 mb-1'>
                      <Clock className='h-3 w-3 text-orange-500' />
                      <span className='text-xs text-gray-500'>Hours</span>
                    </div>
                    <Badge variant='outline'>{entry.workHours}h</Badge>
                  </div>
                </div>

                {/* Efficiency Score */}
                <div className='text-center'>
                  <div className='text-xs text-gray-500 mb-1'>Efficiency</div>
                  <div
                    className={`text-lg font-semibold ${getEfficiencyColor(
                      entry.efficiencyScore
                    )}`}
                  >
                    {entry.efficiencyScore.toFixed(1)}
                  </div>
                </div>

                {/* Actions */}
                <div className='flex items-center space-x-2'>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => handleDelete(entry._id)}
                    className='text-red-600 hover:text-red-700 hover:bg-red-50'
                  >
                    <Trash2 className='h-4 w-4' />
                  </Button>
                </div>
              </div>

              {/* Notes */}
              {entry.notes && (
                <div className='mt-4 pt-4 border-t border-gray-200'>
                  <div className='flex items-start space-x-2'>
                    <FileText className='h-4 w-4 text-gray-400 mt-0.5' />
                    <p className='text-sm text-gray-600'>{entry.notes}</p>
                  </div>
                </div>
              )}

              {/* Performance Score */}
              <div className='mt-4 pt-4 border-t border-gray-200'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-gray-500'>
                    Overall Performance
                  </span>
                  <div className='flex items-center space-x-2'>
                    <div className='w-20 bg-gray-200 rounded-full h-2'>
                      <div
                        className='bg-blue-500 h-2 rounded-full transition-all duration-300'
                        style={{
                          width: `${(entry.performanceScore / 5) * 100}%`,
                        }}
                      ></div>
                    </div>
                    <span className='text-sm font-medium'>
                      {entry.performanceScore.toFixed(1)}/5
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className='flex justify-center space-x-2 mt-6'>
            <Button
              variant='outline'
              onClick={() => fetchEntries(page - 1)}
              disabled={page <= 1}
            >
              Previous
            </Button>
            <div className='flex items-center space-x-1'>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNumber = Math.max(1, page - 2) + i;
                if (pageNumber <= totalPages) {
                  return (
                    <Button
                      key={pageNumber}
                      variant={page === pageNumber ? 'default' : 'outline'}
                      size='sm'
                      onClick={() => fetchEntries(pageNumber)}
                    >
                      {pageNumber}
                    </Button>
                  );
                }
                return null;
              })}
            </div>
            <Button
              variant='outline'
              onClick={() => fetchEntries(page + 1)}
              disabled={page >= totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
