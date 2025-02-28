# User Profile and Settings Implementation

This document outlines the implementation of the User Profile and Settings feature in the CollabFlow project.

## Table of Contents
- [Overview](#overview)
- [Database Schema](#database-schema)
- [Components](#components)
- [Theme System](#theme-system)
- [Integration Points](#integration-points)
- [Future Enhancements](#future-enhancements)

---

## Overview

The User Profile and Settings feature allows users to customize their experience in the CollabFlow application. It includes:

1. **User Settings Database Schema**: Stores user preferences like theme, notification settings, date/time formats, and language.
2. **User Settings UI**: Provides an interface for users to view and update their settings.
3. **Theme Switching**: Allows users to switch between light, dark, and system themes.
4. **Global Context**: Provides access to user settings and theme across the application.

## Database Schema

The user settings are stored in a new `user_settings` table in the Supabase database:

```sql
create table user_settings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null unique,
  theme text default 'light' check (theme in ('light', 'dark', 'system')),
  notification_email boolean default true,
  notification_push boolean default true,
  notification_calendar_reminders boolean default true,
  notification_task_reminders boolean default true,
  date_format text default 'MM/DD/YYYY',
  time_format text default '12h',
  first_day_of_week integer default 0 check (first_day_of_week between 0 and 6),
  language text default 'en',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

The table includes:
- **Theme Preferences**: Light, dark, or system theme
- **Notification Settings**: Email, push, calendar, and task reminders
- **Date/Time Preferences**: Date format, time format, and first day of week
- **Language Preference**: User's preferred language

A database function `get_user_settings` is provided to get or create settings for a user:

```sql
create or replace function get_user_settings(p_user_id uuid)
returns json
language plpgsql
security definer
as $$
declare
  settings json;
begin
  -- Try to get existing settings
  select row_to_json(us)
  into settings
  from user_settings us
  where user_id = p_user_id;
  
  -- If no settings exist, create default settings
  if settings is null then
    insert into user_settings (user_id)
    values (p_user_id)
    returning row_to_json(user_settings) into settings;
  end if;
  
  return settings;
end;
$$;
```

## Components

### UserSettingsForm

The `UserSettingsForm` component provides a UI for users to update their settings. It includes:

- **Theme Selection**: Light, dark, or system theme
- **Notification Preferences**: Email, push, calendar, and task reminders
- **Date/Time Preferences**: Date format, time format, and first day of week
- **Language Selection**: User's preferred language

The component uses the `useUserSettings` and `useUpdateUserSettings` hooks to fetch and update settings.

### ThemeSwitcher

The `ThemeSwitcher` component provides a UI for switching between light, dark, and system themes. It's used in:

- The dashboard header for quick access
- The user settings dropdown menu
- The user settings page

## Theme System

The theme system uses CSS variables to define colors and other theme-specific values. The theme is applied to the document root element using the `data-theme` attribute and CSS classes.

### CSS Variables

The theme system defines CSS variables for:
- Core colors (primary, secondary, background, surface, error, success)
- Aliases for shadcn UI components
- Layout values (gutter, margin, sidebar widths)

#### Dark Mode Improvements

The dark mode theme has been refined to follow the system-wide style guide:
- Removed yellow colors and replaced with blues and greys
- Used a consistent color palette based on the RBIIILV Design System
- Ensured proper contrast for accessibility
- Maintained brand colors (Dynamic Blue) for consistency

```css
.dark-theme {
    /* Core Colors - Following the system-wide style guide with blacks, blues, and greys */
    --color-primary: 210 40% 98%;    /* Light Blue-White */
    --color-secondary: 47 60 152;    /* Dynamic Blue - keeping brand color */
    --color-background: 10 10 10;    /* Rich Black */
    --color-surface: 30 30 30;       /* Dark Grey */
    --color-error: 220 38 38;        /* Crimson - keeping consistent */
    --color-success: 22 163 74;      /* Emerald - keeping consistent */
    
    /* Additional shadcn aliases... */
}
```

### Theme Context

The `GlobalContext` provides access to the current theme and a function to update it:

```typescript
interface GlobalContextType {
  // ...other properties
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}
```

The context also handles:
- Loading the user's theme preference from settings
- Applying the theme to the document with optimized performance
- Handling system theme preference changes in real-time

#### Performance Improvements

The theme transition has been optimized for better performance:
- Reduced transition duration from 0.3s to 0.15s for faster theme switching
- Implemented immediate theme application without delays
- Added event listeners for system theme changes when using 'system' theme
- Optimized CSS selectors and transitions for better rendering performance

## Integration Points

The User Profile and Settings feature integrates with several parts of the application:

1. **GlobalContext**: Provides access to user settings and theme
2. **DashboardHeader**: Includes the ThemeSwitcher component
3. **User Settings Page**: Provides a UI for updating settings
4. **CSS Variables**: Define theme-specific values used throughout the application

## Future Enhancements

Potential future enhancements for the User Profile and Settings feature:

1. **User Profile Picture**: Allow users to upload and manage their profile picture
2. **Account Management**: Add options for changing email, password, and other account details
3. **Notification Preferences**: More granular control over notification types and frequency
4. **Accessibility Settings**: Font size, contrast, and other accessibility options
5. **Custom Theme Creation**: Allow users to create and save custom themes
6. **Import/Export Settings**: Allow users to export and import their settings
