// src/hooks/useUserSettings.ts
'use client';

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Database } from "@/lib/database.types";
import { supabase, getCurrentUserId, isCurrentUserAdmin, TEST_USER_ID } from "@/lib/auth";

export type UserSettings = Database['public']['Tables']['user_settings']['Row'];
export type UserSettingsUpdate = Database['public']['Tables']['user_settings']['Update'];

// Default settings for development mode
const defaultSettings: UserSettings = {
    id: 'dev-settings-id',
    user_id: TEST_USER_ID,
    theme: 'light',
    notification_email: true,
    notification_push: true,
    notification_calendar_reminders: true,
    notification_task_reminders: true,
    date_format: 'MM/DD/YYYY',
    time_format: '12h',
    first_day_of_week: 0,
    language: 'en',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
};

// Check if we're in development mode
const isDevelopment = typeof window !== 'undefined' && window.location.hostname === 'localhost';

async function fetchUserSettings(): Promise<UserSettings> {
    // In development mode, return default settings
    if (isDevelopment) {
        console.log("Development mode: Using default user settings");
        return defaultSettings;
    }

    try {
        // Get the current user ID
        const userId = await getCurrentUserId();

        // Use the get_user_settings function to get or create settings
        const { data, error } = await supabase.rpc('get_user_settings', {
            p_user_id: userId
        });

        if (error) {
            console.error('Error fetching user settings:', error);
            throw new Error(`Failed to fetch user settings: ${error.message}`);
        }

        return data as UserSettings;
    } catch (err) {
        console.error('Error in fetchUserSettings:', err);

        // Fallback to default settings in development mode if there's an error
        if (isDevelopment) {
            console.warn("Falling back to default settings after error");
            return defaultSettings;
        }

        throw err;
    }
}

async function updateUserSettings(updates: UserSettingsUpdate): Promise<UserSettings> {
    // In development mode, return updated default settings
    if (isDevelopment) {
        console.log("Development mode: Updating settings locally", updates);
        return {
            ...defaultSettings,
            ...updates,
            updated_at: new Date().toISOString()
        };
    }

    try {
        // Get the current user ID
        const userId = await getCurrentUserId();

        // Check if settings exist
        const { data: existingSettings, error: checkError } = await supabase
            .from('user_settings')
            .select('id')
            .eq('user_id', userId)
            .single();

        let result;

        if (checkError && checkError.code === 'PGRST116') { // PGRST116 is "no rows returned"
            // Insert new settings
            result = await supabase
                .from('user_settings')
                .insert({
                    user_id: userId,
                    ...updates
                })
                .select()
                .single();
        } else if (checkError) {
            throw checkError;
        } else {
            // Update existing settings
            result = await supabase
                .from('user_settings')
                .update(updates)
                .eq('user_id', userId)
                .select()
                .single();
        }

        if (result.error) {
            throw result.error;
        }

        return result.data as UserSettings;
    } catch (err) {
        console.error('Error updating user settings:', err);
        throw err;
    }
}

export function useUserSettings() {
    return useQuery({
        queryKey: ['userSettings'],
        queryFn: fetchUserSettings,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

export function useUpdateUserSettings() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateUserSettings,
        onSuccess: (data) => {
            queryClient.setQueryData(['userSettings'], data);
        },
        onError: (error) => {
            console.error('Error in update user settings mutation:', error);
        },
    });
}
