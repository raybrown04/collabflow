"use client"

/**
 * CalendarViewSelector.tsx
 * Updated: 2/26/2025
 * 
 * This component has been simplified to only show the add event button.
 * The month/day view selector has been removed as requested.
 */

import { Button } from "@/components/ui/button"

export type CalendarViewType = "month" | "day"

interface CalendarViewSelectorProps {
    currentView: CalendarViewType
    onViewChange: (view: CalendarViewType) => void
    onAddEvent?: () => void
}

export function CalendarViewSelector({
    currentView,
    onViewChange,
    onAddEvent
}: CalendarViewSelectorProps) {
    // Only the add event button is shown now
    return (
        <div className="flex justify-end">
            {onAddEvent && (
                <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center justify-center"
                    onClick={onAddEvent}
                >
                    <span className="text-lg font-semibold">+</span>
                </Button>
            )}
        </div>
    )
}
