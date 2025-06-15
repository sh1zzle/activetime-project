'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  BarChart3,
  Moon,
  Target,
  Clock,
  RefreshCw,
  Brain,
  Award,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface SleepEntry {
  _id: string;
  startTime: string;
  endTime: string;
  quality: number;
  duration: number;
  createdAt: string;
}

interface ProductivityEntry {
  _id: string;
  date: string;
  productivityRating: number;
  tasksCompleted: number;
  focusQuality: number;
  energyLevel: number;
  workHours: number;
  efficiencyScore: number;
  performanceScore: number;
}

interface CorrelationData {
  date: string;
  sleepDuration?: number;
  sleepQuality?: number;
  productivityRating?: number;
  tasksCompleted?: number;
  focusQuality?: number;
  energyLevel?: number;
  efficiencyScore?: number;
  performanceScore?: number;
}

interface CorrelationStats {
  totalPairs: number;
  sleepDurationVsProductivity: number;
  sleepDurationVsFocus: number;
  sleepDurationVsEnergy: number;
  sleepDurationVsTasks: number;
  sleepQualityVsProductivity: number;
  sleepQualityVsFocus: number;
  sleepQualityVsEnergy: number;
  sleepQualityVsTasks: number;
  averageSleepWhenHighProductivity: number;
  averageSleepWhenLowProductivity: number;
  bestSleepProductivityDay: {
    date: string;
    sleepQuality: number;
    productivity: number;
  };
  insights: string[];
  recommendations: string[];
}

export default function CorrelationAnalysis() {
  const [stats, setStats] = useState<CorrelationStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAndAnalyzeCorrelation = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch both sleep and productivity data
      const [sleepResponse, productivityResponse] = await Promise.all([
        axios.get('/api/sleep?limit=100'),
        axios.get('/api/productivity?limit=100'),
      ]);

      const sleepEntries: SleepEntry[] = sleepResponse.data.data;
      const productivityEntries: ProductivityEntry[] =
        productivityResponse.data.data;

      if (sleepEntries.length === 0 || productivityEntries.length === 0) {
        setStats(null);
        setIsLoading(false);
        return;
      }

      // Create correlation data by matching dates
      const correlationData: CorrelationData[] = [];

      console.log('correlationData', correlationData);

      sleepEntries.forEach((sleepEntry) => {
        const sleepDate = new Date(sleepEntry.startTime)
          .toISOString()
          .split('T')[0];

        // Find productivity entry for the day after sleep (since sleep affects next day productivity)
        const nextDay = new Date(sleepDate);
        nextDay.setDate(nextDay.getDate() + 1);
        const nextDayStr = nextDay.toISOString().split('T')[0];

        const productivityEntry = productivityEntries.find(
          (p) => new Date(p.date).toISOString().split('T')[0] === nextDayStr
        );

        if (productivityEntry) {
          const sleepDuration =
            sleepEntry.duration ||
            (new Date(sleepEntry.endTime).getTime() -
              new Date(sleepEntry.startTime).getTime()) /
              (1000 * 60 * 60);

          correlationData.push({
            date: nextDayStr,
            sleepDuration,
            sleepQuality: sleepEntry.quality,
            productivityRating: productivityEntry.productivityRating,
            tasksCompleted: productivityEntry.tasksCompleted,
            focusQuality: productivityEntry.focusQuality,
            energyLevel: productivityEntry.energyLevel,
            efficiencyScore: productivityEntry.efficiencyScore,
            performanceScore: productivityEntry.performanceScore,
          });
        }
      });

      if (correlationData.length < 3) {
        setError(
          'Not enough matching data points for correlation analysis. Need at least 3 days with both sleep and productivity data.'
        );
        setIsLoading(false);
        return;
      }

      // Calculate correlations
      const calculateCorrelation = (x: number[], y: number[]): number => {
        const n = x.length;
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
        const sumXX = x.reduce((acc, xi) => acc + xi * xi, 0);
        const sumYY = y.reduce((acc, yi) => acc + yi * yi, 0);

        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt(
          (n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY)
        );

        return denominator === 0 ? 0 : numerator / denominator;
      };

      const sleepDurations = correlationData.map((d) => d.sleepDuration!);
      const sleepQualities = correlationData.map((d) => d.sleepQuality!);
      const productivityRatings = correlationData.map(
        (d) => d.productivityRating!
      );
      const focusQualities = correlationData.map((d) => d.focusQuality!);
      const energyLevels = correlationData.map((d) => d.energyLevel!);
      const tasksCompleted = correlationData.map((d) => d.tasksCompleted!);

      // Calculate all correlations
      const sleepDurationVsProductivity = calculateCorrelation(
        sleepDurations,
        productivityRatings
      );
      const sleepDurationVsFocus = calculateCorrelation(
        sleepDurations,
        focusQualities
      );
      const sleepDurationVsEnergy = calculateCorrelation(
        sleepDurations,
        energyLevels
      );
      const sleepDurationVsTasks = calculateCorrelation(
        sleepDurations,
        tasksCompleted
      );
      const sleepQualityVsProductivity = calculateCorrelation(
        sleepQualities,
        productivityRatings
      );
      const sleepQualityVsFocus = calculateCorrelation(
        sleepQualities,
        focusQualities
      );
      const sleepQualityVsEnergy = calculateCorrelation(
        sleepQualities,
        energyLevels
      );
      const sleepQualityVsTasks = calculateCorrelation(
        sleepQualities,
        tasksCompleted
      );

      // Find high vs low productivity days
      const avgProductivity =
        productivityRatings.reduce((a, b) => a + b, 0) /
        productivityRatings.length;
      const highProductivityData = correlationData.filter(
        (d) => d.productivityRating! >= avgProductivity
      );
      const lowProductivityData = correlationData.filter(
        (d) => d.productivityRating! < avgProductivity
      );

      const averageSleepWhenHighProductivity =
        highProductivityData.length > 0
          ? highProductivityData.reduce((sum, d) => sum + d.sleepDuration!, 0) /
            highProductivityData.length
          : 0;

      const averageSleepWhenLowProductivity =
        lowProductivityData.length > 0
          ? lowProductivityData.reduce((sum, d) => sum + d.sleepDuration!, 0) /
            lowProductivityData.length
          : 0;

      // Find best correlation day
      const bestDay = correlationData.reduce((best, current) => {
        const currentScore =
          (current.sleepQuality! + current.productivityRating!) / 2;
        const bestScore = (best.sleepQuality! + best.productivityRating!) / 2;
        return currentScore > bestScore ? current : best;
      });

      // Generate insights
      const insights = [];

      if (Math.abs(sleepDurationVsProductivity) > 0.3) {
        if (sleepDurationVsProductivity > 0) {
          insights.push(
            `Strong positive correlation (${(
              sleepDurationVsProductivity * 100
            ).toFixed(0)}%) between sleep duration and productivity`
          );
        } else {
          insights.push(
            `Negative correlation detected between sleep duration and productivity - may indicate oversleeping effects`
          );
        }
      }

      if (Math.abs(sleepQualityVsProductivity) > 0.3) {
        insights.push(
          `Sleep quality shows ${
            sleepQualityVsProductivity > 0 ? 'strong positive' : 'negative'
          } correlation with productivity (${(
            sleepQualityVsProductivity * 100
          ).toFixed(0)}%)`
        );
      }

      if (Math.abs(sleepQualityVsFocus) > 0.4) {
        insights.push(
          `Sleep quality strongly influences focus ability (${(
            sleepQualityVsFocus * 100
          ).toFixed(0)}% correlation)`
        );
      }

      if (Math.abs(sleepDurationVsEnergy) > 0.3) {
        insights.push(
          `Sleep duration correlates with energy levels (${(
            sleepDurationVsEnergy * 100
          ).toFixed(0)}%)`
        );
      }

      if (
        averageSleepWhenHighProductivity - averageSleepWhenLowProductivity >
        0.5
      ) {
        insights.push(
          `You sleep ${(
            averageSleepWhenHighProductivity - averageSleepWhenLowProductivity
          ).toFixed(1)} hours more on nights before highly productive days`
        );
      }

      // Generate recommendations
      const recommendations = [];

      if (sleepDurationVsProductivity > 0.2) {
        recommendations.push(
          'Prioritize getting adequate sleep duration - it positively impacts your productivity'
        );
      }

      if (sleepQualityVsProductivity > 0.3) {
        recommendations.push(
          'Focus on improving sleep quality as it strongly correlates with your productivity'
        );
      }

      if (sleepQualityVsFocus > 0.3) {
        recommendations.push(
          'Better sleep quality will significantly improve your focus and concentration'
        );
      }

      if (averageSleepWhenHighProductivity > 7.5) {
        recommendations.push(
          `Aim for ${averageSleepWhenHighProductivity.toFixed(
            1
          )} hours of sleep - your optimal range for high productivity`
        );
      }

      if (sleepDurationVsEnergy > 0.2) {
        recommendations.push(
          'Consistent sleep duration helps maintain stable energy levels throughout the day'
        );
      }

      if (recommendations.length === 0) {
        recommendations.push(
          'Continue monitoring your sleep-productivity patterns to identify optimization opportunities'
        );
      }

      setStats({
        totalPairs: correlationData.length,
        sleepDurationVsProductivity,
        sleepDurationVsFocus,
        sleepDurationVsEnergy,
        sleepDurationVsTasks,
        sleepQualityVsProductivity,
        sleepQualityVsFocus,
        sleepQualityVsEnergy,
        sleepQualityVsTasks,
        averageSleepWhenHighProductivity,
        averageSleepWhenLowProductivity,
        bestSleepProductivityDay: {
          date: formatDate(bestDay.date),
          sleepQuality: bestDay.sleepQuality!,
          productivity: bestDay.productivityRating!,
        },
        insights,
        recommendations,
      });
    } catch (err) {
      console.error('Error fetching correlation data:', err);
      setError('Failed to load correlation analysis. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAndAnalyzeCorrelation();
  }, [fetchAndAnalyzeCorrelation]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDuration = (hours: number) => {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return `${wholeHours}h ${minutes}m`;
  };

  const getCorrelationStrength = (correlation: number) => {
    const abs = Math.abs(correlation);
    if (abs >= 0.7) return { label: 'Very Strong', color: 'text-green-600' };
    if (abs >= 0.5) return { label: 'Strong', color: 'text-blue-600' };
    if (abs >= 0.3) return { label: 'Moderate', color: 'text-yellow-600' };
    if (abs >= 0.1) return { label: 'Weak', color: 'text-orange-600' };
    return { label: 'Very Weak', color: 'text-gray-600' };
  };

  const getCorrelationBadge = (correlation: number) => {
    const strength = getCorrelationStrength(correlation);
    const direction =
      correlation > 0 ? 'Positive' : correlation < 0 ? 'Negative' : 'None';
    return (
      <div className='flex items-center space-x-2'>
        <Badge variant='outline' className={strength.color}>
          {strength.label}
        </Badge>
        <span
          className={`text-sm ${
            correlation > 0
              ? 'text-green-600'
              : correlation < 0
              ? 'text-red-600'
              : 'text-gray-600'
          }`}
        >
          {direction}
        </span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center space-x-2'>
            <BarChart3 className='h-5 w-5' />
            <span>Sleep-Productivity Correlation</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex items-center justify-center py-8'>
            <RefreshCw className='h-6 w-6 animate-spin text-blue-500' />
            <span className='ml-2 text-gray-600'>
              Analyzing sleep-productivity correlations...
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
            <span>Sleep-Productivity Correlation</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-center py-8'>
            <div className='text-red-500 mb-4'>{error}</div>
            <Button onClick={fetchAndAnalyzeCorrelation} variant='outline'>
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
            <span>Sleep-Productivity Correlation</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-center py-12'>
            <Brain className='h-12 w-12 text-gray-400 mx-auto mb-4' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>
              Insufficient Data
            </h3>
            <p className='text-gray-500 mb-4'>
              Track both sleep and productivity for several days to see
              correlation analysis.
            </p>
            <Badge variant='outline'>
              Need matching sleep and productivity entries
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <CardTitle className='flex items-center space-x-2'>
              <BarChart3 className='h-5 w-5 text-purple-600' />
              <span>Sleep-Productivity Correlation Analysis</span>
            </CardTitle>
            <Button
              onClick={fetchAndAnalyzeCorrelation}
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
              <div className='text-2xl font-bold text-purple-900'>
                {stats.totalPairs}
              </div>
              <div className='text-sm text-gray-600'>Data Points</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-green-900'>
                {formatDuration(stats.averageSleepWhenHighProductivity)}
              </div>
              <div className='text-sm text-gray-600'>
                Sleep (High Productivity)
              </div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-yellow-900'>
                {formatDuration(stats.averageSleepWhenLowProductivity)}
              </div>
              <div className='text-sm text-gray-600'>
                Sleep (Low Productivity)
              </div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-blue-900'>
                {stats.bestSleepProductivityDay.sleepQuality}⭐
              </div>
              <div className='text-sm text-gray-600'>Best Combo Day</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Correlation Matrix */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Sleep Duration Correlations */}
        <Card className='bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200'>
          <CardHeader>
            <CardTitle className='flex items-center space-x-2 text-blue-800'>
              <Clock className='h-5 w-5' />
              <span>Sleep Duration Impact</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <span className='text-sm text-blue-700'>vs Productivity</span>
                {getCorrelationBadge(stats.sleepDurationVsProductivity)}
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-sm text-blue-700'>vs Focus Quality</span>
                {getCorrelationBadge(stats.sleepDurationVsFocus)}
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-sm text-blue-700'>vs Energy Level</span>
                {getCorrelationBadge(stats.sleepDurationVsEnergy)}
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-sm text-blue-700'>
                  vs Tasks Completed
                </span>
                {getCorrelationBadge(stats.sleepDurationVsTasks)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sleep Quality Correlations */}
        <Card className='bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'>
          <CardHeader>
            <CardTitle className='flex items-center space-x-2 text-green-800'>
              <Moon className='h-5 w-5' />
              <span>Sleep Quality Impact</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <span className='text-sm text-green-700'>vs Productivity</span>
                {getCorrelationBadge(stats.sleepQualityVsProductivity)}
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-sm text-green-700'>vs Focus Quality</span>
                {getCorrelationBadge(stats.sleepQualityVsFocus)}
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-sm text-green-700'>vs Energy Level</span>
                {getCorrelationBadge(stats.sleepQualityVsEnergy)}
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-sm text-green-700'>
                  vs Tasks Completed
                </span>
                {getCorrelationBadge(stats.sleepQualityVsTasks)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights and Recommendations Row */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Correlation Insights */}
        <Card className='bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200'>
          <CardHeader>
            <CardTitle className='flex items-center space-x-2 text-purple-800'>
              <Brain className='h-5 w-5' />
              <span>Key Insights</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              {stats.insights.map((insight, index) => (
                <div
                  key={index}
                  className='flex items-start space-x-3 p-3 bg-white rounded-lg border border-purple-100'
                >
                  <CheckCircle className='flex-shrink-0 h-4 w-4 text-purple-600 mt-0.5' />
                  <p className='text-sm text-purple-900'>{insight}</p>
                </div>
              ))}
              <div className='mt-4 p-3 bg-white rounded-lg border border-purple-100'>
                <div className='flex items-center space-x-2 mb-2'>
                  <Award className='h-4 w-4 text-purple-600' />
                  <span className='text-sm font-medium text-purple-800'>
                    Best Performance Day
                  </span>
                </div>
                <p className='text-sm text-purple-900'>
                  {stats.bestSleepProductivityDay.date}:{' '}
                  {stats.bestSleepProductivityDay.sleepQuality}⭐ sleep quality,
                  {stats.bestSleepProductivityDay.productivity}⭐ productivity
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card className='bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200'>
          <CardHeader>
            <CardTitle className='flex items-center space-x-2 text-amber-800'>
              <Target className='h-5 w-5' />
              <span>Optimization Recommendations</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              {stats.recommendations.map((recommendation, index) => (
                <div
                  key={index}
                  className='flex items-start space-x-3 p-3 bg-white rounded-lg border border-amber-100'
                >
                  <AlertTriangle className='flex-shrink-0 h-4 w-4 text-amber-600 mt-0.5' />
                  <p className='text-sm text-amber-900'>{recommendation}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
