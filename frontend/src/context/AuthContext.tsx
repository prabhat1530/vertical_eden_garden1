import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { refreshAccessToken } from '../services/api';

// API base URL — uses proxy in development, full URL in production
const API_URL = process.env.REACT_APP_API_URL || '/api';

// Silently refresh the access token a little before the ~15m expiry.
const REFRESH_INTERVAL_MS = 12 * 60 * 1000;

interface AuthUser {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
}

interface AuthContextType {
    user: AuthUser | null;
    token: string | null;
    isAuthenticated: boolean;
    isAdmin: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    signup: (name: string, email: string, phone: string, password: string) => Promise<{ success: boolean; error?: string }>;
    sendOtp: (phone: string) => Promise<{ success: boolean; error?: string }>;
    verifyOtp: (phone: string, otp: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);

    // Persist a successful auth result everywhere it's read.
    const applyAuth = useCallback((newToken: string, newUser: AuthUser) => {
        localStorage.setItem('veg_token', newToken);
        localStorage.setItem('veg_user', JSON.stringify(newUser));
        setToken(newToken);
        setUser(newUser);
    }, []);

    // On mount: try to restore the session from the httpOnly refresh cookie.
    useEffect(() => {
        let cancelled = false;

        (async () => {
            const newToken = await refreshAccessToken();
            if (!cancelled) {
                if (newToken) {
                    const cached = localStorage.getItem('veg_user');
                    setToken(newToken);
                    if (cached) {
                        try { setUser(JSON.parse(cached)); } catch { /* ignore */ }
                    }
                } else {
                    // No valid session — clear any stale local data.
                    localStorage.removeItem('veg_token');
                    localStorage.removeItem('veg_user');
                    setToken(null);
                    setUser(null);
                }
                setIsLoading(false);
            }
        })();

        return () => { cancelled = true; };
    }, []);

    // While logged in, refresh the access token on a timer.
    useEffect(() => {
        if (token) {
            refreshTimer.current = setInterval(() => {
                refreshAccessToken().then((t) => {
                    if (t) setToken(t);
                });
            }, REFRESH_INTERVAL_MS);
        }
        return () => {
            if (refreshTimer.current) clearInterval(refreshTimer.current);
        };
    }, [token]);

    const signup = useCallback(async (name: string, email: string, phone: string, password: string) => {
        try {
            const res = await fetch(`${API_URL}/auth/signup`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, phone, password }),
            });
            const data = await res.json();
            if (data.success && data.token) {
                applyAuth(data.token, data.user);
                return { success: true };
            }
            return { success: false, error: data.error || 'Signup failed.' };
        } catch (error) {
            return { success: false, error: 'Cannot connect to server. Please try again.' };
        }
    }, [applyAuth]);

    const login = useCallback(async (email: string, password: string) => {
        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (data.success && data.token) {
                applyAuth(data.token, data.user);
                return { success: true };
            }
            return { success: false, error: data.error || 'Login failed.' };
        } catch (error) {
            return { success: false, error: 'Cannot connect to server. Please try again.' };
        }
    }, [applyAuth]);

    const sendOtp = useCallback(async (phone: string) => {
        try {
            const res = await fetch(`${API_URL}/auth/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone }),
            });
            const data = await res.json();
            if (data.success) return { success: true };
            return { success: false, error: data.error || 'Failed to send OTP.' };
        } catch (error) {
            return { success: false, error: 'Cannot connect to server.' };
        }
    }, []);

    const verifyOtp = useCallback(async (phone: string, otp: string) => {
        try {
            const res = await fetch(`${API_URL}/auth/verify-otp`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, otp }),
            });
            const data = await res.json();
            if (data.success && data.token) {
                applyAuth(data.token, data.user);
                return { success: true };
            }
            return { success: false, error: data.error || 'Invalid OTP.' };
        } catch (error) {
            return { success: false, error: 'Cannot connect to server.' };
        }
    }, [applyAuth]);

    const logout = useCallback(() => {
        // Revoke the refresh token server-side (best effort), then clear locally.
        fetch(`${API_URL}/auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => {});
        if (refreshTimer.current) clearInterval(refreshTimer.current);
        setUser(null);
        setToken(null);
        localStorage.removeItem('veg_token');
        localStorage.removeItem('veg_user');
    }, []);

    return (
        <AuthContext.Provider value={{
            user,
            token,
            isAuthenticated: !!user && !!token,
            isAdmin: !!user && user.role === 'admin',
            isLoading,
            login,
            signup,
            sendOtp,
            verifyOtp,
            logout,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;
