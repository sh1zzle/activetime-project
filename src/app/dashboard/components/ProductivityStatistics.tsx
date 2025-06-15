'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  BarChart3,
  TrendingUp,
  Target,
  Zap,
  CheckSquare,
  Clock,
  RefreshCw,
  Award,
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
}

interface ProductivityStats {
  totalEntries: number;
  averageProductivity: number;
  averageFocus: number;
  averageEnergy: number;
  totalTasksCompleted: number;
  totalWorkHours: number;
  averageWorkHours: number;
  averageEfficiency: number;
  averagePerformance: number;
  bestProductivityDay: { rating: number; date: string };
  mostProductiveWeek: { tasks: number; startDate: string };
  productivityTrend: 'improving' | 'declining' | 'stable';
}

export default function ProductivityStatistics() {
  const [stats, setStats] = useState<ProductivityStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAndCalculateStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get('/api/productivity?limit=100');
      const entries = response.data.data;

      if (entries.length === 0) {
        setStats(null);
        setIsLoading(false);
        return;
      }

      // Calculate comprehensive statistics
      const totalEntries = entries.length;
      let totalProductivity = 0;
      let totalFocus = 0;
      let totalEnergy = 0;
      let totalTasks = 0;
      let totalHours = 0;
      let totalEfficiency = 0;
      let totalPerformance = 0;
      let bestProductivity = 0;
      let bestProductivityDate = '';

      entries.forEach((entry: ProductivityEntry) => {
        totalProductivity += entry.productivityRating;
        totalFocus += entry.focusQuality;
        totalEnergy += entry.energyLevel;
        totalTasks += entry.tasksCompleted;
        totalHours += entry.workHours;
        totalEfficiency += entry.efficiencyScore;
        totalPerformance += entry.performanceScore;

        if (entry.productivityRating > bestProductivity) {
          bestProductivity = entry.productivityRating;
          bestProductivityDate = formatDate(entry.date);
        }
      });

      // Find most productive week (last 30 days divided into weeks)
      const recentEntries = entries.slice(0, 30);
      let mostTasks = 0;
      let mostProductiveWeekStart = '';

      // Group by weeks and find the most productive one
      const weeklyTasks: { [key: string]: number } = {};
      recentEntries.forEach((entry: ProductivityEntry) => {
        const date = new Date(entry.date);
        const weekStart = new Date(
          date.setDate(date.getDate() - date.getDay())
        );
        const weekKey = weekStart.toISOString().split('T')[0];

        weeklyTasks[weekKey] =
          (weeklyTasks[weekKey] || 0) + entry.tasksCompleted;

        if (weeklyTasks[weekKey] > mostTasks) {
          mostTasks = weeklyTasks[weekKey];
          mostProductiveWeekStart = formatDate(weekKey);
        }
      });

      // Calculate trend (compare first half vs second half)
      const halfPoint = Math.floor(entries.length / 2);
      const firstHalf = entries.slice(-halfPoint);
      const secondHalf = entries.slice(0, halfPoint);

      const firstHalfAvg =
        firstHalf.reduce(
          (sum: number, entry: ProductivityEntry) =>
            sum + entry.productivityRating,
          0
        ) / (firstHalf.length || 1);
      const secondHalfAvg =
        secondHalf.reduce(
          (sum: number, entry: ProductivityEntry) =>
            sum + entry.productivityRating,
          0
        ) / (secondHalf.length || 1);

      let trend: 'improving' | 'declining' | 'stable' = 'stable';
      const difference = secondHalfAvg - firstHalfAvg;
      if (difference > 0.3) trend = 'improving';
      else if (difference < -0.3) trend = 'declining';

      setStats({
        totalEntries,
        averageProductivity: totalProductivity / totalEntries,
        averageFocus: totalFocus / totalEntries,
        averageEnergy: totalEnergy / totalEntries,
        totalTasksCompleted: totalTasks,
        totalWorkHours: totalHours,
        averageWorkHours: totalHours / totalEntries,
        averageEfficiency: totalEfficiency / totalEntries,
        averagePerformance: totalPerformance / totalEntries,
        bestProductivityDay: {
          rating: bestProductivity,
          date: bestProductivityDate,
        },
        mostProductiveWeek: {
          tasks: mostTasks,
          startDate: mostProductiveWeekStart,
        },
        productivityTrend: trend,
      });
    } catch (err) {
      console.error('Error fetching productivity statistics:', err);
      setError('Failed to load productivity statistics. Please try again..');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAndCalculateStats();
  }, [fetchAndCalculateStats]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getRatingBadge = (rating: number) => {
    if (rating >= 4.5)
      return {
        label: 'Excellent',
        variant: 'default' as const,
        color: 'bg-green-500',
      };
    if (rating >= 3.5)
      return {
        label: 'Good',
        variant: 'secondary' as const,
        color: 'bg-blue-500',
      };
    if (rating >= 2.5)
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
            <span>Productivity Analytics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex items-center justify-center py-8'>
            <RefreshCw className='h-6 w-6 animate-spin text-blue-500' />
            <span className='ml-2 text-gray-600'>
              Loading your productivity insights...
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
            <span>Productivity Analytics</span>
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
            <span>Productivity Analytics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-center py-12'>
            <TrendingUp className='h-12 w-12 text-gray-400 mx-auto mb-4' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>
              No Data Yet
            </h3>
            <p className='text-gray-500 mb-4'>
              Start tracking your productivity to see personalized insights and
              analytics.
            </p>
            <Badge variant='outline'>
              Your productivity journey begins now!
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  const productivityBadge = getRatingBadge(stats.averageProductivity);

  return (
    <div className='space-y-6'>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <CardTitle className='flex items-center space-x-2'>
              <BarChart3 className='h-5 w-5 text-blue-600' />
              <span>Productivity Analytics</span>
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
                {stats.totalTasksCompleted}
              </div>
              <div className='text-sm text-gray-600'>Tasks Completed</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-purple-900'>
                {Math.round(stats.totalWorkHours)}h
              </div>
              <div className='text-sm text-gray-600'>Total Work Hours</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-yellow-900'>
                {stats.averageEfficiency.toFixed(1)}
              </div>
              <div className='text-sm text-gray-600'>Avg Efficiency</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Stats */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {/* Productivity Ratings */}
        <Card className='bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200'>
          <CardHeader>
            <CardTitle className='flex items-center space-x-2 text-blue-800'>
              <TrendingUp className='h-5 w-5' />
              <span>Productivity Ratings</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <span className='text-sm text-blue-700'>
                  Overall Productivity
                </span>
                <Badge variant={productivityBadge.variant}>
                  {productivityBadge.label}
                </Badge>
              </div>
              <div className='text-2xl font-bold text-blue-900'>
                {'⭐'.repeat(Math.round(stats.averageProductivity))}{' '}
                {stats.averageProductivity.toFixed(1)}/5
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <div className='text-sm text-blue-700'>Focus</div>
                  <div className='flex items-center space-x-2'>
                    <Target className='h-4 w-4 text-green-500' />
                    <span className='font-semibold'>
                      {stats.averageFocus.toFixed(1)}
                    </span>
                  </div>
                </div>
                <div>
                  <div className='text-sm text-blue-700'>Energy</div>
                  <div className='flex items-center space-x-2'>
                    <Zap className='h-4 w-4 text-yellow-500' />
                    <span className='font-semibold'>
                      {stats.averageEnergy.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card className='bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'>
          <CardHeader>
            <CardTitle className='flex items-center space-x-2 text-green-800'>
              <Award className='h-5 w-5' />
              <span>Performance</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              <div>
                <div className='text-sm text-green-700'>Performance Score</div>
                <div className='text-2xl font-bold text-green-900'>
                  {stats.averagePerformance.toFixed(1)}/5
                </div>
                <div className='w-full bg-green-200 rounded-full h-2 mt-2'>
                  <div
                    className='bg-green-500 h-2 rounded-full transition-all duration-300'
                    style={{
                      width: `${(stats.averagePerformance / 5) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
              <div>
                <div className='text-sm text-green-700'>Best Day</div>
                <div className='text-lg font-semibold text-green-900'>
                  {stats.bestProductivityDay.rating}⭐ on{' '}
                  {stats.bestProductivityDay.date}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Work Patterns */}
        <Card className='bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200'>
          <CardHeader>
            <CardTitle className='flex items-center space-x-2 text-purple-800'>
              <Clock className='h-5 w-5' />
              <span>Work Patterns</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              <div>
                <div className='text-sm text-purple-700'>Average Hours/Day</div>
                <div className='text-2xl font-bold text-purple-900'>
                  {stats.averageWorkHours.toFixed(1)}h
                </div>
              </div>
              <div>
                <div className='text-sm text-purple-700'>Tasks per Entry</div>
                <div className='text-lg font-semibold text-purple-900'>
                  {(stats.totalTasksCompleted / stats.totalEntries).toFixed(1)}
                </div>
              </div>
              <div>
                <div className='text-sm text-purple-700'>
                  Most Productive Week
                </div>
                <div className='flex items-center space-x-2'>
                  <CheckSquare className='h-4 w-4 text-purple-500' />
                  <span className='font-semibold'>
                    {stats.mostProductiveWeek.tasks} tasks
                  </span>
                </div>
                <div className='text-xs text-purple-600'>
                  Week of {stats.mostProductiveWeek.startDate}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trend Analysis */}
      <Card className='bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200'>
        <CardHeader>
          <CardTitle className='flex items-center space-x-2 text-yellow-800'>
            <TrendingUp className='h-5 w-5' />
            <span>Trend Analysis</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex items-center justify-between'>
            <div>
              <div className='text-sm text-yellow-700'>Productivity Trend</div>
              <div className='flex items-center space-x-2'>
                <span className='text-2xl'>
                  {getTrendIcon(stats.productivityTrend)}
                </span>
                <span
                  className={`text-lg font-semibold capitalize ${getTrendColor(
                    stats.productivityTrend
                  )}`}
                >
                  {stats.productivityTrend}
                </span>
              </div>
            </div>
            <div className='text-right'>
              <div className='text-sm text-yellow-700'>Overall Rating</div>
              <div className='text-lg font-semibold text-yellow-900'>
                {stats.averagePerformance >= 4
                  ? 'Outstanding'
                  : stats.averagePerformance >= 3
                  ? 'Strong'
                  : stats.averagePerformance >= 2
                  ? 'Developing'
                  : 'Needs Focus'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
