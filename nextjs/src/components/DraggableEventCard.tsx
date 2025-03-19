"use client"

/**
 * DraggableEventCard.tsx
 * Updated: 2/27/2025
 * 
 * This component has been enhanced with React DnD for improved drag-and-drop functionality.
 * It now provides better visual feedback during dragging and supports undo functionality.
 * Added direct event click handling to ensure proper scrolling to the event's date.
 */

import { format, parseISO, isSameDay } from "date-fns"
import { Database } from "@/lib/database.types"
import { useState, useRef } from "react"
import { useDrag } from "react-dnd"

// Define the drag item type
export const ITEM_TYPE = "EVENT_CARD"

// Use the CalendarEvent type from useCalendarEvents hook
import { CalendarEvent } from "@/hooks/useCalendarEvents";

interface DraggableEventCardProps {
    event: CalendarEvent
    onClick: (event: CalendarEvent) => void
    isOwnedByCurrentUser: boolean
    onDragStart?: (event: CalendarEvent) => void
    onDragEnd?: () => void
}

/**
 * Updated typeColors to align with RBIIILV Design System
 * Using the color schema defined in technical-guides.md
 */
const typeColors = {
    meeting: {
        bg: 'bg-secondary',
        text: 'text-secondary',
        dot: 'bg-secondary'
    },
    task: {
        bg: 'bg-success',
        text: 'text-success',
        dot: 'bg-success'
    },
    reminder: {
        bg: 'bg-destructive',
        text: 'text-destructive',
        dot: 'bg-destructive'
    }
}

export function DraggableEventCard({
    event,
    onClick,
    isOwnedByCurrentUser,
    onDragStart,
    onDragEnd
}: DraggableEventCardProps) {
    const originalPositionRef = useRef<{ x: number, y: number } | null>(null)
    const colors = typeColors[event.type]
    const eventDate = parseISO(event.date)

    // Define the drag item type
    interface DragItem {
        id: string;
        originalDate: string;
        type: string;
        title: string;
        event: CalendarEvent;
    }

    // Set up drag source with React DnD
    const [{ isDragging }, dragRef] = useDrag<DragItem, unknown, { isDragging: boolean }>({
        type: ITEM_TYPE,
        item: () => {
            // Call the parent handler
            if (onDragStart) {
                onDragStart(event)
            }

            // Return the event data
            return {
                id: event.id,
                originalDate: event.date,
                type: event.type,
                title: event.title,
                event: event
            }
        },
        collect: (monitor: any) => ({
            isDragging: monitor.isDragging()
        }),
        canDrag: () => isOwnedByCurrentUser,
        end: (item: DragItem, monitor: any) => {
            // Call the parent handler
            if (onDragEnd) {
                onDragEnd()
            }

            // If the drop was not successful, we could trigger an animation
            // back to the original position here
            if (!monitor.didDrop()) {
                console.log("Drop was not successful")
            }
        }
    })

    // Handle click event
    const handleClick = (e: React.MouseEvent) => {
        // Prevent click when dragging ends
        if (!isDragging) {
            // Call the parent onClick handler
            onClick(event)
        }
    }

    // Get user initials from the user ID
    const getUserInitials = () => {
        if (!event.user_id || isOwnedByCurrentUser) return null;

        // Use first two characters of the user ID
        return event.user_id.substring(0, 2).toUpperCase();
    }

    const userInitials = getUserInitials();

    return (
        <div
            ref={dragRef}
            className={`relative rounded-lg border p-2 shadow-sm transition-all hover:shadow-md cursor-pointer w-full ${isDragging ? 'opacity-50' : 'opacity-100'}`}
            onClick={handleClick}
        >
            <div className="flex items-center gap-2">
                {isOwnedByCurrentUser ? (
                    <div className={`flex-shrink-0 h-3 w-3 rounded-full ${colors.dot}`} />
                ) : (
                    <div className="h-4 w-4 rounded-full bg-blue-100 text-blue-800 flex-shrink-0 flex items-center justify-center text-[10px] font-medium">
                        {userInitials || '??'}
                    </div>
                )}
                <div className="flex-1 min-w-0 overflow-hidden">
                    <div className="flex flex-col">
                        <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">{event.title}</h4>
                            <time className="text-xs text-muted-foreground whitespace-nowrap block">
                                {!event.is_all_day ? (
                                    event.end_date ? (
                                        <>
                                            {format(eventDate, "h:mm a")}-{format(parseISO(event.end_date), "h:mm a")}
                                        </>
                                    ) : (
                                        format(eventDate, "h:mm a")
                                    )
                                ) : (
                                    "All day"
                                )}
                            </time>
                        </div>
                        {event.description && (
                            <p className="text-xs text-muted-foreground truncate">
                                {event.description}
                            </p>
                        )}
                        <div className="flex items-center justify-between">
                            {event.location && (
                                <p className="text-xs text-muted-foreground flex items-center truncate flex-1 min-w-0 mr-1">
                                    <span className="mr-0.5 flex-shrink-0 text-[10px]">📍</span> {event.location}
                                </p>
                            )}
                        </div>
                        {event.end_date && !isSameDay(parseISO(event.date), parseISO(event.end_date)) && (
                            <p className="text-xs text-muted-foreground">
                                {(() => {
                                    const startDate = parseISO(event.date);
                                    const endDate = parseISO(event.end_date);
                                    // Ensure start date is before end date for display
                                    if (startDate <= endDate) {
                                        return `${format(startDate, "MMM d")} - ${format(endDate, "MMM d")}`;
                                    } else {
                                        return `${format(endDate, "MMM d")} - ${format(startDate, "MMM d")}`;
                                    }
                                })()}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {isOwnedByCurrentUser && isDragging && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
                    <p className="text-sm font-medium">Dragging event...</p>
                </div>
            )}
        </div>
    );
}
