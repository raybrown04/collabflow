"use client"

/**
 * events-list.tsx
 * Updated: 2/27/2025
 * 
 * This component has been simplified to:
 * - Show events only for the selected date
 * - Remove the synchronized scrolling functionality
 * - Maintain event interaction capabilities (click, edit, delete)
 * - Preserve drag-and-drop functionality
 */

import { format, isSameDay, parseISO, compareAsc } from "date-fns"
import { Database } from "@/lib/database.types"
import { useEffect, useRef, useState, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useUpdateEvent, useDeleteEvent } from "@/hooks/useCalendarEvents"
import { useUpdateEventDate } from "@/hooks/useUpdateEventDate"
import { getCurrentUserId, useAuth } from "@/lib/auth"
import { DraggableEventCard } from "./DraggableEventCard"

// Use the CalendarEvent type from useCalendarEvents hook
import { CalendarEvent } from "@/hooks/useCalendarEvents";

interface EventsListProps {
    date: Date
    events: CalendarEvent[]
    onVisibleDateChange?: (date: Date, fromUserScroll?: boolean) => void
    scrollToDateRef?: React.RefObject<((date: Date) => void) | null>
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
    const [startTime, setStartTime] = useState("12:00")
    const [endTime, setEndTime] = useState("13:00")
    const [isAllDay, setIsAllDay] = useState(false)
    const [endDate, setEndDate] = useState<Date>(new Date())
    const [location, setLocation] = useState("")
    const [invitees, setInvitees] = useState<string[]>([])
    const [inviteInput, setInviteInput] = useState("")

    // Recurring event states
    const [isRecurring, setIsRecurring] = useState(false)
    const [recurrenceFrequency, setRecurrenceFrequency] = useState<"daily" | "weekly" | "monthly" | "yearly">("weekly")
    const [recurrenceInterval, setRecurrenceInterval] = useState(1)
    const [recurrenceEndType, setRecurrenceEndType] = useState<"never" | "after" | "on">("never")
    const [recurrenceCount, setRecurrenceCount] = useState(10)
    const [recurrenceEndDate, setRecurrenceEndDate] = useState<Date>(() => {
        // Default to 3 months from now
        const date = new Date()
        date.setMonth(date.getMonth() + 3)
        return date
    })
    const [weeklyDays, setWeeklyDays] = useState<string[]>([])

    const updateEventMutation = useUpdateEvent()

    // Initialize form when event changes
    useEffect(() => {
        if (event) {
            const eventDate = parseISO(event.date)
            setTitle(event.title)
            setDescription(event.description || "")
            setType(event.type)
            setStartTime(format(eventDate, "HH:mm"))

            // Handle end date and time
            if (event.end_date) {
                const endDateTime = parseISO(event.end_date)
                setEndDate(endDateTime)
                setEndTime(format(endDateTime, "HH:mm"))
            } else {
                // Default to event date + 1 hour
                const defaultEndDate = new Date(eventDate)
                defaultEndDate.setHours(defaultEndDate.getHours() + 1)
                setEndDate(defaultEndDate)
                setEndTime(format(defaultEndDate, "HH:mm"))
            }

            // Handle all day flag
            setIsAllDay(event.is_all_day || false)

            // Handle location
            setLocation(event.location || "")

            // Handle invitees
            setInvitees(event.invitees || [])

            // Handle recurrence rule
            if (event.recurrence_rule) {
                setIsRecurring(true)

                // Parse the RRULE string
                const rule = event.recurrence_rule

                // Extract frequency
                const freqMatch = rule.match(/FREQ=([^;]+)/)
                if (freqMatch && freqMatch[1]) {
                    setRecurrenceFrequency(freqMatch[1].toLowerCase() as any)
                }

                // Extract interval
                const intervalMatch = rule.match(/INTERVAL=([0-9]+)/)
                if (intervalMatch && intervalMatch[1]) {
                    setRecurrenceInterval(parseInt(intervalMatch[1]))
                }

                // Extract BYDAY for weekly recurrence
                const bydayMatch = rule.match(/BYDAY=([^;]+)/)
                if (bydayMatch && bydayMatch[1]) {
                    setWeeklyDays(bydayMatch[1].split(','))
                } else {
                    // Default to the day of the event
                    const dayOfWeek = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"][eventDate.getDay()]
                    setWeeklyDays([dayOfWeek])
                }

                // Extract COUNT or UNTIL for end date
                const countMatch = rule.match(/COUNT=([0-9]+)/)
                if (countMatch && countMatch[1]) {
                    setRecurrenceEndType("after")
                    setRecurrenceCount(parseInt(countMatch[1]))
                } else {
                    const untilMatch = rule.match(/UNTIL=([^;T]+)/)
                    if (untilMatch && untilMatch[1]) {
                        setRecurrenceEndType("on")
                        // Parse the UNTIL date (YYYYMMDD format)
                        const year = untilMatch[1].substring(0, 4)
                        const month = untilMatch[1].substring(4, 6)
                        const day = untilMatch[1].substring(6, 8)
                        setRecurrenceEndDate(new Date(`${year}-${month}-${day}`))
                    } else {
                        setRecurrenceEndType("never")
                    }
                }
            } else {
                // Reset recurrence states if no rule
                setIsRecurring(false)
                setRecurrenceFrequency("weekly")
                setRecurrenceInterval(1)
                setRecurrenceEndType("never")
                setRecurrenceCount(10)

                // Set default end date to 3 months from now
                const date = new Date()
                date.setMonth(date.getMonth() + 3)
                setRecurrenceEndDate(date)

                // Set default weekly days to the day of the event
                const dayOfWeek = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"][eventDate.getDay()]
                setWeeklyDays([dayOfWeek])
            }
        }
    }, [event])

    if (!event) return null

    const eventDate = parseISO(event.date)
    const colors = typeColors[event.type]

    const handleSave = async () => {
        if (!event) return;

        try {
            // Create date with selected time
            const [startHours, startMinutes] = startTime.split(":").map(Number)
            const updatedDate = new Date(eventDate)
            updatedDate.setHours(startHours, startMinutes, 0, 0)

            // Create end date with selected time
            let endDateTime = null;
            let startDateTime = updatedDate.toISOString();

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
                    const dayOfWeek = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"][updatedDate.getDay()];
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

            // Get the current user ID
            const userId = await getCurrentUserId()

            // Prepare the update payload
            const updatedEvent = {
                id: event.id,
                title,
                description: description || null,
                type,
                date: startDateTime,
                end_date: endDateTime,
                is_all_day: isAllDay,
                location: location || null,
                invitees: invitees.length > 0 ? invitees : null,
                user_id: userId,
                recurrence_rule: recurrenceRule
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
                    <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
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

                        <div className="flex flex-wrap items-center gap-4 mb-4">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="all-day-edit"
                                    checked={isAllDay}
                                    onChange={(e) => setIsAllDay(e.target.checked)}
                                    className="mr-2 h-4 w-4"
                                />
                                <label htmlFor="all-day-edit" className="text-sm font-medium">
                                    All day
                                </label>
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="recurring-edit"
                                    checked={isRecurring}
                                    onChange={(e) => setIsRecurring(e.target.checked)}
                                    className="mr-2 h-4 w-4"
                                />
                                <label htmlFor="recurring-edit" className="text-sm font-medium">
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
                                            value={recurrenceFrequency}
                                            onChange={(e) => setRecurrenceFrequency(e.target.value as any)}
                                            className="w-full rounded-md border px-3 py-2"
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
                                                min="1"
                                                max="99"
                                                value={recurrenceInterval}
                                                onChange={(e) => setRecurrenceInterval(parseInt(e.target.value) || 1)}
                                                className="w-20 rounded-md border px-3 py-2"
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
                                                id="never-end-edit"
                                                name="recurrence-end-edit"
                                                checked={recurrenceEndType === "never"}
                                                onChange={() => setRecurrenceEndType("never")}
                                                className="mr-2 h-4 w-4"
                                            />
                                            <label htmlFor="never-end-edit" className="text-sm">
                                                Never
                                            </label>
                                        </div>

                                        <div className="flex items-center">
                                            <input
                                                type="radio"
                                                id="end-after-edit"
                                                name="recurrence-end-edit"
                                                checked={recurrenceEndType === "after"}
                                                onChange={() => setRecurrenceEndType("after")}
                                                className="mr-2 h-4 w-4"
                                            />
                                            <label htmlFor="end-after-edit" className="text-sm mr-2">
                                                After
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="999"
                                                value={recurrenceCount}
                                                onChange={(e) => setRecurrenceCount(parseInt(e.target.value) || 1)}
                                                className="w-20 rounded-md border px-3 py-2"
                                                disabled={recurrenceEndType !== "after"}
                                            />
                                            <span className="ml-2">occurrence(s)</span>
                                        </div>

                                        <div className="flex items-center">
                                            <input
                                                type="radio"
                                                id="end-on-edit"
                                                name="recurrence-end-edit"
                                                checked={recurrenceEndType === "on"}
                                                onChange={() => setRecurrenceEndType("on")}
                                                className="mr-2 h-4 w-4"
                                            />
                                            <label htmlFor="end-on-edit" className="text-sm mr-2">
                                                On
                                            </label>
                                            <input
                                                type="date"
                                                value={format(recurrenceEndDate, "yyyy-MM-dd")}
                                                onChange={(e) => setRecurrenceEndDate(new Date(e.target.value))}
                                                className="rounded-md border px-3 py-2"
                                                disabled={recurrenceEndType !== "on"}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

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

                            {!isAllDay && (
                                <div>
                                    <label className="block text-sm font-medium mb-1">Start Time</label>
                                    <input
                                        type="time"
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                        className="w-full rounded-md border px-3 py-2"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">End Date</label>
                                <input
                                    type="date"
                                    value={format(endDate, "yyyy-MM-dd")}
                                    onChange={(e) => setEndDate(new Date(e.target.value))}
                                    className="w-full rounded-md border px-3 py-2"
                                />
                            </div>
                            {!isAllDay && (
                                <div>
                                    <label className="block text-sm font-medium mb-1">End Time</label>
                                    <input
                                        type="time"
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                        className="w-full rounded-md border px-3 py-2"
                                    />
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Location</label>
                            <input
                                type="text"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                className="w-full rounded-md border px-3 py-2"
                                placeholder="Add location"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Invitees</label>
                            <div className="flex">
                                <input
                                    type="email"
                                    value={inviteInput}
                                    onChange={(e) => setInviteInput(e.target.value)}
                                    className="flex-1 rounded-l-md border px-3 py-2"
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
                    </div>
                ) : (
                    <div className="space-y-4 py-4">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                                {format(eventDate, "EEEE, MMMM d, yyyy")}
                            </div>
                            <div className="text-sm font-medium">
                                {event.is_all_day ? (
                                    <span>All day</span>
                                ) : (
                                    <span>{format(eventDate, "h:mm a")}</span>
                                )}
                            </div>
                        </div>

                        {/* Show end date if it exists and is different from start date */}
                        {event.end_date && !isSameDay(parseISO(event.date), parseISO(event.end_date)) && (
                            <div className="text-sm">
                                <div className="font-medium mb-1">End Date</div>
                                <p className="text-muted-foreground">
                                    {format(parseISO(event.end_date), "EEEE, MMMM d, yyyy")}
                                    {!event.is_all_day && (
                                        <span> at {format(parseISO(event.end_date), "h:mm a")}</span>
                                    )}
                                </p>
                            </div>
                        )}

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

                        {event.location && (
                            <div className="text-sm">
                                <div className="font-medium mb-1">Location</div>
                                <p className="text-muted-foreground">{event.location}</p>
                            </div>
                        )}

                        {event.invitees && event.invitees.length > 0 && (
                            <div className="text-sm">
                                <div className="font-medium mb-1">Invitees</div>
                                <div className="flex flex-wrap gap-2">
                                    {event.invitees.map((email, index) => (
                                        <div key={index} className="bg-muted px-2 py-1 rounded-md text-xs text-muted-foreground">
                                            {email}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {event.recurrence_rule && (
                            <div className="text-sm">
                                <div className="font-medium mb-1">Recurrence</div>
                                <p className="text-muted-foreground">
                                    {(() => {
                                        const rule = event.recurrence_rule;
                                        let recurrenceText = "";

                                        // Extract frequency
                                        const freqMatch = rule.match(/FREQ=([^;]+)/);
                                        if (freqMatch && freqMatch[1]) {
                                            const freq = freqMatch[1].toLowerCase();

                                            // Extract interval
                                            const intervalMatch = rule.match(/INTERVAL=([0-9]+)/);
                                            const interval = intervalMatch && intervalMatch[1] ? parseInt(intervalMatch[1]) : 1;

                                            // Build frequency text
                                            if (freq === "daily") {
                                                recurrenceText = interval === 1 ? "Daily" : `Every ${interval} days`;
                                            } else if (freq === "weekly") {
                                                recurrenceText = interval === 1 ? "Weekly" : `Every ${interval} weeks`;

                                                // Add days for weekly recurrence
                                                const bydayMatch = rule.match(/BYDAY=([^;]+)/);
                                                if (bydayMatch && bydayMatch[1]) {
                                                    const days = bydayMatch[1].split(",");
                                                    const dayNames = {
                                                        "SU": "Sunday",
                                                        "MO": "Monday",
                                                        "TU": "Tuesday",
                                                        "WE": "Wednesday",
                                                        "TH": "Thursday",
                                                        "FR": "Friday",
                                                        "SA": "Saturday"
                                                    };
                                                    const daysList = days.map(d => dayNames[d as keyof typeof dayNames]).join(", ");
                                                    recurrenceText += ` on ${daysList}`;
                                                }
                                            } else if (freq === "monthly") {
                                                recurrenceText = interval === 1 ? "Monthly" : `Every ${interval} months`;
                                            } else if (freq === "yearly") {
                                                recurrenceText = interval === 1 ? "Yearly" : `Every ${interval} years`;
                                            }

                                            // Add end information
                                            const countMatch = rule.match(/COUNT=([0-9]+)/);
                                            if (countMatch && countMatch[1]) {
                                                recurrenceText += `, ${countMatch[1]} times`;
                                            } else {
                                                const untilMatch = rule.match(/UNTIL=([^;T]+)/);
                                                if (untilMatch && untilMatch[1]) {
                                                    // Parse the UNTIL date (YYYYMMDD format)
                                                    const year = untilMatch[1].substring(0, 4);
                                                    const month = untilMatch[1].substring(4, 6);
                                                    const day = untilMatch[1].substring(6, 8);
                                                    const untilDate = new Date(`${year}-${month}-${day}`);
                                                    recurrenceText += `, until ${format(untilDate, "MMMM d, yyyy")}`;
                                                }
                                            }
                                        }

                                        return recurrenceText || "Recurring event";
                                    })()}
                                </p>
                            </div>
                        )}
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

export function EventsList({ date, events, onVisibleDateChange, scrollToDateRef }: EventsListProps) {
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
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

    return (
        <div className="h-full flex flex-col w-full max-w-full">
            <div className="px-0 pb-2 flex flex-col h-full w-full max-w-full">
                <h3 className="text-lg font-bold mb-2 mt 16 pt-24">
                    {format(date, "MMM d, yyyy")}
                </h3>

                {sortedEvents.length === 0 ? (
                    <div className="text-center p-3 bg-muted/20 rounded-lg">
                        <p className="text-sm text-muted-foreground">No events scheduled for this day.</p>
                    </div>
                ) : (
                    <div className="space-y-2 w-full">
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
