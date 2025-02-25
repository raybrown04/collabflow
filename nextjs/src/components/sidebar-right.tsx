"use client";

import { useState, useRef, useEffect } from "react";
import { Sidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { CalendarWidget } from "./calendar-widget";
import { EventsList } from "./events-list";
import { EventForm, EventData } from "./EventForm";
import { useCalendarEvents, CalendarEvent } from "@/hooks/useCalendarEvents";
import { addDays, addHours, format, startOfToday } from "date-fns";
import { Database } from "@/lib/database.types";
import { ChevronDown, ChevronUp, Calendar, ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth, supabase } from "@/lib/auth";

// Temporary test data
const today = startOfToday()
const testEvents: Database['public']['Tables']['calendar_events']['Row'][] = [
    {
        id: "1",
        title: "Team Standup",
        date: addHours(today, 10).toISOString(),
        description: "Daily team sync meeting",
        type: "meeting",
        user_id: "b9b36d04-59e0-49d7-83ff-46c5186a8cf4", // Use actual UUID format
        created_at: new Date().toISOString()
    },
    {
        id: "2",
        title: "Project Review",
        date: addHours(today, 14).toISOString(),
        description: "Q1 project progress review",
        type: "meeting",
        user_id: "b9b36d04-59e0-49d7-83ff-46c5186a8cf4",
        created_at: new Date().toISOString()
    },
    {
        id: "3",
        title: "Submit Report",
        date: addHours(addDays(today, 1), 11).toISOString(),
        description: null,
        type: "task",
        user_id: "b9b36d04-59e0-49d7-83ff-46c5186a8cf4",
        created_at: new Date().toISOString()
    },
    {
        id: "4",
        title: "Dentist Appointment",
        date: addHours(addDays(today, 2), 15).toISOString(),
        description: "Regular checkup",
        type: "reminder",
        user_id: "b9b36d04-59e0-49d7-83ff-46c5186a8cf4",
        created_at: new Date().toISOString()
    },
    {
        id: "5",
        title: "Baby Ray's Birthday Party",
        date: addHours(addDays(today, 8), 11).toISOString(),
        description: null,
        type: "reminder",
        user_id: "b9b36d04-59e0-49d7-83ff-46c5186a8cf4",
        created_at: new Date().toISOString()
    },
    {
        id: "6",
        title: "Shot",
        date: addHours(addDays(today, 10), 12).toISOString(),
        description: null,
        type: "meeting",
        user_id: "b9b36d04-59e0-49d7-83ff-46c5186a8cf4",
        created_at: new Date().toISOString()
    },
    {
        id: "7",
        title: "Urology Appt",
        date: addHours(addDays(today, 10), 9.5).toISOString(),
        description: null,
        type: "task",
        user_id: "b9b36d04-59e0-49d7-83ff-46c5186a8cf4",
        created_at: new Date().toISOString()
    },
    {
        id: "8",
        title: "Dupixent Shot",
        date: addHours(addDays(today, 10), 12).toISOString(),
        description: null,
        type: "reminder",
        user_id: "b9b36d04-59e0-49d7-83ff-46c5186a8cf4",
        created_at: new Date().toISOString()
    }
];

export function SidebarRight() {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [sidebarWidth, setSidebarWidth] = useState(320);
    const [isResizing, setIsResizing] = useState(false);
    const [showCalendar, setShowCalendar] = useState(true);
    const [showYearView, setShowYearView] = useState(false);
    const resizeHandleRef = useRef<HTMLDivElement>(null);
    const queryClient = useQueryClient();
    const { user, loading: authLoading, error: authError } = useAuth();

    // Fetch events from the API
    const { data: apiEvents, isLoading, error } = useCalendarEvents(selectedDate);

    // Use local events as a fallback if API fails due to authentication issues
    const [localEvents, setLocalEvents] = useState<CalendarEvent[]>(testEvents);

    // Determine which events to use - API events if available, otherwise local events
    const events = apiEvents || localEvents;

    // Handle logout
    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
            // Redirect to login page
            window.location.href = '/auth/login';
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    // Handle event added from the form
    const handleEventAdded = (event: EventData) => {
        console.log("New event added:", event);

        // If we're using local events (API failed), update the local state
        if (!apiEvents) {
            setLocalEvents(prev => {
                const newEvents = [...prev, event];
                console.log("Updated local events:", newEvents);
                return newEvents;
            });
        } else {
            // If using API events, the React Query cache will be updated automatically
            // by the useCreateEvent hook's onSuccess callback
            console.log("API events updated via React Query");
        }

        // Force a re-render by setting the selected date
        setSelectedDate(new Date(event.date));
    };

    useEffect(() => {
        const handleMouseDown = (e: MouseEvent) => {
            setIsResizing(true);
            e.preventDefault();
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return;

            // Calculate new width based on mouse position
            // We're subtracting from window.innerWidth because the sidebar is on the right
            const newWidth = Math.max(280, Math.min(600, window.innerWidth - e.clientX));
            setSidebarWidth(newWidth);
        };

        const handleMouseUp = () => {
            setIsResizing(false);
        };

        const resizeHandle = resizeHandleRef.current;
        if (resizeHandle) {
            resizeHandle.addEventListener('mousedown', handleMouseDown);
        }

        if (isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            if (resizeHandle) {
                resizeHandle.removeEventListener('mousedown', handleMouseDown);
            }
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing]);

    return (
        <>
            <div
                ref={resizeHandleRef}
                className="absolute top-0 bottom-0 w-1 bg-transparent hover:bg-gray-300 cursor-col-resize z-10"
                style={{ left: `calc(100% - ${sidebarWidth}px - 2px)` }}
            />
            <Sidebar side="right" className="transition-none overflow-hidden" style={{ width: `${sidebarWidth}px` }}>
                <div className="flex h-full flex-col overflow-hidden">
                    <div className="flex-none border-b">
                        <div className="flex items-center justify-between p-2 relative">
                            {/* Auth status indicator */}
                            {authLoading ? (
                                <div className="absolute top-0 left-0 right-0 h-1">
                                    <div className="h-full bg-primary/50 animate-pulse"></div>
                                </div>
                            ) : authError ? (
                                <div className="absolute top-0 left-0 right-0 h-1 bg-red-500"></div>
                            ) : user ? (
                                <div className="absolute top-0 left-0 right-0 h-1 bg-green-500"></div>
                            ) : (
                                <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500"></div>
                            )}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedDate(new Date())}
                                className="flex items-center gap-1"
                            >
                                <Calendar className="h-4 w-4" />
                                <span>Today</span>
                            </Button>

                            <div className="flex items-center">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        const prevMonth = new Date(selectedDate);
                                        prevMonth.setMonth(prevMonth.getMonth() - 1);
                                        setSelectedDate(prevMonth);
                                    }}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>

                                <div className="relative">
                                    <Button
                                        variant="ghost"
                                        className="mx-2 font-bold"
                                        onClick={() => setShowYearView(!showYearView)}
                                    >
                                        {format(selectedDate, "MMMM yyyy")}
                                    </Button>

                                    {/* Year view popup */}
                                    {showYearView && (
                                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 bg-background border rounded-md shadow-md z-10 p-2 w-64">
                                            <div className="flex justify-between items-center mb-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        const prevYear = new Date(selectedDate);
                                                        prevYear.setFullYear(prevYear.getFullYear() - 1);
                                                        setSelectedDate(prevYear);
                                                    }}
                                                >
                                                    <ChevronLeft className="h-4 w-4" />
                                                </Button>

                                                <span className="font-bold">{format(selectedDate, "yyyy")}</span>

                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        const nextYear = new Date(selectedDate);
                                                        nextYear.setFullYear(nextYear.getFullYear() + 1);
                                                        setSelectedDate(nextYear);
                                                    }}
                                                >
                                                    <ChevronRight className="h-4 w-4" />
                                                </Button>
                                            </div>

                                            <div className="grid grid-cols-4 gap-2">
                                                {Array.from({ length: 12 }, (_, i) => {
                                                    const monthDate = new Date(selectedDate);
                                                    monthDate.setMonth(i);
                                                    return (
                                                        <Button
                                                            key={i}
                                                            variant={selectedDate.getMonth() === i ? "default" : "ghost"}
                                                            size="sm"
                                                            className="text-xs"
                                                            onClick={() => {
                                                                const newDate = new Date(selectedDate);
                                                                newDate.setMonth(i);
                                                                setSelectedDate(newDate);
                                                                setShowYearView(false);
                                                            }}
                                                        >
                                                            {format(monthDate, "MMM")}
                                                        </Button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                </div>

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        const nextMonth = new Date(selectedDate);
                                        nextMonth.setMonth(nextMonth.getMonth() + 1);
                                        setSelectedDate(nextMonth);
                                    }}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowCalendar(!showCalendar)}
                                >
                                    {showCalendar ? (
                                        <ChevronUp className="h-4 w-4" />
                                    ) : (
                                        <ChevronDown className="h-4 w-4" />
                                    )}
                                </Button>

                                {user && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleLogout}
                                        title="Logout"
                                    >
                                        <LogOut className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>

                        {showCalendar && (
                            <div>
                                <CalendarWidget
                                    selectedDate={selectedDate}
                                    onDateSelect={(date) => {
                                        setSelectedDate(date);
                                        setShowYearView(false);
                                    }}
                                    events={events}
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex-1 flex flex-col overflow-hidden">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-4">
                                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                            </div>
                        ) : (
                            <div className="p-4 space-y-4 flex-1 flex flex-col overflow-hidden">
                                <EventForm
                                    selectedDate={selectedDate}
                                    onEventAdded={handleEventAdded}
                                />
                                <div className="flex-1 overflow-hidden">
                                    {error ? (
                                        <div className="p-4 text-red-500">
                                            <p>Error loading events: {error instanceof Error ? error.message : 'Unknown error'}</p>
                                            <p className="text-sm mt-2">Using local events as fallback.</p>
                                            {!user && (
                                                <div className="mt-4">
                                                    <p className="font-medium">Authentication Required</p>
                                                    <p className="text-sm mt-1">Please log in to access your calendar events.</p>
                                                    <Button
                                                        className="mt-2"
                                                        size="sm"
                                                        onClick={() => window.location.href = '/auth/login'}
                                                    >
                                                        Go to Login
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <EventsList
                                            date={selectedDate}
                                            events={events}
                                        />
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </Sidebar>
        </>
    );
}
