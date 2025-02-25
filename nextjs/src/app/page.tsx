'use client';

import LoginPage from './auth/login/page';

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <LoginPage />
      </div>
    </div>
  );
}
