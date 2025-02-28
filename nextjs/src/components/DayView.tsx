"use client"

/**
 * DayView.tsx
 * Created: 2/26/2025
 * 
 * This component displays a single day view of the calendar with time slots and events.
 * It shows a detailed view of a single day with hourly time slots.
 */

import { useState, useEffect } from "react"
import { format, parseISO, isSameHour, isSameDay } from "date-fns"
import { Database } from "@/lib/database.types"
import { cn } from "@/lib/utils"
import { DroppableCalendarDay } from "./DroppableCalendarDay"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

import { CalendarEvent } from "@/hooks/useCalendarEvents"

interface DayViewProps {
    selectedDate: Date
    onDateSelect: (date: Date) => void
    events: CalendarEvent[]
    onEventDrop?: (event: CalendarEvent, newDate: Date) => void
}

const HOURS = Array.from({ length: 24 }, (_, i) => i)

const typeColors = {
    meeting: 'bg-blue-500 border-blue-600',
    task: 'bg-green-500 border-green-600',
    reminder: 'bg-amber-500 border-amber-600'
}

export function DayView({ selectedDate, onDateSelect, events, onEventDrop }: DayViewProps) {
    const [currentTime, setCurrentTime] = useState<Date>(new Date())

    // Update current time every minute
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date())
        }, 60000)

        return () => clearInterval(interval)
    }, [])

    // Handle event drop on a time slot
    const handleEventDrop = (event: CalendarEvent, dropDate: Date) => {
        if (onEventDrop) {
            onEventDrop(event, dropDate)
        }
    }

    // Get events for a specific hour
    const getEventsForHour = (hour: number) => {
        return events.filter(event => {
            const eventDate = parseISO(event.date)
            return isSameDay(eventDate, selectedDate) && eventDate.getHours() === hour
        })
    }

    // Navigate to previous day
    const goToPreviousDay = () => {
        const previousDay = new Date(selectedDate)
        previousDay.setDate(previousDay.getDate() - 1)
        onDateSelect(previousDay)
    }

    // Navigate to next day
    const goToNextDay = () => {
        const nextDay = new Date(selectedDate)
        nextDay.setDate(nextDay.getDate() + 1)
        onDateSelect(nextDay)
    }

    // Check if the selected date is today
    const isToday = isSameDay(selectedDate, new Date())

    return (
        <div className="h-full overflow-auto border rounded-lg bg-background w-full px-2">
            {/* Day header */}
            <div className="sticky top-0 z-10 bg-background border-b p-3 flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={goToPreviousDay}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="text-center">
                    <h2 className="text-xl font-bold">
                        {format(selectedDate, "EEEE, MMMM d, yyyy")}
                    </h2>
                    {isToday && (
                        <div className="text-sm text-primary">Today</div>
                    )}
                </div>

                <Button variant="ghost" size="sm" onClick={goToNextDay}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>

            {/* Time slots */}
            <div className="relative">
                {HOURS.map(hour => {
                    const timeSlotDate = new Date(selectedDate)
                    timeSlotDate.setHours(hour, 0, 0, 0)

                    const eventsInHour = getEventsForHour(hour)
                    const isCurrentHour = isToday && isSameHour(currentTime, timeSlotDate)

                    return (
                        <div key={hour} className="flex border-b">
                            {/* Time label */}
                            <div className="w-16 py-2 px-2 text-xs text-muted-foreground border-r flex items-start justify-center sticky left-0 bg-background">
                                {format(timeSlotDate, "h a")}
                            </div>

                            {/* Time slot content */}
                            <DroppableCalendarDay
                                day={timeSlotDate}
                                isSelected={false}
                                onEventDrop={handleEventDrop}
                                className={cn(
                                    "flex-1 min-h-[6rem] p-2",
                                    isCurrentHour && "bg-accent/10"
                                )}
                            >
                                <div className="w-full">
                                    {eventsInHour.map(event => (
                                        <div
                                            key={event.id}
                                            className={cn(
                                                "rounded px-2 py-1 mb-2 text-sm border",
                                                typeColors[event.type],
                                                "text-white"
                                            )}
                                        >
                                            <div className="font-medium">{event.title}</div>
                                            <div className="text-xs opacity-90">
                                                {format(parseISO(event.date), "h:mm a")}
                                                {event.description && ` • ${event.description}`}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </DroppableCalendarDay>
                        </div>
                    )
                })}

                {/* Current time indicator */}
                {isToday && (
                    <div
                        className="absolute left-0 right-0 border-t-2 border-red-500 z-20 pointer-events-none"
                        style={{
                            top: `${(currentTime.getHours() * 6) + (currentTime.getMinutes() / 10)}rem`
                        }}
                    >
                        <div className="w-2 h-2 rounded-full bg-red-500 absolute -left-1 -top-1"></div>
                    </div>
                )}
            </div>
        </div>
    )
}
