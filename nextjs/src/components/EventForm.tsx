"use client"

import { useState, useEffect } from "react"
import { useCreateEvent } from "@/hooks/useCalendarEvents"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { Database } from "@/lib/database.types"
import { getCurrentUserId, useAuth, isCurrentUserAdmin } from "@/lib/auth"
import { supabase } from "@/lib/auth"

interface EventFormProps {
    selectedDate: Date
    onEventAdded: (event: EventData) => void
}

export interface EventData {
    id: string
    title: string
    description: string | null
    date: string
    type: "meeting" | "task" | "reminder"
    user_id: string
    created_at: string
}

export function EventForm({ selectedDate, onEventAdded }: EventFormProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [type, setType] = useState<"meeting" | "task" | "reminder">("meeting")
    const [time, setTime] = useState("12:00")
    const [selectedUserId, setSelectedUserId] = useState<string>("")
    const [users, setUsers] = useState<{ id: string, email: string }[]>([])
    const [isAdmin, setIsAdmin] = useState(false)

    const { user } = useAuth()
    const createEvent = useCreateEvent()

    // Check if current user is admin
    useEffect(() => {
        const checkAdmin = async () => {
            const admin = await isCurrentUserAdmin()
            setIsAdmin(admin)

            // Set default selected user to current user
            const userId = await getCurrentUserId()
            setSelectedUserId(userId)

            // If admin, fetch users list
            if (admin) {
                try {
                    // Try to fetch from auth.users instead of profiles
                    const { data: userData, error: userError } = await supabase
                        .from('auth.users')
                        .select('id, email')

                    if (userError) {
                        console.error("Error fetching users from auth.users:", userError)

                        // Fallback to using just the current user
                        if (user) {
                            setUsers([{
                                id: userId,
                                email: user.email || 'Current User'
                            }])
                        }
                    } else if (userData && userData.length > 0) {
                        setUsers(userData)
                    } else {
                        // If no users found, use current user as fallback
                        if (user) {
                            setUsers([{
                                id: userId,
                                email: user.email || 'Current User'
                            }])
                        }
                    }
                } catch (error) {
                    console.error("Error in fetchUsers:", error)

                    // Fallback to using just the current user
                    if (user) {
                        setUsers([{
                            id: userId,
                            email: user.email || 'Current User'
                        }])
                    }
                }
            }
        }

        checkAdmin()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            // Create date with selected time
            const [hours, minutes] = time.split(":").map(Number)
            const eventDate = new Date(selectedDate)
            eventDate.setHours(hours, minutes, 0, 0)

            // Get the user ID for the event
            const userId = isAdmin && selectedUserId ? selectedUserId : await getCurrentUserId()

            // Create the event data
            const eventData = {
                title,
                description: description || null,
                date: eventDate.toISOString(),
                type,
                user_id: userId
            }

            // Call the create event mutation
            createEvent.mutate(eventData, {
                onSuccess: (newEvent) => {
                    console.log("Event created successfully:", newEvent)

                    // Reset form and close
                    setTitle("")
                    setDescription("")
                    setType("meeting")
                    setTime("12:00")
                    setIsOpen(false)

                    // Notify parent component with the new event
                    onEventAdded(newEvent)
                },
                onError: (error) => {
                    console.error("Error creating event:", error)
                    alert(`Failed to create event: ${error instanceof Error ? error.message : 'Unknown error'}`)
                }
            })
        } catch (error) {
            console.error("Error in event creation:", error)
            alert("An error occurred. Please try again.")
        }
    }

    if (!isOpen) {
        return (
            <Button
                onClick={() => setIsOpen(true)}
                className="w-full bg-primary hover:bg-primary/90"
            >
                Add Event
            </Button>
        )
    }

    return (
        <div className="rounded-lg border p-4 shadow-md">
            <h3 className="mb-4 text-lg font-medium">Add Event for {format(selectedDate, "MMMM d, yyyy")}</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">
                        Title
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full rounded-md border px-3 py-2"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">
                        Description
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full rounded-md border px-3 py-2"
                        rows={3}
                    />
                </div>

                <div className={`grid ${isAdmin ? 'grid-cols-3' : 'grid-cols-2'} gap-4`}>
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Type
                        </label>
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
                        <label className="block text-sm font-medium mb-1">
                            Time
                        </label>
                        <input
                            type="time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            className="w-full rounded-md border px-3 py-2"
                        />
                    </div>

                    {isAdmin && (
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                User
                            </label>
                            <select
                                value={selectedUserId}
                                onChange={(e) => setSelectedUserId(e.target.value)}
                                className="w-full rounded-md border px-3 py-2"
                            >
                                {users.map(user => (
                                    <option key={user.id} value={user.id}>
                                        {user.email}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                    <Button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        variant="outline"
                        disabled={createEvent.isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={createEvent.isPending}
                    >
                        {createEvent.isPending ? (
                            <div className="flex items-center gap-2">
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                                <span>Saving...</span>
                            </div>
                        ) : "Save"}
                    </Button>
                </div>
            </form>
        </div>
    )
}
