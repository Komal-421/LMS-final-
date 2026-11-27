import { Navigate, useLocation } from 'react-router-dom';
import { useAuthState } from '../context/AuthContext';

export default function PrivateRoute({ roles, children }) {
  const { user, loading } = useAuthState();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
          <p className="text-sm font-medium text-slate-600">
            Verifying session...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const hasRequestedRole = !roles || roles.some((role) => role === 'admin' ? user.isAdmin === true || user.roles?.includes('admin') : (user.roles?.includes(role) || user.role === role));

  if (!hasRequestedRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
