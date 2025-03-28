"use client"

/**
 * Modern Calendar Component
 * React 19 Compatible
 * 
 * This is a replacement for the react-day-picker based calendar
 * that was causing compatibility issues with React 19.
 */

import * as React from "react"
import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isToday 
} from "date-fns"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export interface CalendarProps {
  mode?: "single" | "range" | "multiple"
  selected?: Date | Date[] | { from: Date; to: Date }
  onSelect?: (date: Date | undefined) => void
  month?: Date
  onMonthChange?: (month: Date) => void
  className?: string
  classNames?: Record<string, string>
  showOutsideDays?: boolean
  disabled?: boolean | ((date: Date) => boolean)
}

function Calendar({
  mode = "single",
  selected,
  onSelect,
  month: propMonth,
  onMonthChange,
  className,
  classNames,
  showOutsideDays = true,
  disabled,
  ...props
}: CalendarProps) {
  const [month, setMonth] = useState<Date>(propMonth || new Date())
  
  // Update month when prop changes
  useEffect(() => {
    if (propMonth) {
      setMonth(propMonth)
    }
  }, [propMonth])

  // Navigate to previous month
  const previousMonth = () => {
    const newMonth = subMonths(month, 1)
    setMonth(newMonth)
    onMonthChange?.(newMonth)
  }

  // Navigate to next month
  const nextMonth = () => {
    const newMonth = addMonths(month, 1)
    setMonth(newMonth)
    onMonthChange?.(newMonth)
  }

  // Get days in current month
  const monthStart = startOfMonth(month)
  const monthEnd = endOfMonth(month)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Get day names for header
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  // Check if a date is selected
  const isDateSelected = (date: Date) => {
    if (!selected) return false
    
    if (mode === "single" && selected instanceof Date) {
      return isSameDay(date, selected)
    }
    
    if (mode === "range" && typeof selected === "object" && "from" in selected) {
      const { from, to } = selected
      if (!to) return isSameDay(date, from)
      return (date >= from && date <= to)
    }
    
    if (mode === "multiple" && Array.isArray(selected)) {
      return selected.some(selectedDate => isSameDay(date, selectedDate))
    }
    
    return false
  }

  // Check if a date is disabled
  const isDateDisabled = (date: Date) => {
    if (typeof disabled === "boolean") return disabled
    if (typeof disabled === "function") return disabled(date)
    return false
  }

  // Handle date selection
  const handleDateSelect = (date: Date) => {
    if (isDateDisabled(date)) return
    onSelect?.(date)
  }

  return (
    <div className={cn("p-3", className)}>
      <div className="flex justify-center pt-1 relative items-center">
        <div className="text-sm font-medium">
          {format(month, "MMMM yyyy")}
        </div>
        <div className="space-x-1 flex items-center absolute right-1">
          <Button
            variant="outline"
            size="icon"
            onClick={previousMonth}
            className="h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous month</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={nextMonth}
            className="h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next month</span>
          </Button>
        </div>
      </div>
      
      <div className="mt-4 grid grid-cols-7 gap-1">
        {/* Day names header */}
        {dayNames.map((day) => (
          <div 
            key={day} 
            className="text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] text-center"
          >
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {daysInMonth.map((day) => {
          const isSelected = isDateSelected(day)
          const isDayToday = isToday(day)
          const isDisabled = isDateDisabled(day)
          
          return (
            <div
              key={day.toString()}
              className="h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20"
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDateSelect(day)}
                disabled={isDisabled}
                className={cn(
                  "h-9 w-9 p-0 font-normal",
                  isSelected && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                  isDayToday && !isSelected && "bg-accent text-accent-foreground",
                  !isSameMonth(day, month) && "text-muted-foreground opacity-50",
                  isDisabled && "text-muted-foreground opacity-50 cursor-not-allowed"
                )}
              >
                {format(day, "d")}
              </Button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

Calendar.displayName = "Calendar"

export { Calendar }
