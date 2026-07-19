import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../api/axiosConfig'; 

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('user');
        try {
            return savedUser ? JSON.parse(savedUser) : null;
        } catch {
            return null;
        }
    });

    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [loading, setLoading] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const clearAuth = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setToken(null);
    };

    useEffect(() => {
        const validateAuth = () => {
            const savedToken = localStorage.getItem('token');
            const savedUser = localStorage.getItem('user');
            if (!savedToken || !savedUser) {
                clearAuth();
            }
            setLoading(false);
        };
        validateAuth();
    }, []);

    const login = (userData, userToken) => {
        localStorage.setItem('token', userToken);
        localStorage.setItem('user', JSON.stringify(userData));
        setToken(userToken);
        setUser(userData);
        setIsLoggingOut(false);
        window.dispatchEvent(new Event('auth:login'));
    };

    const logout = () => {
        setIsLoggingOut(true);
        const token = localStorage.getItem('token'); // grab before clearing
        window.dispatchEvent(new CustomEvent('auth:logout', { detail: { token } }));
        clearAuth();
    };

    return (
        <AuthContext.Provider value={{ 
            user, 
            token, 
            login, 
            logout,
            loading,
            isLoggingOut,
            isLoggedIn: !!token 
        }}>
            {!loading ? children : (
                <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#f5c27a] border-t-transparent"></div>
                </div>
            )}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};