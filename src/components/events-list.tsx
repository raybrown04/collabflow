"use client"

/**
 * events-list.tsx
 * Updated: 3/13/2025
 * 
 * This component has been simplified to:
 * - Show events only for the selected date
 * - Remove the synchronized scrolling functionality
 * - Maintain event interaction capabilities (click, edit, delete)
 * - Preserve drag-and-drop functionality
 * - Use EventForm directly for editing events
 */

import { format, isSameDay, parseISO, compareAsc } from "date-fns"
import { Database } from "@/lib/database.types"
import { useEffect, useRef, useState, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useDeleteEvent } from "@/hooks/useCalendarEvents"
import { useUpdateEventDate } from "@/hooks/useUpdateEventDate"
import { getCurrentUserId, useAuth } from "@/lib/auth"
import { DraggableEventCard } from "./DraggableEventCard"
import { EventForm, EventData } from "./EventForm"

// Use the CalendarEvent type from useCalendarEvents hook
import { CalendarEvent } from "@/hooks/useCalendarEvents";

interface EventsListProps {
    date: Date
    events: CalendarEvent[]
    onVisibleDateChange?: (date: Date, fromUserScroll?: boolean) => void
    scrollToDateRef?: React.RefObject<((date: Date) => void) | null>
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

export function EventsList({ date, events, onVisibleDateChange, scrollToDateRef }: EventsListProps) {
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null)
    const deleteEventMutation = useDeleteEvent()
    const updateEventDateMutation = useUpdateEventDate()
    const { user } = useAuth()
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)

    // Get current user ID on component mount
    useEffect(() => {
        const fetchUserId = async () => {
            try {
                const userId = await getCurrentUserId()
                setCurrentUserId(userId)
            } catch (error) {
                console.error("Error fetching current user ID:", error)
            }
        }

        fetchUserId()
    }, [])

    // Handle event drag start
    const handleEventDragStart = (event: CalendarEvent) => {
        setDraggedEvent(event)
    }

    // Handle event drag end
    const handleEventDragEnd = () => {
        setDraggedEvent(null)
    }

    // Filter events for the selected date
    const eventsForSelectedDate = events.filter(event => {
        const eventDate = parseISO(event.date)
        return isSameDay(eventDate, date)
    })

    // Sort events by time
    const sortedEvents = [...eventsForSelectedDate].sort((a, b) =>
        parseISO(a.date).getTime() - parseISO(b.date).getTime()
    )

    // Support for scrollToDateRef for compatibility with API
    useEffect(() => {
        if (scrollToDateRef && 'current' in scrollToDateRef) {
            scrollToDateRef.current = (targetDate: Date) => {
                // This is now simplified since we only show events for the selected date
                if (onVisibleDateChange) {
                    onVisibleDateChange(targetDate)
                }
            }
        }
    }, [scrollToDateRef, onVisibleDateChange])

    // Handle event click - open the edit dialog
    const handleEventClick = (event: CalendarEvent) => {
        setSelectedEvent(event)
        setIsEditDialogOpen(true)
    }

    // Handle event deletion
    const handleDeleteEvent = (id: string) => {
        deleteEventMutation.mutate(id, {
            onSuccess: () => {
                console.log(`Event with ID: ${id} deleted successfully`)
                setIsEditDialogOpen(false)
            },
            onError: (error) => {
                console.error(`Error deleting event with ID: ${id}`, error)
                alert(`Failed to delete event: ${error instanceof Error ? error.message : 'Unknown error'}`)
            }
        })
    }

    // Handle event update
    const handleEventUpdated = (updatedEvent: EventData) => {
        console.log("Event updated successfully:", updatedEvent)
        setIsEditDialogOpen(false)
    }

    return (
        <div className="h-full flex flex-col w-full max-w-full">
            <div className="px-2 pb-4 flex flex-col h-full w-full max-w-full">
                <h3 className="text-lg font-bold mb-4">
                    {format(date, "MMM d, yyyy")}
                </h3>

                {sortedEvents.length === 0 ? (
                    <div className="text-center p-3 bg-muted/20 rounded-lg">
                        <p className="text-sm text-muted-foreground">No events scheduled for this day.</p>
                    </div>
                ) : (
                    <div className="space-y-3 w-full max-h-[calc(100vh-300px)] overflow-y-auto pr-0 scrollable-container">
                        {sortedEvents.map(event => (
                            <DraggableEventCard
                                key={event.id}
                                event={event}
                                onClick={handleEventClick}
                                isOwnedByCurrentUser={currentUserId === event.user_id}
                                onDragStart={() => handleEventDragStart(event)}
                                onDragEnd={handleEventDragEnd}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Edit Event Dialog - Using EventForm component */}
            {selectedEvent && (
                <Dialog 
                    open={isEditDialogOpen} 
                    onOpenChange={(open) => {
                        if (!open) setIsEditDialogOpen(false);
                    }}
                >
                    <DialogContent className="sm:max-w-md dialog-transition">
                        <DialogHeader>
                            <DialogTitle>Edit Event</DialogTitle>
                        </DialogHeader>
                        <EventForm
                            selectedDate={parseISO(selectedEvent.date)}
                            onEventAdded={handleEventUpdated}
                            onCancel={() => setIsEditDialogOpen(false)}
                            alwaysShowForm={true}
                            existingEvent={selectedEvent}
                            onDelete={handleDeleteEvent}
                        />
                    </DialogContent>
                </Dialog>
            )}

            {/* Loading indicators for mutations */}
            {deleteEventMutation.isPending && (
                <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
                    <div className="bg-background p-4 rounded-lg shadow-lg">
                        <div className="flex items-center gap-2">
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                            <span>Deleting event...</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
