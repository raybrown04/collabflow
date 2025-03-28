"use client"

import { format, isSameDay, parseISO } from "date-fns"
import { useState } from "react"
import { CalendarGrid } from "./ModernCalendar/CalendarGrid"
import { useUpdateEventDate } from "@/hooks/useUpdateEventDate"
import { useToast } from "@/components/ui/use-toast"
import { CalendarEvent } from "@/hooks/useCalendarEvents"

interface CalendarWidgetProps {
    selectedDate: Date
    onDateSelect: (date: Date) => void
    events: CalendarEvent[]
    onEventDrop?: (event: CalendarEvent, newDate: Date) => void
}

export function CalendarWidget({ selectedDate, onDateSelect, events, onEventDrop }: CalendarWidgetProps) {
    const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null)
    const updateEventDateMutation = useUpdateEventDate()
    const { toast } = useToast()

    // Handle event drop on a date
    const handleEventDrop = (event: CalendarEvent, newDate: Date) => {
        if (onEventDrop) {
            // Use the provided event drop handler
            onEventDrop(event, newDate)
        } else {
            // Use the default event drop handler
            updateEventDateMutation.mutate({
                event,
                newDate
            })
        }
    }

    return (
        <div className="rounded-lg border mx-auto mb-0 bg-background shadow-sm w-full overflow-visible">
            <CalendarGrid
                month={selectedDate}
                selectedDate={selectedDate}
                events={events}
                onDateSelect={onDateSelect}
                onEventDrop={handleEventDrop}
                className="w-full p-0 overflow-visible"
            />
        </div>
    )
}
