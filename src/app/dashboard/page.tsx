'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      setLoading(false);
    }
  }, [status, router]);

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500'></div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <header className='bg-white shadow'>
        <div className='max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center'>
          <h1 className='text-3xl font-bold text-gray-900'>Dashboard</h1>
          <div className='flex items-center space-x-4'>
            <span className='text-gray-700'>
              Welcome, {session?.user?.name || session?.user?.email}
            </span>
            <Link
              href='/auth/signout'
              className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
            >
              Sign Out
            </Link>
          </div>
        </div>
      </header>
      <main className='max-w-7xl mx-auto py-6 sm:px-6 lg:px-8'>
        <div className='px-4 py-6 sm:px-0'>
          <div className='border-4 border-dashed border-gray-200 rounded-lg h-96 p-4'>
            <h2 className='text-xl font-semibold mb-4'>Your Activities</h2>
            <p className='text-gray-600'>
              Welcome to your ActiveTime dashboard. This is where you&apos;ll be
              able to track your activities and manage your time.
            </p>

            {/* Activity cards placeholder */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-6'>
              <div className='bg-white p-4 rounded-lg shadow'>
                <h3 className='font-medium'>Recent Activity</h3>
                <p className='text-gray-500 text-sm mt-1'>
                  No recent activities yet.
                </p>
              </div>
              <div className='bg-white p-4 rounded-lg shadow'>
                <h3 className='font-medium'>Today&apos;s Focus</h3>
                <p className='text-gray-500 text-sm mt-1'>
                  Set your focus for today.
                </p>
              </div>
              <div className='bg-white p-4 rounded-lg shadow'>
                <h3 className='font-medium'>Weekly Summary</h3>
                <p className='text-gray-500 text-sm mt-1'>
                  Track your progress over time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
