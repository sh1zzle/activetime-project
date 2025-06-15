'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  BarChart3,
  TrendingUp,
  Moon,
  Star,
  Clock,
  RefreshCw,
  Zap,
  Target,
  Brain,
  Award,
  AlertCircle,
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
  // Advanced Analysis
  sleepTrend: 'improving' | 'declining' | 'stable';
  qualityTrend: 'improving' | 'declining' | 'stable';
  consistencyScore: number;
  weeklyAverage: number;
  sleepDebt: number;
  insights: string[];
  recommendations: string[];
}

export default function SleepStatistics() {
  const [stats, setStats] = useState<SleepStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAndCalculateStats = useCallback(async () => {
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
        const duration =
          entry.duration ||
          (new Date(entry.endTime).getTime() -
            new Date(entry.startTime).getTime()) /
            (1000 * 60 * 60);

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

      // Advanced Analysis: Trend Calculation
      const halfPoint = Math.floor(entries.length / 2);
      const recentHalf = entries.slice(0, halfPoint);
      const olderHalf = entries.slice(halfPoint);

      const recentDurationAvg =
        recentHalf.reduce((sum: number, entry: SleepEntry) => {
          const duration =
            entry.duration ||
            (new Date(entry.endTime).getTime() -
              new Date(entry.startTime).getTime()) /
              (1000 * 60 * 60);
          return sum + duration;
        }, 0) / recentHalf.length;

      const olderDurationAvg =
        olderHalf.reduce((sum: number, entry: SleepEntry) => {
          const duration =
            entry.duration ||
            (new Date(entry.endTime).getTime() -
              new Date(entry.startTime).getTime()) /
              (1000 * 60 * 60);
          return sum + duration;
        }, 0) / olderHalf.length;

      const recentQualityAvg =
        recentHalf.reduce(
          (sum: number, entry: SleepEntry) => sum + entry.quality,
          0
        ) / recentHalf.length;
      const olderQualityAvg =
        olderHalf.reduce(
          (sum: number, entry: SleepEntry) => sum + entry.quality,
          0
        ) / olderHalf.length;

      const durationDiff = recentDurationAvg - olderDurationAvg;
      const qualityDiff = recentQualityAvg - olderQualityAvg;

      const sleepTrend =
        durationDiff > 0.5
          ? 'improving'
          : durationDiff < -0.5
          ? 'declining'
          : 'stable';
      const qualityTrend =
        qualityDiff > 0.3
          ? 'improving'
          : qualityDiff < -0.3
          ? 'declining'
          : 'stable';

      // Consistency Score (based on standard deviation)
      const durations = entries.map(
        (entry: SleepEntry) =>
          entry.duration ||
          (new Date(entry.endTime).getTime() -
            new Date(entry.startTime).getTime()) /
            (1000 * 60 * 60)
      );
      const variance =
        durations.reduce(
          (sum: number, duration: number) =>
            sum + Math.pow(duration - averageDuration, 2),
          0
        ) / totalEntries;
      const stdDev = Math.sqrt(variance);
      const consistencyScore = Math.max(0, Math.min(100, 100 - stdDev * 10)); // 0-100 scale

      // Weekly Average (last 7 entries)
      const lastWeek = entries.slice(0, Math.min(7, entries.length));
      const weeklyAverage =
        lastWeek.reduce((sum: number, entry: SleepEntry) => {
          const duration =
            entry.duration ||
            (new Date(entry.endTime).getTime() -
              new Date(entry.startTime).getTime()) /
              (1000 * 60 * 60);
          return sum + duration;
        }, 0) / lastWeek.length;

      // Sleep Debt (difference from 8-hour target)
      const sleepDebt = Math.max(0, 8 * totalEntries - totalDuration);

      // Generate Insights
      const insights = [];
      if (averageDuration >= 8) {
        insights.push("You're getting adequate sleep duration on average!");
      } else if (averageDuration >= 7) {
        insights.push(
          'Your sleep duration is close to the recommended 8 hours.'
        );
      } else {
        insights.push(
          'Consider increasing your sleep duration for better health.'
        );
      }

      if (averageQuality >= 4) {
        insights.push('Your sleep quality is excellent - keep it up!');
      } else if (averageQuality >= 3) {
        insights.push(
          'Your sleep quality is good but has room for improvement.'
        );
      } else {
        insights.push('Focus on improving your sleep environment and habits.');
      }

      if (consistencyScore >= 80) {
        insights.push('You have very consistent sleep patterns.');
      } else if (consistencyScore >= 60) {
        insights.push('Your sleep schedule is moderately consistent.');
      } else {
        insights.push('Try to maintain more regular sleep and wake times.');
      }

      // Generate Recommendations
      const recommendations = [];
      if (averageDuration < 7) {
        recommendations.push('Aim for 7-9 hours of sleep per night');
      }
      if (averageQuality < 3.5) {
        recommendations.push('Create a relaxing bedtime routine');
        recommendations.push('Keep your bedroom cool, dark, and quiet');
      }
      if (consistencyScore < 70) {
        recommendations.push(
          'Try to go to bed and wake up at the same time daily'
        );
      }
      if (sleepEfficiency < 80) {
        recommendations.push('Limit screen time before bed');
        recommendations.push('Consider avoiding caffeine 6 hours before sleep');
      }
      if (sleepTrend === 'declining') {
        recommendations.push(
          'Review recent changes in your routine that might affect sleep'
        );
      }

      setStats({
        totalEntries,
        averageDuration,
        averageQuality,
        longestSleep: { duration: longestDuration, date: longestSleepDate },
        shortestSleep: { duration: shortestDuration, date: shortestSleepDate },
        bestQualitySleep: { quality: bestQuality, date: bestQualityDate },
        totalSleepTime: totalDuration,
        sleepEfficiency,
        sleepTrend,
        qualityTrend,
        consistencyScore,
        weeklyAverage,
        sleepDebt,
        insights,
        recommendations,
      });
    } catch (err) {
      console.error('Error fetching sleep statistics:', err);
      setError('Failed to load sleep statistics. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAndCalculateStats();
  }, [fetchAndCalculateStats]);

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
    if (quality >= 4.5)
      return {
        label: 'Excellent',
        variant: 'default' as const,
        color: 'bg-green-500',
      };
    if (quality >= 3.5)
      return {
        label: 'Good',
        variant: 'secondary' as const,
        color: 'bg-blue-500',
      };
    if (quality >= 2.5)
      return {
        label: 'Fair',
        variant: 'outline' as const,
        color: 'bg-yellow-500',
      };
    return {
      label: 'Poor',
      variant: 'destructive' as const,
      color: 'bg-red-500',
    };
  };

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 90) return 'text-green-600';
    if (efficiency >= 70) return 'text-blue-600';
    if (efficiency >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTrendColor = (trend: string) => {
    if (trend === 'improving') return 'text-green-600';
    if (trend === 'declining') return 'text-red-600';
    return 'text-gray-600';
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'improving') return '📈';
    if (trend === 'declining') return '📉';
    return '➡️';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center space-x-2'>
            <BarChart3 className='h-5 w-5' />
            <span>Sleep Analytics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex items-center justify-center py-8'>
            <RefreshCw className='h-6 w-6 animate-spin text-blue-500' />
            <span className='ml-2 text-gray-600'>
              Loading your sleep insights...
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
            <BarChart3 className='h-5 w-5' />
            <span>Sleep Analytics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-center py-8'>
            <div className='text-red-500 mb-4'>{error}</div>
            <Button onClick={fetchAndCalculateStats} variant='outline'>
              <RefreshCw className='h-4 w-4 mr-2' />
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
          <CardTitle className='flex items-center space-x-2'>
            <BarChart3 className='h-5 w-5' />
            <span>Sleep Analytics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-center py-12'>
            <Moon className='h-12 w-12 text-gray-400 mx-auto mb-4' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>
              No Data Yet
            </h3>
            <p className='text-gray-500 mb-4'>
              Start tracking your sleep to see personalized insights and
              analytics.
            </p>
            <Badge variant='outline'>
              Your journey begins with the first entry
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  const qualityBadge = getQualityBadge(stats.averageQuality);

  return (
    <div className='space-y-6'>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <CardTitle className='flex items-center space-x-2'>
              <BarChart3 className='h-5 w-5 text-blue-600' />
              <span>Sleep Analytics</span>
            </CardTitle>
            <Button
              onClick={fetchAndCalculateStats}
              variant='outline'
              size='sm'
            >
              <RefreshCw className='h-4 w-4 mr-2' />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            <div className='text-center'>
              <div className='text-2xl font-bold text-blue-900'>
                {stats.totalEntries}
              </div>
              <div className='text-sm text-gray-600'>Total Entries</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-green-900'>
                {formatDuration(stats.averageDuration)}
              </div>
              <div className='text-sm text-gray-600'>Avg Duration</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-yellow-900'>
                {stats.averageQuality.toFixed(1)}
              </div>
              <div className='text-sm text-gray-600'>Avg Quality</div>
            </div>
            <div className='text-center'>
              <div
                className={`text-2xl font-bold ${getEfficiencyColor(
                  stats.sleepEfficiency
                )}`}
              >
                {stats.sleepEfficiency.toFixed(0)}%
              </div>
              <div className='text-sm text-gray-600'>Efficiency</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Sleep Analysis Row */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Sleep Trend Analysis */}
        <Card className='bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200'>
          <CardHeader>
            <CardTitle className='flex items-center space-x-2 text-indigo-800'>
              <TrendingUp className='h-5 w-5' />
              <span>Trend Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              <div>
                <div className='text-sm text-indigo-700 mb-2'>
                  Duration Trend
                </div>
                <div className='flex items-center space-x-2'>
                  <span className='text-2xl'>
                    {getTrendIcon(stats.sleepTrend)}
                  </span>
                  <span
                    className={`text-lg font-semibold capitalize ${getTrendColor(
                      stats.sleepTrend
                    )}`}
                  >
                    {stats.sleepTrend}
                  </span>
                </div>
                <div className='text-sm text-indigo-600'>
                  Weekly Avg: {formatDuration(stats.weeklyAverage)}
                </div>
              </div>
              <div>
                <div className='text-sm text-indigo-700 mb-2'>
                  Quality Trend
                </div>
                <div className='flex items-center space-x-2'>
                  <span className='text-2xl'>
                    {getTrendIcon(stats.qualityTrend)}
                  </span>
                  <span
                    className={`text-lg font-semibold capitalize ${getTrendColor(
                      stats.qualityTrend
                    )}`}
                  >
                    {stats.qualityTrend}
                  </span>
                </div>
                <div className='text-sm text-indigo-600'>
                  Consistency: {stats.consistencyScore.toFixed(0)}%
                </div>
              </div>
              <div>
                <div className='text-sm text-indigo-700 mb-2'>Sleep Debt</div>
                <div className='text-2xl font-bold text-indigo-900'>
                  {formatDuration(stats.sleepDebt)}
                </div>
                <div className='text-sm text-indigo-600'>
                  Hours behind target
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sleep Insights */}
        <Card className='bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200'>
          <CardHeader>
            <CardTitle className='flex items-center space-x-2 text-emerald-800'>
              <Brain className='h-5 w-5' />
              <span>Sleep Insights</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              {stats.insights.map((insight, index) => (
                <div
                  key={index}
                  className='flex items-start space-x-3 p-3 bg-white rounded-lg border border-emerald-100'
                >
                  <div className='flex-shrink-0 w-2 h-2 bg-emerald-500 rounded-full mt-2'></div>
                  <p className='text-sm text-emerald-900'>{insight}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sleep Recommendations */}
        <Card className='bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200'>
          <CardHeader>
            <CardTitle className='flex items-center space-x-2 text-amber-800'>
              <Target className='h-5 w-5' />
              <span>Recommendations</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              {stats.recommendations.length > 0 ? (
                stats.recommendations.map((recommendation, index) => (
                  <div
                    key={index}
                    className='flex items-start space-x-3 p-3 bg-white rounded-lg border border-amber-100'
                  >
                    <AlertCircle className='flex-shrink-0 h-4 w-4 text-amber-600 mt-0.5' />
                    <p className='text-sm text-amber-900'>{recommendation}</p>
                  </div>
                ))
              ) : (
                <div className='flex items-center space-x-3 p-3 bg-white rounded-lg border border-amber-100'>
                  <Award className='flex-shrink-0 h-4 w-4 text-amber-600' />
                  <p className='text-sm text-amber-900'>
                    Great job! Your sleep habits are on track.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {/* Sleep Quality Card */}
        <Card className='bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200'>
          <CardHeader>
            <CardTitle className='flex items-center space-x-2 text-yellow-800'>
              <Star className='h-5 w-5' />
              <span>Sleep Quality</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <span className='text-sm text-yellow-700'>Average Rating</span>
                <Badge variant={qualityBadge.variant}>
                  {qualityBadge.label}
                </Badge>
              </div>
              <div className='text-2xl font-bold text-yellow-900'>
                {'⭐'.repeat(Math.round(stats.averageQuality))}{' '}
                {stats.averageQuality.toFixed(1)}/5
              </div>
              <div className='text-sm text-yellow-700'>
                Best: {stats.bestQualitySleep.quality}⭐ on{' '}
                {stats.bestQualitySleep.date}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Duration Records */}
        <Card className='bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200'>
          <CardHeader>
            <CardTitle className='flex items-center space-x-2 text-blue-800'>
              <Clock className='h-5 w-5' />
              <span>Duration Records</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              <div>
                <div className='flex items-center justify-between mb-1'>
                  <span className='text-sm text-blue-700'>Longest Sleep</span>
                  <TrendingUp className='h-4 w-4 text-green-500' />
                </div>
                <div className='text-lg font-semibold text-blue-900'>
                  {formatDuration(stats.longestSleep.duration)}
                </div>
                <div className='text-xs text-blue-600'>
                  on {stats.longestSleep.date}
                </div>
              </div>
              <hr className='border-blue-200' />
              <div>
                <div className='flex items-center justify-between mb-1'>
                  <span className='text-sm text-blue-700'>Shortest Sleep</span>
                </div>
                <div className='text-lg font-semibold text-blue-900'>
                  {formatDuration(stats.shortestSleep.duration)}
                </div>
                <div className='text-xs text-blue-600'>
                  on {stats.shortestSleep.date}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Stats */}
        <Card className='bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200'>
          <CardHeader>
            <CardTitle className='flex items-center space-x-2 text-purple-800'>
              <Zap className='h-5 w-5' />
              <span>Sleep Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              <div>
                <div className='text-sm text-purple-700'>Total Sleep Time</div>
                <div className='text-2xl font-bold text-purple-900'>
                  {Math.round(stats.totalSleepTime)}h
                </div>
              </div>
              <div>
                <div className='text-sm text-purple-700'>Sleep Efficiency</div>
                <div
                  className={`text-lg font-semibold ${getEfficiencyColor(
                    stats.sleepEfficiency
                  )}`}
                >
                  {stats.sleepEfficiency.toFixed(1)}%
                </div>
                <div className='text-xs text-purple-600'>
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
