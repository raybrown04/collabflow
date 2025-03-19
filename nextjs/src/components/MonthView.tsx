"use client"

/**
 * MonthView.tsx
 * Created: 2/26/2025
 * 
 * This component is a wrapper around the CalendarWidget component to provide a consistent
 * interface with the other calendar view components (WeekView, DayView).
 */

import { CalendarWidget } from "./calendar-widget"
import { Database } from "@/lib/database.types"

import { CalendarEvent } from "@/hooks/useCalendarEvents"

interface MonthViewProps {
    selectedDate: Date
    onDateSelect: (date: Date) => void
    events: CalendarEvent[]
    onEventDrop?: (event: CalendarEvent, newDate: Date) => void
}

export function MonthView({ selectedDate, onDateSelect, events, onEventDrop }: MonthViewProps) {
    return (
        <div className="w-full">
            <CalendarWidget
                selectedDate={selectedDate}
                onDateSelect={onDateSelect}
                events={events}
                onEventDrop={onEventDrop}
            />
        </div>
    )
}
