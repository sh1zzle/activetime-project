'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Moon, Sun, User, LogOut, Sparkles, Activity } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SleepEntryForm from './components/SleepEntryForm';
import SleepHistory from './components/SleepHistory';
import SleepStatistics from './components/SleepStatistics';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signin');
    } else if (status === 'authenticated') {
      setLoading(false);
    }
  }, [status, router]);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const handleSleepEntrySuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getTimeIcon = () => {
    const hour = currentTime.getHours();
    if (hour >= 6 && hour < 18) {
      return <Sun className='h-5 w-5 text-yellow-500' />;
    }
    return <Moon className='h-5 w-5 text-blue-400' />;
  };

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100'>
        <div className='flex flex-col items-center space-y-4'>
          <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500'></div>
          <p className='text-gray-600'>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50'>
      {/* Modern Header */}
      <header className='border-b border-gray-200 bg-white/80 backdrop-blur-md sticky top-0 z-50'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between items-center py-4'>
            {/* Logo and Title */}
            <div className='flex items-center space-x-3'>
              <div className='flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600'>
                <Activity className='h-6 w-6 text-white' />
              </div>
              <div>
                <h1 className='text-2xl font-bold text-gray-900'>
                  Sleep Tracker
                </h1>
                <p className='text-sm text-gray-500'>
                  Track your rest, improve your health
                </p>
              </div>
            </div>

            {/* User Section */}
            <div className='flex items-center space-x-4'>
              <div className='flex items-center space-x-2 text-sm text-gray-600'>
                {getTimeIcon()}
                <span>
                  {currentTime.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              <div className='flex items-center space-x-3 px-3 py-2 rounded-lg bg-gray-50'>
                <div className='flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600'>
                  <User className='h-4 w-4 text-white' />
                </div>
                <div className='text-sm'>
                  <p className='font-medium text-gray-900'>
                    {session?.user?.name || 'User'}
                  </p>
                  <p className='text-gray-500 text-xs'>
                    {session?.user?.email}
                  </p>
                </div>
              </div>

              <Button variant='outline' size='sm' asChild>
                <Link href='/signout' className='flex items-center space-x-2'>
                  <LogOut className='h-4 w-4' />
                  <span>Sign Out</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Welcome Section */}
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='flex items-center justify-between mb-8'>
          <div>
            <h2 className='text-3xl font-bold text-gray-900 mb-2'>
              {getGreeting()}, {session?.user?.name?.split(' ')[0] || 'there'}!
              👋
            </h2>
            <p className='text-gray-600'>
              Ready to track your sleep and improve your well-being?
            </p>
          </div>
          <Badge variant='outline' className='flex items-center space-x-1'>
            <Sparkles className='h-3 w-3' />
            <span>Sleep Insights</span>
          </Badge>
        </div>

        {/* Main Content Grid */}
        <div className='grid grid-cols-1 xl:grid-cols-12 gap-8'>
          <div className='xl:col-span-8'>
            <SleepStatistics key={`stats-${refreshTrigger}`} />
          </div>
          <div className='flex flex-row gap-4'>
            <SleepEntryForm onSuccess={handleSleepEntrySuccess} />
            <SleepHistory key={`history-${refreshTrigger}`} />
          </div>
        </div>
      </div>
    </div>
  );
}
