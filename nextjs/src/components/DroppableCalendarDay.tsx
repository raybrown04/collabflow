"use client"

/**
 * DroppableCalendarDay.tsx
 * Updated: 2/26/2025
 * 
 * This component has been enhanced with React DnD for improved drag-and-drop functionality.
 * It now provides better visual feedback during dragging and supports undo functionality.
 */

import { useState } from "react"
import { format } from "date-fns"
import { Database } from "@/lib/database.types"
import { useDrop } from "react-dnd"
import { ITEM_TYPE } from "./DraggableEventCard"

type CalendarEvent = Database['public']['Tables']['calendar_events']['Row']

interface DroppableCalendarDayProps {
    day: Date
    isSelected: boolean
    children: React.ReactNode
    onEventDrop: (event: CalendarEvent, date: Date) => void
    className?: string
}

export function DroppableCalendarDay({
    day,
    isSelected,
    children,
    onEventDrop,
    className
}: DroppableCalendarDayProps) {
    // Define the drag item type
    interface DragItem {
        id: string;
        originalDate: string;
        type: string;
        title: string;
        event: CalendarEvent;
    }

    // Define the drop result type
    interface DropResult {
        moved: boolean;
    }

    // Set up drop target with React DnD
    const [{ isOver, canDrop }, dropRef] = useDrop<DragItem, DropResult, { isOver: boolean, canDrop: boolean }>({
        accept: ITEM_TYPE,
        drop: (item) => {
            // Call the parent handler with the event and the day
            onEventDrop(item.event, day)
            return { moved: true }
        },
        collect: (monitor: any) => ({
            isOver: monitor.isOver(),
            canDrop: monitor.canDrop()
        })
    })

    // Visual feedback for drop target
    const isActive = isOver && canDrop

    return (
        <div
            ref={dropRef}
            className={`
                relative flex h-full w-full flex-col items-center justify-center
                ${isSelected ? "rounded-full bg-primary text-primary-foreground" : ""}
                ${isActive ? "bg-accent/50" : ""}
                ${canDrop && !isActive ? "bg-accent/20" : ""}
                transition-colors duration-200
                ${className || ""}
            `}
            data-date={format(day, "yyyy-MM-dd")}
        >
            {children}

            {isActive && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-accent/30">
                    <span className="text-xs font-medium">Drop to reschedule</span>
                </div>
            )}
        </div>
    )
}
