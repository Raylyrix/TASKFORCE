import { Suspense } from 'react';
import { AuthCallback } from '@/components/auth/auth-callback';

export default function Callback() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthCallback />
    </Suspense>
  );
}
