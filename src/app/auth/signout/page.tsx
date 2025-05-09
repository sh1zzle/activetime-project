'use client';

import { signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SignOutPage() {
  const [isSigningOut, setIsSigningOut] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const handleSignOut = async () => {
      try {
        await signOut({ redirect: false });
        setTimeout(() => {
          router.push('/auth/signin');
        }, 1500);
      } catch (error) {
        console.error('Error signing out:', error);
        setIsSigningOut(false);
      }
    };

    handleSignOut();
  }, [router]);

  return (
    <main className='min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4'>
      <div className='max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg text-center'>
        {isSigningOut ? (
          <>
            <h2 className='mt-6 text-center text-2xl font-extrabold text-gray-900'>
              Signing you out...
            </h2>
            <div className='mt-4 flex justify-center'>
              <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500'></div>
            </div>
            <p className='mt-4 text-gray-600'>
              You&apos;ll be redirected in a moment
            </p>
          </>
        ) : (
          <>
            <h2 className='mt-6 text-center text-2xl font-extrabold text-gray-900'>
              Something went wrong
            </h2>
            <p className='mt-2 text-gray-600'>
              There was an issue signing you out.
            </p>
            <div className='mt-6'>
              <button
                onClick={() => router.push('/auth/signin')}
                className='w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              >
                Return to sign in
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
