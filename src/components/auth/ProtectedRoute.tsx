import { useAuth } from "@/context/AuthContext";
import { Navigate, Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user.user_metadata?.role || 'user';
    if (!allowedRoles.includes(userRole)) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
            <h1 className="text-3xl font-bold mb-2">Access Denied</h1>
            <p className="text-muted-foreground mb-4">You do not have permission to view this page.</p>
            <a href="/" className="text-primary hover:underline">Return to Home</a>
        </div>
      );
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;
