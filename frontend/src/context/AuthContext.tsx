import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// API base URL — uses proxy in development, full URL in production
const API_URL = process.env.REACT_APP_API_URL || '/api';

interface AuthUser {
    id: string;
    name: string;
    email: string;
    phone: string;
}

interface AuthContextType {
    user: AuthUser | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    signup: (name: string, email: string, phone: string, password: string) => Promise<{ success: boolean; error?: string }>;
    loginWithFirebaseToken: (firebaseToken: string, phone: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // On mount, check for existing token and validate it
    useEffect(() => {
        const savedToken = localStorage.getItem('veg_token');
        if (savedToken) {
            // Validate token by fetching user profile
            fetch(`${API_URL}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${savedToken}`,
                },
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success && data.user) {
                        setToken(savedToken);
                        setUser(data.user);
                    } else {
                        // Token is invalid — clear it
                        localStorage.removeItem('veg_token');
                    }
                })
                .catch(() => {
                    // Server unreachable — keep token for retry
                    // but try to use cached user data
                    const cachedUser = localStorage.getItem('veg_user');
                    if (cachedUser) {
                        try {
                            setToken(savedToken);
                            setUser(JSON.parse(cachedUser));
                        } catch {
                            localStorage.removeItem('veg_token');
                            localStorage.removeItem('veg_user');
                        }
                    }
                })
                .finally(() => {
                    setIsLoading(false);
                });
        } else {
            setIsLoading(false);
        }
    }, []);

    const signup = useCallback(async (name: string, email: string, phone: string, password: string) => {
        try {
            const res = await fetch(`${API_URL}/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, phone, password }),
            });

            const data = await res.json();

            if (data.success && data.token) {
                localStorage.setItem('veg_token', data.token);
                localStorage.setItem('veg_user', JSON.stringify(data.user));
                setToken(data.token);
                setUser(data.user);
                return { success: true };
            }

            return { success: false, error: data.error || 'Signup failed.' };
        } catch (error) {
            return { success: false, error: 'Cannot connect to server. Please try again.' };
        }
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (data.success && data.token) {
                localStorage.setItem('veg_token', data.token);
                localStorage.setItem('veg_user', JSON.stringify(data.user));
                setToken(data.token);
                setUser(data.user);
                return { success: true };
            }

            return { success: false, error: data.error || 'Login failed.' };
        } catch (error) {
            return { success: false, error: 'Cannot connect to server. Please try again.' };
        }
    }, []);

    const loginWithFirebaseToken = useCallback(async (firebaseToken: string, phone: string) => {
        try {
            const res = await fetch(`${API_URL}/auth/firebase-login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: firebaseToken, phone }),
            });
            const data = await res.json();
            
            if (data.success && data.token) {
                localStorage.setItem('veg_token', data.token);
                localStorage.setItem('veg_user', JSON.stringify(data.user));
                setToken(data.token);
                setUser(data.user);
                return { success: true };
            }
            return { success: false, error: data.error || 'Firebase authentication failed on backend.' };
        } catch (error) {
            return { success: false, error: 'Cannot connect to server.' };
        }
    }, []);

    const logout = useCallback(() => {
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
            isLoading,
            login,
            signup,
            loginWithFirebaseToken,
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
