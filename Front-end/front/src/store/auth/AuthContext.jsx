import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [mustChangePassword, setMustChangePassword] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        const storedMustChange = localStorage.getItem('must_change_password');
        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
            setMustChangePassword(storedMustChange === 'true');
        }
        setLoading(false);
    }, []);

    const loginSuccess = (data) => {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('must_change_password', String(data.must_change_password));
        setToken(data.token);
        setUser(data.user);
        setMustChangePassword(data.must_change_password);
    };

    const passwordChanged = () => {
        localStorage.setItem('must_change_password', 'false');
        setMustChangePassword(false);
    };

    const updateUserContext = (updatedFields) => {
        const merged = { ...user, ...updatedFields };
        localStorage.setItem('user', JSON.stringify(merged));
        setUser(merged);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('must_change_password');
        setToken(null);
        setUser(null);
        setMustChangePassword(false);
    };

    const isAuthenticated = !!token;

    return (
        <AuthContext.Provider value={{
            user, token, mustChangePassword, loading,
            isAuthenticated, loginSuccess, passwordChanged, updateUserContext, logout,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};
