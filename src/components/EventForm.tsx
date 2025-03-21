"use client"

import { useState, useEffect } from "react"
import { useCreateEvent, useUpdateEvent } from "@/hooks/useCalendarEvents"
import { Button } from "@/components/ui/button"
import { format, parseISO } from "date-fns"
import { Bell, CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { ReminderDialog } from "./ReminderDialog"
import { RecurringDialog } from "./RecurringDialog"
import { getCurrentUserId, useAuth, isCurrentUserAdmin } from "@/lib/auth"
import { supabase } from "@/lib/auth"
import { CalendarEvent } from "@/hooks/useCalendarEvents"
import { ProjectSelector } from "./ProjectSelector"
import { Project } from "@/hooks/useProjects"
import useEventProjects from "@/hooks/useEventProjects"
import { LocationInput, LocationData } from "./LocationInput"

interface EventFormProps {
    selectedDate: Date
    onEventAdded: (event: EventData) => void
    alwaysShowForm?: boolean
    onCancel?: () => void
    existingEvent?: CalendarEvent
    onDelete?: (id: string) => void
}

export interface EventData {
    id: string
    title: string
    description: string | null
    date: string
    end_date?: string
    is_all_day?: boolean
    type: "meeting" | "task" | "reminder" // Keeping for backward compatibility
    user_id: string
    location?: string
    invitees?: string[]
    created_at: string
    recurrence_rule?: string
    projects?: Project[] // New field for project associations
}

export function EventForm({ selectedDate, onEventAdded, alwaysShowForm = false, onCancel, existingEvent, onDelete }: EventFormProps) {
    // Use today's date as default when adding a new event
    const today = new Date()
    
    const [isOpen, setIsOpen] = useState(alwaysShowForm)
    const [title, setTitle] = useState(existingEvent?.title || "")
    const [description, setDescription] = useState(existingEvent?.description || "")
    const [type, setType] = useState<"meeting" | "task" | "reminder">(existingEvent?.type || "meeting") // Keeping for backward compatibility
    const [eventProjects, setEventProjects] = useState<Project[]>(existingEvent?.projects || [])
    const { setSelectedProjects, updateEventProjects } = useEventProjects()
    
    // Initialize selected projects if event has projects
    useEffect(() => {
        if (existingEvent?.projects) {
            setEventProjects(existingEvent.projects);
            setSelectedProjects(existingEvent.projects);
        }
    }, [existingEvent, setSelectedProjects]);
    const [startTime, setStartTime] = useState(existingEvent ? format(parseISO(existingEvent.date), "HH:mm") : "12:00")
    const [endTime, setEndTime] = useState(existingEvent?.end_date ? format(parseISO(existingEvent.end_date), "HH:mm") : "13:00")
    const [isAllDay, setIsAllDay] = useState(existingEvent?.is_all_day || false)
    const [startDate, setStartDate] = useState<Date>(existingEvent?.date ? parseISO(existingEvent.date) : today)
    const [endDate, setEndDate] = useState<Date>(existingEvent?.end_date ? parseISO(existingEvent.end_date) : today)
    const [locationData, setLocationData] = useState<LocationData>({
        address: existingEvent?.location || "",
        coordinates: existingEvent?.location_coordinates || undefined
    })
    const [invitees, setInvitees] = useState<string[]>(existingEvent?.invitees || [])
    const [inviteInput, setInviteInput] = useState("")
    const [isRecurring, setIsRecurring] = useState(!!existingEvent?.recurrence_rule)
    const [isRecurringDialogOpen, setIsRecurringDialogOpen] = useState(false)
    const [isReminderDialogOpen, setIsReminderDialogOpen] = useState(false)
    const [reminderDate, setReminderDate] = useState<string>("")
    const [reminderTime, setReminderTime] = useState<string>("")
    const [hasReminder, setHasReminder] = useState(false)
    const [startCalendarOpen, setStartCalendarOpen] = useState(false)
    const [endCalendarOpen, setEndCalendarOpen] = useState(false)
    
    const { user } = useAuth()
    const createEvent = useCreateEvent()
    const updateEvent = useUpdateEvent()
    
    // Handle setting reminder
    const handleSetReminder = (date: string, time: string) => {
        setReminderDate(date);
        setReminderTime(time);
        setHasReminder(true);
        setStartTime(time);
        setIsReminderDialogOpen(false);
    }
    
    // Handle setting recurring
    const handleSetRecurring = (recurrenceRule: string) => {
        setIsRecurring(true);
        // Store the recurrence rule to be used when saving the event
        if (existingEvent) {
            existingEvent.recurrence_rule = recurrenceRule;
        }
        setIsRecurringDialogOpen(false);
    }
    
    // Format reminder date for display
    const formatReminderDisplay = () => {
        if (!hasReminder || !reminderDate) return "Set Reminder";
        
        try {
            const [year, month, day] = reminderDate.split('-').map(Number);
            const monthStr = month.toString().padStart(2, '0');
            const dayStr = day.toString().padStart(2, '0');
            return `${monthStr}/${dayStr} at ${reminderTime}`;
        } catch (error) {
            return "Set Reminder";
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            // Create date with selected time
            const [startHours, startMinutes] = startTime.split(":").map(Number)
            const eventDate = new Date(startDate)
            eventDate.setHours(startHours, startMinutes, 0, 0)

            // Get the user ID for the event
            const userId = await getCurrentUserId()

            // Create end date with selected time
            let endDateTime = null;
            let startDateTime = eventDate.toISOString();

            if (isAllDay) {
                const eventEndDate = new Date(endDate);
                eventEndDate.setHours(23, 59, 59, 0);
                endDateTime = eventEndDate.toISOString();
            } else {
                const [endHours, endMinutes] = endTime.split(":").map(Number);
                const eventEndDate = new Date(endDate);
                eventEndDate.setHours(endHours, endMinutes, 0, 0);
                endDateTime = eventEndDate.toISOString();
            }

            // Create the event data
            const eventData = {
                title,
                description: description || null,
                date: startDateTime,
                end_date: endDateTime,
                is_all_day: isAllDay,
                type, // Keeping for backward compatibility
                user_id: userId,
                location: locationData.address || null,
                location_coordinates: locationData.coordinates || null,
                invitees: invitees.length > 0 ? invitees : null,
                recurrence_rule: isRecurring ? existingEvent?.recurrence_rule || "FREQ=WEEKLY;INTERVAL=1" : null,
                projects: eventProjects // Add projects to event data
            }

            if (existingEvent) {
                // Update existing event
                const updatedEvent = {
                    ...eventData,
                    id: existingEvent.id,
                    created_at: existingEvent.created_at
                }

                updateEvent.mutate(updatedEvent, {
                    onSuccess: (updatedEvent) => {
                        onEventAdded(updatedEvent)
                    },
                    onError: (error) => {
                        alert(`Failed to update event: ${error instanceof Error ? error.message : 'Unknown error'}`)
                    }
                })
            } else {
                // Create new event
                createEvent.mutate(eventData, {
                    onSuccess: (newEvent) => {
                        // Add projects to the new event if any were selected
                        if (eventProjects.length > 0) {
                            updateEventProjects(newEvent.id, eventProjects);
                        }
                        
                        setTitle("")
                        setDescription("")
                        setType("meeting")
                        setStartTime("12:00")
                        setEndTime("13:00")
                        setIsOpen(false)
                        onEventAdded(newEvent)
                    },
                    onError: (error) => {
                        alert(`Failed to create event: ${error instanceof Error ? error.message : 'Unknown error'}`)
                    }
                })
            }
        } catch (error) {
            alert("An error occurred. Please try again.")
        }
    }

    // Handle delete event
    const handleDelete = () => {
        if (existingEvent && onDelete) {
            onDelete(existingEvent.id)
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
        <div className="p-4 rounded-lg bg-background dialog-transition">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Title</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                                className="w-full rounded-md border px-3 h-10 bg-background text-foreground placeholder:text-gray-400"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                                className="w-full rounded-md border px-3 h-10 bg-background text-foreground placeholder:text-gray-400"
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
                        <label htmlFor="all-day" className="text-sm font-medium">All day</label>
                    </div>

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="recurring"
                            checked={isRecurring}
                            onChange={(e) => {
                                setIsRecurring(e.target.checked);
                                if (e.target.checked) {
                                    setIsRecurringDialogOpen(true);
                                }
                            }}
                            className="mr-2 h-4 w-4"
                        />
                        <label htmlFor="recurring" className="text-sm font-medium">Recurring</label>
                    </div>
                </div>

                {/* Start Date and Start Time */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Start Date</label>
                        <div className="relative">
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full justify-start text-left font-normal rounded-md border px-3 h-10 bg-background text-foreground"
                                onClick={() => setStartCalendarOpen(!startCalendarOpen)}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {format(startDate, "PPP")}
                            </Button>
                            {startCalendarOpen && (
                                <div className="absolute z-10 mt-1 rounded-md border bg-background dialog-transition shadow-md" onClick={(e) => e.stopPropagation()}>
                                    <Calendar
                                        mode="single"
                                        selected={startDate}
                                        onSelect={(date) => {
                                            if (date) {
                                                // Create a new date object to ensure it's properly updated
                                                const newDate = new Date(date);
                                                setStartDate(newDate);
                                                setStartCalendarOpen(false);
                                            }
                                        }}
                                        initialFocus
                                        className="rounded-md"
                                    />
                                </div>
                            )}
                        </div>
                        {/* Hidden input to ensure the date is included in form submission */}
                        <input 
                            type="hidden" 
                            name="startDate" 
                            value={format(startDate, "yyyy-MM-dd")} 
                        />
                    </div>
                    {!isAllDay && (
                        <div>
                            <label className="block text-sm font-medium mb-1">Start Time</label>
                            <input
                                type="time"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                className="w-full rounded-md border px-3 h-10 bg-background text-foreground placeholder:text-gray-400"
                            />
                        </div>
                    )}
                </div>

                {/* End Date and End Time */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">End Date</label>
                        <div className="relative">
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full justify-start text-left font-normal rounded-md border px-3 h-10 bg-background text-foreground"
                                onClick={() => setEndCalendarOpen(!endCalendarOpen)}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {format(endDate, "PPP")}
                            </Button>
                            {endCalendarOpen && (
                                <div className="absolute z-10 mt-1 rounded-md border bg-background dialog-transition shadow-md" onClick={(e) => e.stopPropagation()}>
                                    <Calendar
                                        mode="single"
                                        selected={endDate}
                                        onSelect={(date) => {
                                            if (date) {
                                                // Create a new date object to ensure it's properly updated
                                                const newDate = new Date(date);
                                                setEndDate(newDate);
                                                setEndCalendarOpen(false);
                                            }
                                        }}
                                        initialFocus
                                        className="rounded-md"
                                    />
                                </div>
                            )}
                        </div>
                        {/* Hidden input to ensure the date is included in form submission */}
                        <input 
                            type="hidden" 
                            name="endDate" 
                            value={format(endDate, "yyyy-MM-dd")} 
                        />
                    </div>
                    {!isAllDay && (
                        <div>
                            <label className="block text-sm font-medium mb-1">End Time</label>
                            <input
                                type="time"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                className="w-full rounded-md border px-3 h-10 bg-background text-foreground placeholder:text-gray-400"
                            />
                        </div>
                    )}
                </div>
                
                {/* Projects and Reminder */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <ProjectSelector 
                            taskId={null} 
                            eventId={existingEvent?.id || null}
                            onProjectsChange={(projects) => {
                                setEventProjects(projects);
                                setSelectedProjects(projects);
                                
                                // If we have an existing event, update its projects
                                if (existingEvent?.id) {
                                    updateEventProjects(existingEvent.id, projects);
                                }
                            }}
                        />
                    </div>
                    
                    <div>
                        <label htmlFor="reminder" className="block text-sm font-medium mb-1">Reminder</label>
                        <Button
                            id="reminder"
                            type="button"
                            variant="outline"
                            className={cn(
                                "w-full flex items-center justify-center gap-2 h-10",
                                hasReminder && "bg-primary/10 border-primary text-primary"
                            )}
                            onClick={() => {
                                setReminderDate(format(startDate, "yyyy-MM-dd"));
                                setIsReminderDialogOpen(true);
                            }}
                        >
                            <Bell className="h-4 w-4" />
                            <span>{hasReminder ? formatReminderDisplay() : "Set Reminder"}</span>
                        </Button>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Location</label>
                    <LocationInput
                        value={locationData}
                        onChange={(data) => setLocationData(data)}
                        placeholder="Add Location"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Invitees</label>
                    <div className="flex space-x-2">
                        <input
                            type="email"
                            value={inviteInput}
                            onChange={(e) => setInviteInput(e.target.value)}
                            className="flex-1 rounded-md border px-3 h-10 bg-background text-foreground placeholder:text-gray-400"
                            placeholder="Add Email Address"
                        />
                        <Button
                            type="button"
                            onClick={() => {
                                if (inviteInput && !invitees.includes(inviteInput)) {
                                    setInvitees([...invitees, inviteInput]);
                                    setInviteInput("");
                                }
                            }}
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

                <div className="flex justify-between space-x-2 pt-2">
                    {existingEvent && onDelete && (
                        <Button
                            type="button"
                            onClick={handleDelete}
                            variant="destructive"
                        >
                            Delete
                        </Button>
                    )}
                    <div className="flex justify-end space-x-2 ml-auto">
                        <Button
                            type="button"
                            onClick={() => {
                                if (onCancel) {
                                    onCancel();
                                }
                                setIsOpen(false);
                            }}
                            variant="outline"
                        >
                            Cancel
                        </Button>
                        <Button type="submit">
                            {createEvent.isPending || updateEvent.isPending ? "Saving..." : "Save"}
                        </Button>
                    </div>
                </div>
            </form>
            
            <ReminderDialog
                isOpen={isReminderDialogOpen}
                onClose={() => setIsReminderDialogOpen(false)}
                onSetReminder={handleSetReminder}
            />
            
            <RecurringDialog
                isOpen={isRecurringDialogOpen}
                onClose={() => setIsRecurringDialogOpen(false)}
                onSetRecurring={handleSetRecurring}
            />
        </div>
    )
}
