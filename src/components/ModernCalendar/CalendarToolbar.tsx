"use client"

import * as React from "react"
import { useState } from "react"
import { Calendar, LayoutGrid, List, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export type CalendarViewType = "month"

export interface CalendarToolbarProps {
  view: CalendarViewType
  onViewChange?: (view: CalendarViewType) => void
  onAddEvent?: () => void
  className?: string
}

export function CalendarToolbar({
  view,
  onViewChange,
  onAddEvent,
  className,
}: CalendarToolbarProps) {
  // View change handler is kept for future use if needed
  const handleViewChange = (newView: CalendarViewType) => {
    onViewChange?.(newView)
  }

  return (
    <div className={cn("flex items-center justify-evenly", className)}>
      {/* View selector buttons removed as requested */}
      
      {/* Event button removed as requested */}
    </div>
  )
}
