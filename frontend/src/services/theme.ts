import { useCallback, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'veg_theme';
const systemQuery = () => window.matchMedia('(prefers-color-scheme: dark)');

// public/index.html has already applied the starting theme before React loads.
const currentTheme = (): Theme =>
    document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';

const savedTheme = (): Theme | null => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved === 'light' || saved === 'dark' ? saved : null;
    } catch {
        return null; // storage blocked (e.g. private mode): just don't remember
    }
};

const applyTheme = (theme: Theme) => document.documentElement.setAttribute('data-theme', theme);

export const useTheme = () => {
    const [theme, setTheme] = useState<Theme>(currentTheme);

    // Until the visitor picks a theme, follow the device's light/dark setting live.
    useEffect(() => {
        const query = systemQuery();
        const onChange = (e: MediaQueryListEvent) => {
            if (savedTheme()) return;
            const next: Theme = e.matches ? 'dark' : 'light';
            applyTheme(next);
            setTheme(next);
        };
        query.addEventListener('change', onChange);
        return () => query.removeEventListener('change', onChange);
    }, []);

    const toggleTheme = useCallback(() => {
        const next: Theme = currentTheme() === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        try { localStorage.setItem(STORAGE_KEY, next); } catch { /* not remembered */ }
        setTheme(next);
    }, []);

    return { theme, toggleTheme };
};
