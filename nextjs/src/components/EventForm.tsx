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
    alwaysShowForm?: boolean
    onCancel?: () => void
}

export interface EventData {
    id: string
    title: string
    description: string | null
    date: string
    end_date?: string
    is_all_day?: boolean
    type: "meeting" | "task" | "reminder"
    user_id: string
    location?: string
    invitees?: string[]
    created_at: string
    recurrence_rule?: string // iCalendar RRULE format
}

export function EventForm({ selectedDate, onEventAdded, alwaysShowForm = false, onCancel }: EventFormProps) {
    const [isOpen, setIsOpen] = useState(alwaysShowForm)
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [type, setType] = useState<"meeting" | "task" | "reminder">("meeting")
    const [startTime, setStartTime] = useState("12:00")
    const [endTime, setEndTime] = useState("13:00")
    const [isAllDay, setIsAllDay] = useState(false)
    const [endDate, setEndDate] = useState<Date>(selectedDate)
    const [location, setLocation] = useState("")
    const [invitees, setInvitees] = useState<string[]>([])
    const [inviteInput, setInviteInput] = useState("")
    const [selectedUserId, setSelectedUserId] = useState<string>("")
    const [users, setUsers] = useState<{ id: string, email: string }[]>([])
    const [isAdmin, setIsAdmin] = useState(false)

    // Recurring event states
    const [isRecurring, setIsRecurring] = useState(false)
    const [recurrenceFrequency, setRecurrenceFrequency] = useState<"daily" | "weekly" | "monthly" | "yearly">("weekly")
    const [recurrenceInterval, setRecurrenceInterval] = useState(1)
    const [recurrenceEndType, setRecurrenceEndType] = useState<"never" | "after" | "on">("never")
    const [recurrenceCount, setRecurrenceCount] = useState(10)
    const [recurrenceEndDate, setRecurrenceEndDate] = useState<Date>(() => {
        // Default to 3 months from now
        const date = new Date(selectedDate)
        date.setMonth(date.getMonth() + 3)
        return date
    })

    // Initialize weekly days with the current day of the week
    const [weeklyDays, setWeeklyDays] = useState<string[]>(() => {
        const dayOfWeek = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"][selectedDate.getDay()]
        return [dayOfWeek]
    })

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
                // In development mode, always use the current user
                if (process.env.NODE_ENV === 'development') {
                    console.log("Development mode: Using mock users list")
                    setUsers([
                        {
                            id: userId,
                            email: user?.email || 'Current User'
                        },
                        {
                            id: "test-user-id-123456789",
                            email: "test@example.com"
                        }
                    ])
                } else {
                    try {
                        // Try to fetch users using an RPC function
                        const { data: userData, error: userError } = await supabase.rpc('get_users')

                        if (userError) {
                            console.error("Error fetching users:", userError)

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
        }

        checkAdmin()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            // Create date with selected time
            const [startHours, startMinutes] = startTime.split(":").map(Number)
            const eventDate = new Date(selectedDate)
            eventDate.setHours(startHours, startMinutes, 0, 0)

            // Get the user ID for the event
            const userId = isAdmin && selectedUserId ? selectedUserId : await getCurrentUserId()

            // Create end date with selected time
            let endDateTime = null;
            let startDateTime = eventDate.toISOString();

            if (isAllDay) {
                // For all-day events, set the end time to 23:59:59
                const eventEndDate = new Date(endDate);
                eventEndDate.setHours(23, 59, 59, 0);
                endDateTime = eventEndDate.toISOString();
            } else {
                const [endHours, endMinutes] = endTime.split(":").map(Number);
                const eventEndDate = new Date(endDate);
                eventEndDate.setHours(endHours, endMinutes, 0, 0);
                endDateTime = eventEndDate.toISOString();
            }

            // Ensure start date is before end date
            if (new Date(startDateTime) > new Date(endDateTime)) {
                // Swap dates if end date is before start date
                const temp = startDateTime;
                startDateTime = endDateTime;
                endDateTime = temp;
            }

            // Generate recurrence rule if recurring is enabled
            let recurrenceRule = null;
            if (isRecurring) {
                // Build the RRULE string according to iCalendar format
                let rule = `FREQ=${recurrenceFrequency.toUpperCase()};INTERVAL=${recurrenceInterval}`;

                // Add BYDAY for weekly recurrence
                if (recurrenceFrequency === "weekly" && weeklyDays.length > 0) {
                    rule += `;BYDAY=${weeklyDays.join(",")}`;
                } else if (recurrenceFrequency === "weekly") {
                    // If no days selected, use the day of the selected date
                    const dayOfWeek = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"][selectedDate.getDay()];
                    rule += `;BYDAY=${dayOfWeek}`;
                }

                // Add COUNT or UNTIL for end date
                if (recurrenceEndType === "after") {
                    rule += `;COUNT=${recurrenceCount}`;
                } else if (recurrenceEndType === "on") {
                    // Format date as YYYYMMDD for UNTIL
                    const untilDate = format(recurrenceEndDate, "yyyyMMdd");
                    rule += `;UNTIL=${untilDate}T235959Z`;
                }

                recurrenceRule = rule;
            }

            // Create the event data
            const eventData = {
                title,
                description: description || null,
                date: startDateTime,
                end_date: endDateTime,
                is_all_day: isAllDay,
                type,
                user_id: userId,
                location: location || null,
                invitees: invitees.length > 0 ? invitees : null,
                recurrence_rule: recurrenceRule || null
            }

            // Call the create event mutation
            createEvent.mutate(eventData, {
                onSuccess: (newEvent) => {
                    console.log("Event created successfully:", newEvent)

                    // Reset form and close
                    setTitle("")
                    setDescription("")
                    setType("meeting")
                    setStartTime("12:00")
                    setEndTime("13:00")
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

    // Only show the "Add Event" button if not alwaysShowForm and not isOpen
    if (!isOpen && !alwaysShowForm) {
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
        <div className="p-6 max-h-[80vh] overflow-y-auto">
            <h3 className="mb-4 text-lg font-medium">Add Event for {format(selectedDate, "MMMM d, yyyy")}</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">
                        Title
                    </label>
                    <input
                        type="text"
                        id="event-title"
                        name="event-title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full rounded-md border px-3 py-2 bg-background text-foreground"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">
                        Description
                    </label>
                    <textarea
                        id="event-description"
                        name="event-description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full rounded-md border px-3 py-2 bg-background text-foreground"
                        rows={3}
                    />
                </div>

                <div className="flex flex-wrap items-center gap-4 mb-4">
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="all-day"
                            checked={isAllDay}
                            onChange={(e) => setIsAllDay(e.target.checked)}
                            className="mr-2 h-4 w-4"
                        />
                        <label htmlFor="all-day" className="text-sm font-medium">
                            All day
                        </label>
                    </div>

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="recurring"
                            checked={isRecurring}
                            onChange={(e) => setIsRecurring(e.target.checked)}
                            className="mr-2 h-4 w-4"
                        />
                        <label htmlFor="recurring" className="text-sm font-medium">
                            Recurring
                        </label>
                    </div>
                </div>

                {/* Recurring event options */}
                {isRecurring && (
                    <div className="space-y-4 border rounded-md p-4 bg-muted/20">
                        <h4 className="font-medium">Recurrence Options</h4>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Frequency
                                </label>
                                <select
                                    id="recurrence-frequency"
                                    name="recurrence-frequency"
                                    value={recurrenceFrequency}
                                    onChange={(e) => setRecurrenceFrequency(e.target.value as any)}
                                    className="w-full rounded-md border px-3 py-2 bg-background text-foreground"
                                >
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                    <option value="yearly">Yearly</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Every
                                </label>
                                <div className="flex items-center">
                                    <input
                                        type="number"
                                        id="recurrence-interval"
                                        name="recurrence-interval"
                                        min="1"
                                        max="99"
                                        value={recurrenceInterval}
                                        onChange={(e) => setRecurrenceInterval(parseInt(e.target.value) || 1)}
                                        className="w-20 rounded-md border px-3 py-2 bg-background text-foreground"
                                    />
                                    <span className="ml-2">
                                        {recurrenceFrequency === "daily" && "day(s)"}
                                        {recurrenceFrequency === "weekly" && "week(s)"}
                                        {recurrenceFrequency === "monthly" && "month(s)"}
                                        {recurrenceFrequency === "yearly" && "year(s)"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {recurrenceFrequency === "weekly" && (
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Repeat on
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {["SU", "MO", "TU", "WE", "TH", "FR", "SA"].map((day, index) => (
                                        <button
                                            key={day}
                                            type="button"
                                            onClick={() => {
                                                if (weeklyDays.includes(day)) {
                                                    setWeeklyDays(weeklyDays.filter(d => d !== day));
                                                } else {
                                                    setWeeklyDays([...weeklyDays, day]);
                                                }
                                            }}
                                            className={`w-8 h-8 rounded-full text-xs font-medium ${weeklyDays.includes(day)
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-muted text-muted-foreground"
                                                }`}
                                        >
                                            {day.substring(0, 1)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Ends
                            </label>
                            <div className="space-y-2">
                                <div className="flex items-center">
                                    <input
                                        type="radio"
                                        id="never-end"
                                        name="recurrence-end"
                                        checked={recurrenceEndType === "never"}
                                        onChange={() => setRecurrenceEndType("never")}
                                        className="mr-2 h-4 w-4"
                                    />
                                    <label htmlFor="never-end" className="text-sm">
                                        Never
                                    </label>
                                </div>

                                <div className="flex items-center">
                                    <input
                                        type="radio"
                                        id="end-after"
                                        name="recurrence-end"
                                        checked={recurrenceEndType === "after"}
                                        onChange={() => setRecurrenceEndType("after")}
                                        className="mr-2 h-4 w-4"
                                    />
                                    <label htmlFor="end-after" className="text-sm mr-2">
                                        After
                                    </label>
                                    <input
                                        type="number"
                                        id="recurrence-count"
                                        name="recurrence-count"
                                        min="1"
                                        max="999"
                                        value={recurrenceCount}
                                        onChange={(e) => setRecurrenceCount(parseInt(e.target.value) || 1)}
                                        className="w-20 rounded-md border px-3 py-2 bg-background text-foreground"
                                        disabled={recurrenceEndType !== "after"}
                                    />
                                    <span className="ml-2">occurrence(s)</span>
                                </div>

                                <div className="flex items-center">
                                    <input
                                        type="radio"
                                        id="end-on"
                                        name="recurrence-end"
                                        checked={recurrenceEndType === "on"}
                                        onChange={() => setRecurrenceEndType("on")}
                                        className="mr-2 h-4 w-4"
                                    />
                                    <label htmlFor="end-on" className="text-sm mr-2">
                                        On
                                    </label>
                                    <input
                                        type="date"
                                        id="recurrence-end-date"
                                        name="recurrence-end-date"
                                        value={format(recurrenceEndDate, "yyyy-MM-dd")}
                                        onChange={(e) => setRecurrenceEndDate(new Date(e.target.value))}
                                        className="rounded-md border px-3 py-2 bg-background text-foreground"
                                        disabled={recurrenceEndType !== "on"}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Type
                        </label>
                        <select
                            id="event-type"
                            name="event-type"
                            value={type}
                            onChange={(e) => setType(e.target.value as "meeting" | "task" | "reminder")}
                            className="w-full rounded-md border px-3 py-2 bg-background text-foreground"
                        >
                            <option value="meeting">Meeting</option>
                            <option value="task">Task</option>
                            <option value="reminder">Reminder</option>
                        </select>
                    </div>

                    {!isAllDay && (
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Start Time
                            </label>
                            <input
                                type="time"
                                id="start-time"
                                name="start-time"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                className="w-full rounded-md border px-3 py-2 bg-background text-foreground"
                            />
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            End Date
                        </label>
                        <input
                            type="date"
                            id="end-date"
                            name="end-date"
                            value={format(endDate, "yyyy-MM-dd")}
                            onChange={(e) => setEndDate(new Date(e.target.value))}
                            className="w-full rounded-md border px-3 py-2 bg-background text-foreground"
                        />
                    </div>
                    {!isAllDay && (
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                End Time
                            </label>
                            <input
                                type="time"
                                id="end-time"
                                name="end-time"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                className="w-full rounded-md border px-3 py-2 bg-background text-foreground"
                            />
                        </div>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">
                        Location
                    </label>
                    <input
                        type="text"
                        id="event-location"
                        name="event-location"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full rounded-md border px-3 py-2 bg-background text-foreground"
                        placeholder="Add location"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">
                        Invitees
                    </label>
                    <div className="flex">
                        <input
                            type="email"
                            id="invitee-email"
                            name="invitee-email"
                            value={inviteInput}
                            onChange={(e) => setInviteInput(e.target.value)}
                            className="flex-1 rounded-l-md border px-3 py-2 bg-background text-foreground"
                            placeholder="Add email address"
                        />
                        <Button
                            type="button"
                            onClick={() => {
                                if (inviteInput && !invitees.includes(inviteInput)) {
                                    setInvitees([...invitees, inviteInput]);
                                    setInviteInput("");
                                }
                            }}
                            className="rounded-l-none"
                        >
                            Add
                        </Button>
                    </div>
                    {invitees.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                            {invitees.map((email, index) => (
                                <div key={index} className="flex items-center bg-muted px-2 py-1 rounded-md text-sm">
                                    {email}
                                    <button
                                        type="button"
                                        onClick={() => setInvitees(invitees.filter((_, i) => i !== index))}
                                        className="ml-2 text-muted-foreground hover:text-foreground"
                                    >
                                        &times;
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                    <Button
                        type="button"
                        onClick={() => {
                            if (onCancel) {
                                onCancel();
                            }
                            setIsOpen(false);
                        }}
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
