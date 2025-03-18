// src/lib/context/GlobalContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSupabaseClient, initializeSupabaseClient } from '@/lib/supabase/clientSingleton';
import { Session } from '@supabase/supabase-js';
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
    session: Session | null; // Add session to context
    theme: Theme;
    setTheme: (theme: Theme) => void;
    refreshSession: () => Promise<boolean>; // Add refresh function that returns success status
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export function GlobalProvider({ children }: { children: React.ReactNode }) {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [theme, setThemeState] = useState<Theme>('light');
    const { data: userSettings } = useUserSettings();

    // Initialize Supabase client and set up auth listeners
    useEffect(() => {
        const cleanup = initializeSupabaseClient();
        return cleanup;
    }, []);

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

    // Add session refresh function with debounce to prevent infinite loops
    const refreshSession = async () => {
        // Use a static flag to prevent multiple simultaneous refresh attempts
        if ((refreshSession as any).isRefreshing) {
            console.log('Session refresh already in progress, skipping');
            return false;
        }
        
        try {
            (refreshSession as any).isRefreshing = true;
            setLoading(true);
            
            console.log('Refreshing session...');
            const supabase = getSupabaseClient();
            const { data: { session }, error } = await supabase.auth.getSession();
            
            if (error) {
                console.error('Session refresh error:', error);
                return false;
            }
            
            if (session) {
                console.log('Session refresh successful');
                setSession(session);
                setUser({
                    email: session.user.email!,
                    id: session.user.id,
                    registered_at: new Date(session.user.created_at || Date.now())
                });
                return true;
            } else {
                console.log('No session found during refresh');
                setSession(null);
                setUser(null);
                return false;
            }
        } catch (error) {
            console.error('Error refreshing session:', error);
            return false;
        } finally {
            setLoading(false);
            // Reset the flag after a short delay to allow for potential cleanup
            setTimeout(() => {
                (refreshSession as any).isRefreshing = false;
            }, 500);
        }
    };
    
    // Initialize the static flag
    (refreshSession as any).isRefreshing = false;

    // Load user data and session on mount
    useEffect(() => {
        async function loadUserData() {
            try {
                const supabase = getSupabaseClient();
                const { data: { session } } = await supabase.auth.getSession();
                
                if (session?.user) {
                    setSession(session);
                    setUser({
                        email: session.user.email!,
                        id: session.user.id,
                        registered_at: new Date(session.user.created_at || Date.now())
                    });
                } else {
                    setSession(null);
                    setUser(null);
                }
            } catch (error) {
                console.error('Error loading user data:', error);
            } finally {
                setLoading(false);
            }
        }

        loadUserData();
    }, []);

    return (
        <GlobalContext.Provider value={{ 
            loading, 
            user, 
            session, 
            theme, 
            setTheme,
            refreshSession 
        }}>
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
