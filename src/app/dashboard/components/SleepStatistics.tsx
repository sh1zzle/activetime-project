'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BarChart3, 
  TrendingUp, 
  Moon, 
  Star, 
  Clock, 
  RefreshCw,
  Zap
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
  duration: number;
  createdAt: string;
}

interface SleepStats {
  totalEntries: number;
  averageDuration: number;
  averageQuality: number;
  longestSleep: { duration: number; date: string };
  shortestSleep: { duration: number; date: string };
  bestQualitySleep: { quality: number; date: string };
  totalSleepTime: number;
  sleepEfficiency: number;
}

export default function SleepStatistics() {
  const [stats, setStats] = useState<SleepStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);


  const fetchAndCalculateStats = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get('/api/sleep?limit=100');
      const entries = response.data.data;

      if (entries.length === 0) {
        setStats(null);
        setIsLoading(false);
        return;
      }

      // Calculate comprehensive statistics
      const totalEntries = entries.length;
      let totalDuration = 0;
      let totalQuality = 0;
      let longestDuration = 0;
      let shortestDuration = Number.MAX_VALUE;
      let bestQuality = 0;
      let longestSleepDate = '';
      let shortestSleepDate = '';
      let bestQualityDate = '';

      entries.forEach((entry: SleepEntry) => {
        const duration = entry.duration || 
          (new Date(entry.endTime).getTime() - new Date(entry.startTime).getTime()) / (1000 * 60 * 60);

        totalDuration += duration;
        totalQuality += entry.quality;

        if (duration > longestDuration) {
          longestDuration = duration;
          longestSleepDate = formatDate(entry.startTime);
        }

        if (duration < shortestDuration) {
          shortestDuration = duration;
          shortestSleepDate = formatDate(entry.startTime);
        }

        if (entry.quality > bestQuality) {
          bestQuality = entry.quality;
          bestQualityDate = formatDate(entry.startTime);
        }
      });

      const averageDuration = totalDuration / totalEntries;
      const averageQuality = totalQuality / totalEntries;
      const sleepEfficiency = Math.min((averageDuration / 8) * 100, 100); // Based on 8-hour ideal

      setStats({
        totalEntries,
        averageDuration,
        averageQuality,
        longestSleep: { duration: longestDuration, date: longestSleepDate },
        shortestSleep: { duration: shortestDuration, date: shortestSleepDate },
        bestQualitySleep: { quality: bestQuality, date: bestQualityDate },
        totalSleepTime: totalDuration,
        sleepEfficiency
      });
    } catch (err) {
      console.error('Error fetching sleep statistics:', err);
      setError('Failed to load sleep statistics. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAndCalculateStats();
  }, []);

  const formatDuration = (hours: number) => {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return `${wholeHours}h ${minutes}m`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getQualityBadge = (quality: number) => {
    if (quality >= 4.5) return { label: 'Excellent', variant: 'default' as const, color: 'bg-green-500' };
    if (quality >= 3.5) return { label: 'Good', variant: 'secondary' as const, color: 'bg-blue-500' };
    if (quality >= 2.5) return { label: 'Fair', variant: 'outline' as const, color: 'bg-yellow-500' };
    return { label: 'Poor', variant: 'destructive' as const, color: 'bg-red-500' };
  };

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 90) return 'text-green-600';
    if (efficiency >= 70) return 'text-blue-600';
    if (efficiency >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Sleep Analytics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
            <span className="ml-2 text-gray-600">Loading your sleep insights...</span>
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
            <BarChart3 className="h-5 w-5" />
            <span>Sleep Analytics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-red-500 mb-4">{error}</div>
            <Button onClick={fetchAndCalculateStats} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Sleep Analytics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Moon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Yet</h3>
            <p className="text-gray-500 mb-4">
              Start tracking your sleep to see personalized insights and analytics.
            </p>
            <Badge variant="outline">Your journey begins with the first entry</Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  const qualityBadge = getQualityBadge(stats.averageQuality);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <span>Sleep Analytics</span>
            </CardTitle>
            <Button onClick={fetchAndCalculateStats} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-900">{stats.totalEntries}</div>
              <div className="text-sm text-gray-600">Total Entries</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-900">
                {formatDuration(stats.averageDuration)}
              </div>
              <div className="text-sm text-gray-600">Avg Duration</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-900">
                {stats.averageQuality.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">Avg Quality</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getEfficiencyColor(stats.sleepEfficiency)}`}>
                {stats.sleepEfficiency.toFixed(0)}%
              </div>
              <div className="text-sm text-gray-600">Efficiency</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Sleep Quality Card */}
        <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-yellow-800">
              <Star className="h-5 w-5" />
              <span>Sleep Quality</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-yellow-700">Average Rating</span>
                <Badge variant={qualityBadge.variant}>{qualityBadge.label}</Badge>
              </div>
              <div className="text-2xl font-bold text-yellow-900">
                {'⭐'.repeat(Math.round(stats.averageQuality))} {stats.averageQuality.toFixed(1)}/5
              </div>
              <div className="text-sm text-yellow-700">
                Best: {stats.bestQualitySleep.quality}⭐ on {stats.bestQualitySleep.date}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Duration Records */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-blue-800">
              <Clock className="h-5 w-5" />
              <span>Duration Records</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-blue-700">Longest Sleep</span>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </div>
                <div className="text-lg font-semibold text-blue-900">
                  {formatDuration(stats.longestSleep.duration)}
                </div>
                <div className="text-xs text-blue-600">on {stats.longestSleep.date}</div>
              </div>
              <hr className="border-blue-200" />
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-blue-700">Shortest Sleep</span>
                </div>
                <div className="text-lg font-semibold text-blue-900">
                  {formatDuration(stats.shortestSleep.duration)}
                </div>
                <div className="text-xs text-blue-600">on {stats.shortestSleep.date}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Stats */}
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-purple-800">
              <Zap className="h-5 w-5" />
              <span>Sleep Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="text-sm text-purple-700">Total Sleep Time</div>
                <div className="text-2xl font-bold text-purple-900">
                  {Math.round(stats.totalSleepTime)}h
                </div>
              </div>
              <div>
                <div className="text-sm text-purple-700">Sleep Efficiency</div>
                <div className={`text-lg font-semibold ${getEfficiencyColor(stats.sleepEfficiency)}`}>
                  {stats.sleepEfficiency.toFixed(1)}%
                </div>
                <div className="text-xs text-purple-600">
                  Based on 8-hour target
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
