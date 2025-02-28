// src/lib/context/GlobalContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { createSPASassClient } from '@/lib/supabase/client';
import { useUserSettings } from '@/hooks/useUserSettings';

type User = {
    email: string;
    id: string;
    registered_at: Date;
};

type Theme = 'light' | 'dark' | 'system';

interface GlobalContextType {
    loading: boolean;
    user: User | null;
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export function GlobalProvider({ children }: { children: React.ReactNode }) {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [theme, setThemeState] = useState<Theme>('light');
    const { data: userSettings } = useUserSettings();

    // Set theme based on user settings
    useEffect(() => {
        if (userSettings?.theme) {
            setThemeState(userSettings.theme);
        }
    }, [userSettings]);

    // Apply theme to document with improved performance
    useEffect(() => {
        const root = window.document.documentElement;

        // Function to apply theme immediately without delay
        const applyTheme = (themeToApply: 'light' | 'dark') => {
            // Remove previous theme classes
            root.classList.remove('light-theme', 'dark-theme');

            // Apply the theme class
            root.classList.add(`${themeToApply}-theme`);

            // Set data-theme attribute for components that use it
            root.setAttribute('data-theme', themeToApply);
        };

        // Determine which theme to apply
        let appliedTheme = theme;

        if (theme === 'system') {
            // Check system preference
            const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            appliedTheme = systemPrefersDark ? 'dark' : 'light';
        }

        // Apply theme immediately
        applyTheme(appliedTheme as 'light' | 'dark');

        // Listen for system preference changes if using system theme
        if (theme === 'system') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

            const handleChange = (e: MediaQueryListEvent) => {
                applyTheme(e.matches ? 'dark' : 'light');
            };

            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }
    }, [theme]);

    // Function to set theme
    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
    };

    useEffect(() => {
        async function loadData() {
            try {
                const supabase = await createSPASassClient();
                const client = supabase.getSupabaseClient();

                // Get user data
                const { data: { user } } = await client.auth.getUser();
                if (user) {
                    setUser({
                        email: user.email!,
                        id: user.id,
                        registered_at: new Date(user.created_at)
                    });
                } else {
                    throw new Error('User not found');
                }

            } catch (error) {
                console.error('Error loading data:', error);
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, []);

    return (
        <GlobalContext.Provider value={{ loading, user, theme, setTheme }}>
            {children}
        </GlobalContext.Provider>
    );
}

export const useGlobal = () => {
    const context = useContext(GlobalContext);
    if (context === undefined) {
        throw new Error('useGlobal must be used within a GlobalProvider');
    }
    return context;
};
