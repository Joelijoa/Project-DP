import { Navigate } from 'react-router-dom';
import { useAuth } from '../store/auth/AuthContext';

const ProtectedRoute = ({ children, roles }) => {
    const { isAuthenticated, mustChangePassword, user, loading } = useAuth();

    if (loading) return null;

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Forcer le changement de mot de passe avant tout accès
    if (mustChangePassword) {
        return <Navigate to="/change-password" replace />;
    }

    // Vérifier le rôle si spécifié
    if (roles && !roles.includes(user?.role)) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

export default ProtectedRoute;
