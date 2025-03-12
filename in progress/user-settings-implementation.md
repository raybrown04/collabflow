# User Profile and Settings Implementation

{/* Updated to reflect current project state (sidebar, calendar, events list completed) - 3/4/2025 */}

This document outlines the implementation of the User Profile and Settings feature in the CollabFlow project.

## Table of Contents
- [Database Schema](#database-schema)
- [Core Components](#core-components)
- [Theme System](#theme-system)
- [Future Enhancements](#future-enhancements)

---

## Database Schema

The user settings are stored in a `user_settings` table:

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

---

## Core Components

### UserSettingsForm
- Provides UI for updating user settings
- Includes theme selection, notification preferences, date/time formats, and language
- Uses React Query hooks for data fetching and mutations

### ThemeSwitcher
- Allows switching between light, dark, and system themes
- Integrated in dashboard header and user settings

---

## Theme System

The theme system uses CSS variables for theme-specific values:

```css
:root,
.light-theme {
  --color-primary: 10 10 10;
  --color-secondary: 47 60 152;
  --color-background: 255 255 255;
  --color-surface: 246 246 246;
}

.dark-theme {
  --color-primary: 255 255 255;
  --color-secondary: 102 115 182;
  --color-background: 10 10 10;
  --color-surface: 30 30 30;
}
```

---

## Future Enhancements

1. **User Profile Picture**
2. **Account Management**
3. **Custom Theme Creation**
4. **Import/Export Settings**
