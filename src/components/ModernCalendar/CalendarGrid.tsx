"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO } from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { CalendarEvent } from "@/hooks/useCalendarEvents"
import { DroppableCalendarDay } from "../DroppableCalendarDay"

export interface CalendarGridProps {
  month?: Date
  selectedDate?: Date
  events?: CalendarEvent[]
  onDateSelect?: (date: Date) => void
  onEventDrop?: (event: CalendarEvent, newDate: Date) => void
  className?: string
}

export function CalendarGrid({
  month = new Date(),
  selectedDate = new Date(),
  events = [],
  onDateSelect,
  onEventDrop,
  className,
}: CalendarGridProps) {
  const [currentMonth, setCurrentMonth] = useState(month)
  
  // Update current month when month prop changes
  useEffect(() => {
    setCurrentMonth(month)
  }, [month])

  // Navigate to previous month
  const previousMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1))
  }

  // Navigate to next month
  const nextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1))
  }

  // Get days in current month
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Get day names for header
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  // Get events for a specific day
  const getEventsForDay = (day: Date) => {
    return events.filter(event => {
      const eventDate = parseISO(event.date)
      return isSameDay(eventDate, day)
    })
  }

  // Render day cell
  const renderDay = (day: Date) => {
    const dayEvents = getEventsForDay(day)
    const isSelected = isSameDay(day, selectedDate)
    const isCurrentMonth = isSameMonth(day, currentMonth)
    
    // Get unique event types for indicators
    const uniqueTypes = [...new Set(dayEvents.map(event => event.type))]
    
    // Type colors mapping
    const typeColors = {
      meeting: 'bg-secondary',
      task: 'bg-success',
      reminder: 'bg-destructive'
    }

    return (
      <DroppableCalendarDay
        key={day.toString()}
        day={day}
        isSelected={isSelected}
        onEventDrop={(event, date) => onEventDrop?.(event, date)}
        className={cn(
          "h-10 w-full rounded-md",
          !isCurrentMonth && "text-muted-foreground opacity-50"
        )}
      >
        <div className="text-center">{format(day, "d")}</div>
        {dayEvents.length > 0 && (
          <div className="absolute bottom-1 flex gap-.5">
            {/* Event type indicators */}
            {uniqueTypes.map((type, i) => (
              <div
                key={type}
                className={`h-1.5 w-1.5 rounded-full ${typeColors[type]}`}
                style={{
                  transform: `translateX(${i * 6 - (uniqueTypes.length - 1) * 3}px)`
                }}
              />
            ))}
          </div>
        )}
      </DroppableCalendarDay>
    )
  }

  return (
    <div className={cn("w-full px-2", className)}>
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center">
          <h2 className="text-base font-medium mr-2">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={previousMonth}
              className="h-6 w-6 p-0"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span className="sr-only">Previous month</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={nextMonth}
              className="h-6 w-6 p-0"
            >
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="sr-only">Next month</span>
            </Button>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {/* Today button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const today = new Date();
              setCurrentMonth(today);
              onDateSelect?.(today);
            }}
            className="h-7 text-xs px-2"
          >
            Today
          </Button>
          
          {/* Add event button */}
          {onEventDrop && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDateSelect?.(selectedDate)}
              className="h-7 w-7 p-0"
              title="Add event"
            >
              <Plus className="h-4 w-4" />
              <span className="sr-only">Add event</span>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 mb-2">
        {dayNames.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-muted-foreground">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {daysInMonth.map((day) => (
          <div
            key={day.toString()}
            className="p-0"
            onClick={() => onDateSelect?.(day)}
          >
            {renderDay(day)}
          </div>
        ))}
      </div>
    </div>
  )
}
