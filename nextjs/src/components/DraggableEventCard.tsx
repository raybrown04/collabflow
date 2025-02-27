"use client"

/**
 * DraggableEventCard.tsx
 * Updated: 2/26/2025
 * 
 * This component has been enhanced with React DnD for improved drag-and-drop functionality.
 * It now provides better visual feedback during dragging and supports undo functionality.
 */

import { format, parseISO, isSameDay } from "date-fns"
import { Database } from "@/lib/database.types"
import { useState, useRef } from "react"
import { useDrag } from "react-dnd"

// Define the drag item type
export const ITEM_TYPE = "EVENT_CARD"

// Extend the base CalendarEvent type to include our new fields
type CalendarEvent = Database['public']['Tables']['calendar_events']['Row'] & {
    end_date?: string;
    is_all_day?: boolean;
    location?: string;
    invitees?: string[];
    multiDayContinuation?: boolean; // Flag for events that span multiple days
}

interface DraggableEventCardProps {
    event: CalendarEvent
    onClick: (event: CalendarEvent) => void
    isOwnedByCurrentUser: boolean
    onDragStart?: (event: CalendarEvent) => void
    onDragEnd?: () => void
}

const typeColors = {
    meeting: {
        bg: 'bg-blue-500',
        text: 'text-blue-500',
        dot: 'bg-blue-500'
    },
    task: {
        bg: 'bg-green-500',
        text: 'text-green-500',
        dot: 'bg-green-500'
    },
    reminder: {
        bg: 'bg-amber-500',
        text: 'text-amber-500',
        dot: 'bg-amber-500'
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

    return (
        <div
            ref={dragRef}
            className={`relative rounded-lg border p-4 shadow-sm transition-all hover:shadow-md cursor-pointer ${isDragging ? 'opacity-50' : 'opacity-100'}`}
            onClick={(e) => {
                // Prevent click when dragging ends
                if (!isDragging) {
                    onClick(event)
                }
            }}
        >
            <div className="flex items-center gap-3">
                <div className={`h-4 w-4 rounded-full ${colors.dot}`} />
                <div className="flex-1">
                    <div className="flex items-start justify-between">
                        <div className="flex-1 mr-2">
                            <h4 className="font-medium truncate">{event.title}</h4>
                            <div className="flex flex-wrap items-center gap-1 mt-1">
                                {!isOwnedByCurrentUser && (
                                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                                        Other User
                                    </span>
                                )}
                            </div>
                        </div>
                        <time className="text-sm text-muted-foreground whitespace-nowrap">
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
                        <p className="mt-1 text-sm text-muted-foreground">
                            {event.description}
                        </p>
                    )}
                    {event.location && (
                        <p className="mt-1 text-xs text-muted-foreground flex items-center">
                            <span className="mr-1">📍</span> {event.location}
                        </p>
                    )}
                    {event.end_date && !isSameDay(parseISO(event.date), parseISO(event.end_date)) && (
                        <p className="mt-1 text-xs text-muted-foreground">
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

            {isOwnedByCurrentUser && isDragging && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
                    <p className="text-sm font-medium">Dragging event...</p>
                </div>
            )}
        </div>
    )
}
