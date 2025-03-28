"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { format, isToday, isSameDay } from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export interface CalendarDatePickerProps {
  value?: Date
  onChange?: (date: Date) => void
  className?: string
  disabled?: boolean
}

export function CalendarDatePicker({
  value = new Date(),
  onChange,
  className,
  disabled = false,
}: CalendarDatePickerProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(value)

  // Update selected date when value prop changes
  useEffect(() => {
    setSelectedDate(value)
  }, [value])

  // Handle date selection
  const handleSelect = (date: Date) => {
    if (disabled) return
    
    setSelectedDate(date)
    onChange?.(date)
  }

  return (
    <div className={cn("flex flex-col space-y-2", className)}>
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleSelect(new Date())}
          disabled={disabled || isToday(selectedDate)}
        >
          Today
        </Button>
        <div className="text-sm font-medium">
          {format(selectedDate, "MMMM d, yyyy")}
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {/* Quick date selection for next 7 days */}
        {Array.from({ length: 7 }).map((_, i) => {
          const date = new Date()
          date.setDate(date.getDate() + i)
          const isSelected = isSameDay(date, selectedDate)
          
          return (
            <Button
              key={i}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              className={cn(
                "h-8 w-8 p-0 font-normal",
                isToday(date) && !isSelected && "border-primary text-primary",
                disabled && "opacity-50 cursor-not-allowed"
              )}
              onClick={() => handleSelect(date)}
              disabled={disabled}
            >
              <span className="sr-only">{format(date, "EEEE")}</span>
              <span>{format(date, "d")}</span>
            </Button>
          )
        })}
      </div>
    </div>
  )
}
