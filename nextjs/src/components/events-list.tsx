"use client"

import { format, isSameDay, parseISO, compareAsc, startOfDay } from "date-fns"
import { Database } from "@/lib/database.types"
import { useEffect, useRef, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useUpdateEvent, useDeleteEvent } from "@/hooks/useCalendarEvents"
import { getCurrentUserId, useAuth } from "@/lib/auth"

type CalendarEvent = Database['public']['Tables']['calendar_events']['Row']

interface EventsListProps {
    date: Date
    events: CalendarEvent[]
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

interface EventCardProps {
    event: CalendarEvent
    onClick: (event: CalendarEvent) => void
    isOwnedByCurrentUser: boolean
}

function EventCard({ event, onClick, isOwnedByCurrentUser }: EventCardProps) {
    const colors = typeColors[event.type]
    const eventDate = parseISO(event.date)

    return (
        <div
            className="relative rounded-lg border p-4 shadow-sm transition-all hover:shadow-md cursor-pointer"
            onClick={() => onClick(event)}
        >
            <div className="flex items-center gap-3">
                <div className={`h-4 w-4 rounded-full ${colors.dot}`} />
                <div className="flex-1">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                            <h4 className="font-medium">{event.title}</h4>
                            {!isOwnedByCurrentUser && (
                                <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                                    Other User
                                </span>
                            )}
                        </div>
                        <time className="text-sm text-muted-foreground">
                            {format(eventDate, "h:mm a")}
                        </time>
                    </div>
                    {event.description && (
                        <p className="mt-1 text-sm text-muted-foreground">
                            {event.description}
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}

function EventDialog({
    event,
    isOpen,
    onClose,
    onDelete,
    currentUserId
}: {
    event: CalendarEvent | null
    isOpen: boolean
    onClose: () => void
    onDelete: (id: string) => void
    currentUserId: string | null
}) {
    const isOwnedByCurrentUser = event && currentUserId === event.user_id
    const [isEditing, setIsEditing] = useState(false)
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [type, setType] = useState<"meeting" | "task" | "reminder">("meeting")
    const [time, setTime] = useState("12:00")
    const updateEventMutation = useUpdateEvent()

    // Initialize form when event changes
    useEffect(() => {
        if (event) {
            const eventDate = parseISO(event.date)
            setTitle(event.title)
            setDescription(event.description || "")
            setType(event.type)
            setTime(format(eventDate, "HH:mm"))
        }
    }, [event])

    if (!event) return null

    const eventDate = parseISO(event.date)
    const colors = typeColors[event.type]

    const handleSave = async () => {
        if (!event) return;

        try {
            // Create date with selected time
            const [hours, minutes] = time.split(":").map(Number)
            const updatedDate = new Date(eventDate)
            updatedDate.setHours(hours, minutes, 0, 0)

            // Get the current user ID
            const userId = await getCurrentUserId()

            // Prepare the update payload
            const updatedEvent = {
                id: event.id,
                title,
                description: description || null,
                type,
                date: updatedDate.toISOString(),
                user_id: userId
            }

            // Call the update mutation
            updateEventMutation.mutate(updatedEvent, {
                onSuccess: () => {
                    console.log("Event updated successfully:", updatedEvent)
                    setIsEditing(false)
                    onClose()
                },
                onError: (error) => {
                    console.error("Error updating event:", error)
                    alert(`Failed to update event: ${error instanceof Error ? error.message : 'Unknown error'}`)
                }
            })
        } catch (error) {
            console.error("Error in event update:", error)
            alert("An error occurred while updating the event. Please try again.")
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <div className={`h-3 w-3 rounded-full ${colors.dot}`} />
                        {isEditing ? "Edit Event" : event.title}
                    </DialogTitle>
                </DialogHeader>

                {isEditing ? (
                    <div className="space-y-4 py-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full rounded-md border px-3 py-2"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full rounded-md border px-3 py-2"
                                rows={3}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Type</label>
                                <select
                                    value={type}
                                    onChange={(e) => setType(e.target.value as "meeting" | "task" | "reminder")}
                                    className="w-full rounded-md border px-3 py-2"
                                >
                                    <option value="meeting">Meeting</option>
                                    <option value="task">Task</option>
                                    <option value="reminder">Reminder</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Time</label>
                                <input
                                    type="time"
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                    className="w-full rounded-md border px-3 py-2"
                                />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4 py-4">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                                {format(eventDate, "EEEE, MMMM d, yyyy")}
                            </div>
                            <div className="text-sm font-medium">
                                {format(eventDate, "h:mm a")}
                            </div>
                        </div>

                        {event.description && (
                            <div className="text-sm">
                                <div className="font-medium mb-1">Description</div>
                                <p className="text-muted-foreground">{event.description}</p>
                            </div>
                        )}

                        <div className="text-sm">
                            <div className="font-medium mb-1">Type</div>
                            <p className="text-muted-foreground capitalize">{event.type}</p>
                        </div>
                    </div>
                )}

                <DialogFooter className="flex justify-between">
                    {isEditing ? (
                        <>
                            <Button
                                variant="outline"
                                onClick={() => setIsEditing(false)}
                            >
                                Cancel
                            </Button>
                            <Button onClick={handleSave}>Save</Button>
                        </>
                    ) : (
                        <>
                            {isOwnedByCurrentUser ? (
                                <>
                                    <Button
                                        variant="destructive"
                                        onClick={() => {
                                            onDelete(event.id)
                                            onClose()
                                        }}
                                    >
                                        Delete
                                    </Button>
                                    <div className="space-x-2">
                                        <Button
                                            variant="outline"
                                            onClick={() => setIsEditing(true)}
                                        >
                                            Edit
                                        </Button>
                                        <Button onClick={onClose}>Close</Button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="text-sm text-muted-foreground">
                                        You cannot edit events created by other users
                                    </div>
                                    <Button onClick={onClose}>Close</Button>
                                </>
                            )}
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function DayEvents({
    date,
    events,
    onEventClick,
    currentUserId
}: {
    date: Date
    events: CalendarEvent[]
    onEventClick: (event: CalendarEvent) => void
    currentUserId: string | null
}) {
    const dayEvents = events
        .filter(event => isSameDay(parseISO(event.date), date))
        .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime())

    if (dayEvents.length === 0) return null

    return (
        <div className="space-y-4 mb-8">
            <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold">
                    {format(date, "d")} {format(date, "EEEE")}
                </h3>
                <span className="text-sm text-muted-foreground">{dayEvents.length} events</span>
            </div>
            <div className="space-y-3">
                {dayEvents.map(event => (
                    <EventCard
                        key={event.id}
                        event={event}
                        onClick={onEventClick}
                        isOwnedByCurrentUser={currentUserId === event.user_id}
                    />
                ))}
            </div>
        </div>
    )
}

export function EventsList({ date, events }: EventsListProps) {
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const deleteEventMutation = useDeleteEvent()
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

    // Group events by date
    const eventsByDate = events.reduce<Record<string, CalendarEvent[]>>((acc, event) => {
        const dateStr = startOfDay(parseISO(event.date)).toISOString()
        if (!acc[dateStr]) {
            acc[dateStr] = []
        }
        acc[dateStr].push(event)
        return acc
    }, {})

    // Get unique dates that have events, sorted chronologically
    const uniqueDates = Object.keys(eventsByDate)
        .map(dateStr => new Date(dateStr))
        .sort(compareAsc)

    // Handle event click
    const handleEventClick = (event: CalendarEvent) => {
        setSelectedEvent(event)
        setIsDialogOpen(true)
    }

    // Handle event deletion
    const handleDeleteEvent = (id: string) => {
        deleteEventMutation.mutate(id, {
            onSuccess: () => {
                console.log(`Event with ID: ${id} deleted successfully`)
                setIsDialogOpen(false)
            },
            onError: (error) => {
                console.error(`Error deleting event with ID: ${id}`, error)
                alert(`Failed to delete event: ${error instanceof Error ? error.message : 'Unknown error'}`)
            }
        })
    }

    // Scroll to the selected date when it changes
    useEffect(() => {
        if (scrollContainerRef.current) {
            // Find the element for the selected date
            const selectedDateStr = startOfDay(date).toISOString()
            const dateElements = scrollContainerRef.current.querySelectorAll('[data-date]')

            for (let i = 0; i < dateElements.length; i++) {
                const el = dateElements[i]
                if (el.getAttribute('data-date') === selectedDateStr) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    break
                }
            }
        }
    }, [date])

    return (
        <div className="h-full flex flex-col">
            <div
                ref={scrollContainerRef}
                className="space-y-4 overflow-y-auto flex-1 pr-2 h-full"
                style={{ scrollbarWidth: 'thin' }}
            >
                {uniqueDates.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-8 text-center">
                        <p className="text-muted-foreground">No events scheduled</p>
                    </div>
                ) : (
                    uniqueDates.map(eventDate => (
                        <div key={eventDate.toISOString()} data-date={startOfDay(eventDate).toISOString()}>
                            <DayEvents
                                date={eventDate}
                                events={events}
                                onEventClick={handleEventClick}
                                currentUserId={currentUserId}
                            />
                        </div>
                    ))
                )}
            </div>

            <EventDialog
                event={selectedEvent}
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                onDelete={handleDeleteEvent}
                currentUserId={currentUserId}
            />

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
