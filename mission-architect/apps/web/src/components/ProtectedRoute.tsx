import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, checkSession } = useAuthStore();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    checkSession().finally(() => setChecked(true));
  }, [checkSession]);

  if (!checked || isLoading) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center"
        style={{ background: '#060a14' }}
      >
        <span
          className="font-pixel text-cyan-400 text-xs"
          style={{
            textShadow: '0 0 10px #00e5ff',
            animation: 'pulse 1.4s ease-in-out infinite',
          }}
        >
          AUTHENTICATING...
        </span>
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
