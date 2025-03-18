'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Import LoginPage with client-side only rendering
const LoginPage = dynamic(() => import('./auth/login/page'), {
  ssr: false,
  loading: () => (
    <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
      <div className="animate-pulse space-y-6">
        <div className="h-10 bg-gray-200 rounded"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
    </div>
  )
});

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <Suspense fallback={
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="animate-pulse space-y-6">
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </div>
        }>
          <LoginPage />
        </Suspense>
      </div>
    </div>
  );
}
