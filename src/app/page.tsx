'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <main className='flex flex-col items-center justify-center min-h-screen'>
      <h1 className='text-3xl font-bold mb-4'>
        Sleep Tracker & Productivity Analysis
      </h1>
      <p className='mb-8 text-center max-w-md'>
        Track your sleep patterns and analyze how they affect your productivity.
        Sign in or create an account to get started!
      </p>
      <div className='flex gap-4'>
        <Link
          href='/signin'
          className='bg-blue-600 text-white px-4 py-2 rounded'
        >
          Sign In
        </Link>
        <Link
          href='/signup'
          className='bg-gray-200 text-blue-600 px-4 py-2 rounded border border-blue-600'
        >
          Sign Up
        </Link>
      </div>
    </main>
  );
}
