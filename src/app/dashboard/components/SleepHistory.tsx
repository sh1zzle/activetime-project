'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { 
  History, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw, 
  Calendar,
  Clock,
  Star,
  StickyNote,
  Moon,
  Sunrise
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface SleepEntry {
  _id: string;
  startTime: string;
  endTime: string;
  quality: number;
  notes?: string;
  createdAt: string;
  duration: number;
}

export default function SleepHistory() {
  const [sleepEntries, setSleepEntries] = useState<SleepEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchSleepEntries = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get(`/api/sleep?page=${page}&limit=10`);
      setSleepEntries(response.data.data);
      setTotalPages(response.data.pagination.pages);
    } catch (err) {
      console.error('Error fetching sleep entries:', err);
      setError('Failed to load sleep entries. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchSleepEntries();
  }, [fetchSleepEntries]);

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), 'MMM d, yyyy');
  };

  const formatTime = (dateStr: string) => {
    return format(new Date(dateStr), 'h:mm a');
  };

  const calculateDuration = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const durationMs = endDate.getTime() - startDate.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const getQualityBadge = (quality: number) => {
    if (quality >= 4) return { label: 'Excellent', variant: 'default' as const, stars: '⭐⭐⭐⭐⭐' };
    if (quality >= 3) return { label: 'Good', variant: 'secondary' as const, stars: '⭐⭐⭐⭐' };
    if (quality >= 2) return { label: 'Fair', variant: 'outline' as const, stars: '⭐⭐⭐' };
    return { label: 'Poor', variant: 'destructive' as const, stars: '⭐⭐' };
  };

  const goToNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  const goToPrevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <History className="h-5 w-5 text-blue-600" />
            <span>Sleep History</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
            <span className="ml-2 text-gray-600">Loading your sleep history...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <History className="h-5 w-5 text-blue-600" />
            <span>Sleep History</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-red-500 mb-4">{error}</div>
            <Button onClick={fetchSleepEntries} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (sleepEntries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <History className="h-5 w-5 text-blue-600" />
            <span>Sleep History</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Moon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Sleep Entries Yet</h3>
            <p className="text-gray-500 mb-4">
              Start tracking your sleep to build your sleep history and see patterns over time.
            </p>
            <Badge variant="outline">Your sleep journey starts here</Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <History className="h-5 w-5 text-blue-600" />
            <span>Sleep History</span>
            <Badge variant="secondary">{sleepEntries.length} entries this page</Badge>
          </CardTitle>
          <Button onClick={fetchSleepEntries} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sleepEntries.map((entry) => {
            const qualityBadge = getQualityBadge(entry.quality);
            const duration = entry.duration ? 
              `${entry.duration.toFixed(1)}h` : 
              calculateDuration(entry.startTime, entry.endTime);

            return (
              <div 
                key={entry._id} 
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-gradient-to-r from-blue-50/30 to-indigo-50/30"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                  {/* Date Column */}
                  <div className="lg:col-span-3 flex items-center space-x-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100">
                      <Calendar className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {formatDate(entry.startTime)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {format(new Date(entry.startTime), 'EEEE')}
                      </div>
                    </div>
                  </div>

                  {/* Sleep Time Column */}
                  <div className="lg:col-span-3">
                    <div className="flex items-center space-x-2 mb-1">
                      <Moon className="h-4 w-4 text-indigo-500" />
                      <span className="text-sm font-medium text-gray-700">Bedtime</span>
                    </div>
                    <div className="text-sm text-gray-900 ml-6">
                      {formatTime(entry.startTime)}
                    </div>
                    <div className="flex items-center space-x-2 mt-2">
                      <Sunrise className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-medium text-gray-700">Wake up</span>
                    </div>
                    <div className="text-sm text-gray-900 ml-6">
                      {formatTime(entry.endTime)}
                    </div>
                  </div>

                  {/* Duration Column */}
                  <div className="lg:col-span-2">
                    <div className="flex items-center space-x-2 mb-1">
                      <Clock className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium text-gray-700">Duration</span>
                    </div>
                    <div className="text-lg font-semibold text-green-900 ml-6">
                      {duration}
                    </div>
                  </div>

                  {/* Quality Column */}
                  <div className="lg:col-span-2">
                    <div className="flex items-center space-x-2 mb-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-medium text-gray-700">Quality</span>
                    </div>
                    <div className="ml-6">
                      <Badge variant={qualityBadge.variant} className="mb-1">
                        {qualityBadge.label}
                      </Badge>
                      <div className="text-sm text-gray-600">
                        {qualityBadge.stars.slice(0, entry.quality)}
                      </div>
                    </div>
                  </div>

                  {/* Notes Column */}
                  <div className="lg:col-span-2">
                    {entry.notes ? (
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <StickyNote className="h-4 w-4 text-purple-500" />
                          <span className="text-sm font-medium text-gray-700">Notes</span>
                        </div>
                        <div className="text-sm text-gray-600 ml-6 truncate" title={entry.notes}>
                          {entry.notes}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-400 italic">
                        No notes
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Enhanced Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={goToPrevPage}
                disabled={page === 1}
                variant="outline"
                size="sm"
                className="flex items-center space-x-1"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Previous</span>
              </Button>
              <Button
                onClick={goToNextPage}
                disabled={page === totalPages}
                variant="outline"
                size="sm"
                className="flex items-center space-x-1"
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
