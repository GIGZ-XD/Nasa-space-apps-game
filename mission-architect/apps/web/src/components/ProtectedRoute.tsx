import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Wraps any route that requires authentication.
 *
 * - On first render it calls `checkSession()` to restore a token
 *   that survived a page refresh.
 * - While the session check is in-flight it shows a minimal loading
 *   screen so the user is never flashed to /login unnecessarily.
 * - Once resolved, unauthenticated visitors are redirected to /login.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, checkSession } = useAuthStore();
  const location = useLocation();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    checkSession().finally(() => setChecked(true));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
