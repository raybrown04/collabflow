# Modern Calendar Components

A collection of React 19 compatible calendar components for the application.

## Overview

This directory contains a set of calendar components that are designed to work with React 19. These components replace the previous implementation that used `react-day-picker`, which was causing compatibility issues with React 19.

## Components

### ModernCalendar

The main calendar component that integrates all the other components. It provides a complete calendar solution with month view, date selection, event display, and drag-and-drop functionality.

```tsx
import { ModernCalendar } from "@/components/ModernCalendar";

<ModernCalendar
  events={events}
  onDateSelect={handleDateSelect}
  onEventDrop={handleEventDrop}
  onEventAdd={handleEventAdd}
/>
```

### CalendarGrid

A grid-based calendar view that displays days in a month. It supports event indicators and drag-and-drop functionality.

```tsx
import { CalendarGrid } from "@/components/ModernCalendar/CalendarGrid";

<CalendarGrid
  month={new Date()}
  selectedDate={selectedDate}
  events={events}
  onDateSelect={handleDateSelect}
  onEventDrop={handleEventDrop}
/>
```

### CalendarDatePicker

A simple date picker component that allows users to select a date.

```tsx
import { CalendarDatePicker } from "@/components/ModernCalendar/CalendarDatePicker";

<CalendarDatePicker
  value={selectedDate}
  onChange={handleDateSelect}
/>
```

### CalendarToolbar

A toolbar component that provides view mode switching and other calendar actions.

```tsx
import { CalendarToolbar } from "@/components/ModernCalendar/CalendarToolbar";

<CalendarToolbar
  view="month"
  onViewChange={handleViewChange}
  onAddEvent={handleAddEvent}
/>
```

## Integration with Existing Components

The ModernCalendar components are designed to work with the existing event data structure and hooks. They integrate with:

- `useCalendarEvents` hook for fetching and managing events
- `useUpdateEventDate` hook for updating event dates
- `DroppableCalendarDay` component for drag-and-drop functionality

## Important Notes on Drag and Drop

The application already has a `DndProvider` with `HTML5Backend` at the `AppLayoutWithCalendar` level. The ModernCalendar components are designed to work with this existing provider and do not include their own DndProvider.

**Warning:** Do not add additional `DndProvider` components in any child components as this will cause the "Cannot have two HTML5 backends at the same time" error.

## Styling

The components use Tailwind CSS for styling and are designed to work with the application's existing color scheme. They support dark/light mode through the existing theme system.

## React 19 Compatibility

These components are built with React 19 compatibility in mind. They avoid using deprecated APIs and patterns that cause issues with React 19's concurrent rendering.
