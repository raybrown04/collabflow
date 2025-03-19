// src/components/ThemeSwitcher.tsx
'use client';

import React from 'react';
import { useGlobal } from '@/lib/context/GlobalContext';
import { useUpdateUserSettings } from '@/hooks/useUserSettings';
import { Sun, Moon, Monitor } from 'lucide-react';

interface ThemeSwitcherProps {
    className?: string;
    showLabel?: boolean;
}

export function ThemeSwitcher({ className = '', showLabel = false }: ThemeSwitcherProps) {
    const { theme, setTheme } = useGlobal();
    const updateSettings = useUpdateUserSettings();

    // Function to get the next theme in the cycle
    const getNextTheme = (currentTheme: 'light' | 'dark' | 'system'): 'light' | 'dark' | 'system' => {
        switch (currentTheme) {
            case 'light': return 'dark';
            case 'dark': return 'system';
            case 'system': return 'light';
            default: return 'light';
        }
    };

    // Function to get the current theme icon
    const getThemeIcon = () => {
        switch (theme) {
            case 'light': return <Sun className="h-5 w-5" />;
            case 'dark': return <Moon className="h-5 w-5" />;
            case 'system': return <Monitor className="h-5 w-5" />;
            default: return <Sun className="h-5 w-5" />;
        }
    };

    // Function to get the theme label
    const getThemeLabel = () => {
        switch (theme) {
            case 'light': return 'Light';
            case 'dark': return 'Dark';
            case 'system': return 'System';
            default: return 'Light';
        }
    };

    const handleThemeToggle = async () => {
        const newTheme = getNextTheme(theme);

        // Update theme in context immediately for responsive UI
        setTheme(newTheme);

        // Persist theme preference to database
        try {
            await updateSettings.mutateAsync({
                theme: newTheme
            });
        } catch (error) {
            console.error('Failed to save theme preference:', error);
        }
    };

    return (
        <button
            onClick={handleThemeToggle}
            className={`p-2 rounded-md transition-colors bg-primary text-primary-foreground hover:bg-primary/90 ${className}`}
            aria-label={`Toggle theme (current: ${theme})`}
            title={`Toggle theme (current: ${theme})`}
        >
            <div className="flex items-center">
                {getThemeIcon()}
                {showLabel && <span className="ml-2">{getThemeLabel()}</span>}
            </div>
        </button>
    );
}
