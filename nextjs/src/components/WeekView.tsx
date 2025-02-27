"use client"

/**
 * WeekView.tsx
 * Created: 2/26/2025
 * 
 * This component displays a week view of the calendar with time slots and events.
 * It shows a grid with days of the week as columns and hours as rows.
 */

import { useState, useEffect } from "react"
import { format, addDays, startOfWeek, isSameDay, parseISO, isWithinInterval, addHours, isBefore, isAfter } from "date-fns"
import { Database } from "@/lib/database.types"
import { cn } from "@/lib/utils"
import { DroppableCalendarDay } from "./DroppableCalendarDay"

type CalendarEvent = Database['public']['Tables']['calendar_events']['Row']

interface WeekViewProps {
    selectedDate: Date
    onDateSelect: (date: Date) => void
    events: CalendarEvent[]
    onEventDrop?: (event: CalendarEvent, newDate: Date) => void
}

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const DAYS_OF_WEEK = Array.from({ length: 7 }, (_, i) => i)

const typeColors = {
    meeting: 'bg-blue-500 border-blue-600',
    task: 'bg-green-500 border-green-600',
    reminder: 'bg-amber-500 border-amber-600'
}

export function WeekView({ selectedDate, onDateSelect, events, onEventDrop }: WeekViewProps) {
    const [weekStart, setWeekStart] = useState<Date>(startOfWeek(selectedDate))
    const [currentTime, setCurrentTime] = useState<Date>(new Date())

    // Update current time every minute
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date())
        }, 60000)

        return () => clearInterval(interval)
    }, [])

    // Update week start when selected date changes
    useEffect(() => {
        setWeekStart(startOfWeek(selectedDate))
    }, [selectedDate])

    // Handle event drop on a day
    const handleEventDrop = (event: CalendarEvent, dropDate: Date) => {
        if (onEventDrop) {
            onEventDrop(event, dropDate)
        }
    }

    // Get events for a specific day and hour
    const getEventsForTimeSlot = (day: Date, hour: number) => {
        return events.filter(event => {
            const eventDate = parseISO(event.date)
            const eventHour = eventDate.getHours()
            return isSameDay(eventDate, day) && eventHour === hour
        })
    }

    // Render time labels
    const renderTimeLabels = () => {
        return (
            <div className="sticky left-0 z-10 w-16 bg-background">
                <div className="h-12"></div> {/* Empty cell for header row */}
                {HOURS.map(hour => (
                    <div key={hour} className="h-16 border-r border-b flex items-center justify-center text-xs text-muted-foreground">
                        {format(new Date().setHours(hour, 0, 0, 0), 'h a')}
                    </div>
                ))}
            </div>
        )
    }

    // Render day headers
    const renderDayHeaders = () => {
        return (
            <div className="flex h-12 border-b sticky top-0 z-10 bg-background">
                <div className="w-16 border-r"></div> {/* Empty cell for time column */}
                {DAYS_OF_WEEK.map(dayOffset => {
                    const day = addDays(weekStart, dayOffset)
                    const isToday = isSameDay(day, new Date())
                    const isSelected = isSameDay(day, selectedDate)

                    return (
                        <div
                            key={dayOffset}
                            className={cn(
                                "flex-1 flex flex-col items-center justify-center border-r cursor-pointer hover:bg-accent",
                                isToday && "bg-accent/50",
                                isSelected && "bg-primary/10"
                            )}
                            onClick={() => onDateSelect(day)}
                        >
                            <div className="text-sm font-medium">{format(day, 'EEE')}</div>
                            <div className={cn(
                                "flex items-center justify-center w-8 h-8 rounded-full text-sm",
                                isToday && "bg-primary text-primary-foreground"
                            )}>
                                {format(day, 'd')}
                            </div>
                        </div>
                    )
                })}
            </div>
        )
    }

    // Render time grid
    const renderTimeGrid = () => {
        return (
            <div className="flex flex-1">
                {renderTimeLabels()}
                <div className="flex flex-1">
                    {DAYS_OF_WEEK.map(dayOffset => {
                        const day = addDays(weekStart, dayOffset)
                        const isToday = isSameDay(day, new Date())

                        return (
                            <div key={dayOffset} className="flex-1 relative">
                                {HOURS.map(hour => {
                                    const timeSlotDate = new Date(day)
                                    timeSlotDate.setHours(hour, 0, 0, 0)

                                    const eventsInSlot = getEventsForTimeSlot(day, hour)

                                    return (
                                        <DroppableCalendarDay
                                            key={hour}
                                            day={timeSlotDate}
                                            isSelected={false}
                                            onEventDrop={handleEventDrop}
                                            className={cn(
                                                "h-16 border-r border-b hover:bg-accent/30",
                                                isToday && "bg-accent/10"
                                            )}
                                        >
                                            <div className="h-full w-full p-1">
                                                {eventsInSlot.map(event => (
                                                    <div
                                                        key={event.id}
                                                        className={cn(
                                                            "text-xs rounded px-1 py-0.5 mb-1 truncate border",
                                                            typeColors[event.type],
                                                            "text-white"
                                                        )}
                                                        title={event.title}
                                                    >
                                                        {format(parseISO(event.date), 'h:mm a')} {event.title}
                                                    </div>
                                                ))}
                                            </div>
                                        </DroppableCalendarDay>
                                    )
                                })}

                                {/* Current time indicator */}
                                {isToday && (
                                    <div
                                        className="absolute left-0 right-0 border-t-2 border-red-500 z-20"
                                        style={{
                                            top: `${(currentTime.getHours() * 60 + currentTime.getMinutes()) / 60 * 4}rem`
                                        }}
                                    >
                                        <div className="w-2 h-2 rounded-full bg-red-500 absolute -left-1 -top-1"></div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }

    return (
        <div className="h-[600px] overflow-auto border rounded-lg bg-background">
            {renderDayHeaders()}
            {renderTimeGrid()}
        </div>
    )
}
