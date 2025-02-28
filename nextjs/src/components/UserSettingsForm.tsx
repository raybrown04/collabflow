// src/components/UserSettingsForm.tsx
'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useUserSettings, useUpdateUserSettings, UserSettings } from '@/hooks/useUserSettings';
import { Bell, Moon, Calendar, Globe } from 'lucide-react';

interface UserSettingsFormProps {
    onSuccess: () => void;
    onError: (message: string) => void;
}

export function UserSettingsForm({ onSuccess, onError }: UserSettingsFormProps) {
    const { data: settings, isLoading, error } = useUserSettings();
    const updateSettings = useUpdateUserSettings();

    const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(settings?.theme || 'light');
    const [notificationEmail, setNotificationEmail] = useState(settings?.notification_email ?? true);
    const [notificationPush, setNotificationPush] = useState(settings?.notification_push ?? true);
    const [notificationCalendarReminders, setNotificationCalendarReminders] = useState(
        settings?.notification_calendar_reminders ?? true
    );
    const [notificationTaskReminders, setNotificationTaskReminders] = useState(
        settings?.notification_task_reminders ?? true
    );
    const [dateFormat, setDateFormat] = useState(settings?.date_format || 'MM/DD/YYYY');
    const [timeFormat, setTimeFormat] = useState(settings?.time_format || '12h');
    const [firstDayOfWeek, setFirstDayOfWeek] = useState(settings?.first_day_of_week || 0);
    const [language, setLanguage] = useState(settings?.language || 'en');

    // Update state when settings are loaded
    React.useEffect(() => {
        if (settings) {
            setTheme(settings.theme);
            setNotificationEmail(settings.notification_email);
            setNotificationPush(settings.notification_push);
            setNotificationCalendarReminders(settings.notification_calendar_reminders);
            setNotificationTaskReminders(settings.notification_task_reminders);
            setDateFormat(settings.date_format);
            setTimeFormat(settings.time_format);
            setFirstDayOfWeek(settings.first_day_of_week);
            setLanguage(settings.language);
        }
    }, [settings]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            await updateSettings.mutateAsync({
                theme,
                notification_email: notificationEmail,
                notification_push: notificationPush,
                notification_calendar_reminders: notificationCalendarReminders,
                notification_task_reminders: notificationTaskReminders,
                date_format: dateFormat,
                time_format: timeFormat,
                first_day_of_week: firstDayOfWeek,
                language
            });

            onSuccess();
        } catch (err) {
            console.error('Error saving settings:', err);
            onError(err instanceof Error ? err.message : 'Failed to save settings');
        }
    };

    if (isLoading) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="text-red-500">
                        Error loading settings: {error instanceof Error ? error.message : 'Unknown error'}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Moon className="h-5 w-5" />
                        Appearance
                    </CardTitle>
                    <CardDescription>Customize how the application looks</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="theme" className="block text-sm font-medium text-gray-700">
                                Theme
                            </label>
                            <select
                                id="theme"
                                value={theme}
                                onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 text-sm"
                            >
                                <option value="light">Light</option>
                                <option value="dark">Dark</option>
                                <option value="system">System</option>
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Notifications
                    </CardTitle>
                    <CardDescription>Configure your notification preferences</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label htmlFor="notification-email" className="text-sm font-medium text-gray-700">
                                Email Notifications
                            </label>
                            <input
                                type="checkbox"
                                id="notification-email"
                                checked={notificationEmail}
                                onChange={(e) => setNotificationEmail(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <label htmlFor="notification-push" className="text-sm font-medium text-gray-700">
                                Push Notifications
                            </label>
                            <input
                                type="checkbox"
                                id="notification-push"
                                checked={notificationPush}
                                onChange={(e) => setNotificationPush(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <label htmlFor="notification-calendar" className="text-sm font-medium text-gray-700">
                                Calendar Reminders
                            </label>
                            <input
                                type="checkbox"
                                id="notification-calendar"
                                checked={notificationCalendarReminders}
                                onChange={(e) => setNotificationCalendarReminders(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <label htmlFor="notification-tasks" className="text-sm font-medium text-gray-700">
                                Task Reminders
                            </label>
                            <input
                                type="checkbox"
                                id="notification-tasks"
                                checked={notificationTaskReminders}
                                onChange={(e) => setNotificationTaskReminders(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Date & Time
                    </CardTitle>
                    <CardDescription>Configure date and time preferences</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="date-format" className="block text-sm font-medium text-gray-700">
                                Date Format
                            </label>
                            <select
                                id="date-format"
                                value={dateFormat}
                                onChange={(e) => setDateFormat(e.target.value)}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 text-sm"
                            >
                                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="time-format" className="block text-sm font-medium text-gray-700">
                                Time Format
                            </label>
                            <select
                                id="time-format"
                                value={timeFormat}
                                onChange={(e) => setTimeFormat(e.target.value)}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 text-sm"
                            >
                                <option value="12h">12-hour (AM/PM)</option>
                                <option value="24h">24-hour</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="first-day" className="block text-sm font-medium text-gray-700">
                                First Day of Week
                            </label>
                            <select
                                id="first-day"
                                value={firstDayOfWeek}
                                onChange={(e) => setFirstDayOfWeek(parseInt(e.target.value))}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 text-sm"
                            >
                                <option value="0">Sunday</option>
                                <option value="1">Monday</option>
                                <option value="6">Saturday</option>
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5" />
                        Language
                    </CardTitle>
                    <CardDescription>Set your preferred language</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="language" className="block text-sm font-medium text-gray-700">
                                Language
                            </label>
                            <select
                                id="language"
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 text-sm"
                            >
                                <option value="en">English</option>
                                <option value="es">Español</option>
                                <option value="fr">Français</option>
                                <option value="de">Deutsch</option>
                                <option value="ja">日本語</option>
                                <option value="zh">中文</option>
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <button
                    onClick={handleSubmit}
                    disabled={updateSettings.isPending}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                >
                    {updateSettings.isPending ? 'Saving...' : 'Save Settings'}
                </button>
            </div>
        </>
    );
}
