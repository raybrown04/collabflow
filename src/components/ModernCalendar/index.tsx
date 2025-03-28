"use client"

/**
 * ModernCalendar Component
 * 
 * Main calendar component that integrates all the other calendar components.
 * Note: This component does NOT include a DndProvider as it's already provided
 * at the AppLayoutWithCalendar level.
 */

import * as React from "react"
import { useState, useEffect } from "react"
import { format, isSameDay } from "date-fns"
import { cn } from "@/lib/utils"
import { CalendarGrid } from "./CalendarGrid"
import { CalendarDatePicker } from "./CalendarDatePicker"
import { CalendarToolbar, CalendarViewType } from "./CalendarToolbar"
import { CalendarEvent } from "@/hooks/useCalendarEvents"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { EventForm } from "@/components/EventForm"

export interface ModernCalendarProps {
  events?: CalendarEvent[]
  onDateSelect?: (date: Date) => void
  onEventDrop?: (event: CalendarEvent, newDate: Date) => void
  onEventAdd?: (event: any) => void
  className?: string
}

export function ModernCalendar({
  events = [],
  onDateSelect,
  onEventDrop,
  onEventAdd,
  className,
}: ModernCalendarProps) {
  // Initialize with today's date
  const today = new Date()
  const [selectedDate, setSelectedDate] = useState<Date>(today)
  const [currentView, setCurrentView] = useState<CalendarViewType>("month")
  const [showEventForm, setShowEventForm] = useState(false)

  // Set today as the default selected date on component mount (only once)
  useEffect(() => {
    // Notify parent component of the selected date
    if (onDateSelect) {
      onDateSelect(selectedDate)
    }
    // Only run this effect once on mount
  }, []) // Empty dependency array to run only once

  // Handle date selection
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    onDateSelect?.(date)
  }

  // Handle view change
  const handleViewChange = (view: CalendarViewType) => {
    setCurrentView(view)
  }

  // Handle add event
  const handleAddEvent = () => {
    setShowEventForm(true)
  }

  // Handle event form submission
  const handleEventSubmit = (eventData: any) => {
    setShowEventForm(false)
    onEventAdd?.(eventData)
  }

  // Render the month view
  const renderView = () => {
    return (
      <CalendarGrid
        month={selectedDate}
        selectedDate={selectedDate}
        events={events}
        onDateSelect={(date) => {
          handleDateSelect(date);
          // If the plus button is clicked, it will pass the same date
          // This opens the event form when the plus button is clicked
          if (isSameDay(date, selectedDate)) {
            handleAddEvent();
          }
        }}
        onEventDrop={onEventDrop}
      />
    )
  }

  return (
    <div className={cn("flex flex-col pb-2", className)}>
      {/* Calendar header is simplified - no date picker */}

      <CalendarToolbar
        view={currentView}
        onViewChange={handleViewChange}
        onAddEvent={handleAddEvent}
      />

      <div className="flex-1 overflow-auto mt-2">
        {renderView()}
      </div>

      {/* Event Form Dialog */}
      <Dialog 
        open={showEventForm} 
        onOpenChange={(open) => {
          if (!open) setShowEventForm(false);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Event</DialogTitle>
          </DialogHeader>
          <EventForm
            selectedDate={selectedDate}
            onEventAdded={handleEventSubmit}
            onCancel={() => setShowEventForm(false)}
            alwaysShowForm={true}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
