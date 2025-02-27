"use client";

/**
 * sidebar-right.tsx
 * Updated: 2/26/2025
 * 
 * This component has been updated to include React DnD for drag-and-drop functionality
 * and calendar view options (month and day) using the new view selector component.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import * as ReactDOM from "react-dom/client";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Sidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { EventsList } from "./events-list";
import { EventForm, EventData } from "./EventForm";
import { useCalendarEvents, useUpdateEvent } from "@/hooks/useCalendarEvents";
import { Database } from "@/lib/database.types";
import { format, isSameDay, parseISO } from "date-fns";
import { ChevronDown, ChevronUp, Calendar, ChevronLeft, ChevronRight, MessageSquare, Plus } from "lucide-react";
import { useQueryClient, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuth, supabase } from "@/lib/auth";
import { AIProjectAssistant } from "./AIProjectAssistant";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarViewSelector, CalendarViewType } from "./CalendarViewSelector";
import { MonthView } from "./MonthView";
import { DayView } from "./DayView";
import { useUpdateEventDate } from "@/hooks/useUpdateEventDate";
import { useToast, ToastProvider } from "@/components/ui/use-toast";

export function SidebarRight() {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [visibleDate, setVisibleDate] = useState<Date>(new Date());
    const [showCalendar, setShowCalendar] = useState(true);
    const [showYearView, setShowYearView] = useState(false);
    const [activeTab, setActiveTab] = useState<string>("calendar");
    const [calendarView, setCalendarView] = useState<CalendarViewType>("month");
    const scrollToDateRef = useRef<((date: Date) => void) | null>(null);
    const isScrollingProgrammatically = useRef(false);
    const queryClient = useQueryClient();
    const { user, loading: authLoading, error: authError } = useAuth();
    const updateEventDateMutation = useUpdateEventDate();
    const { toast } = useToast();

    // Fetch events from the API
    const { data: apiEvents, isLoading, error } = useCalendarEvents(selectedDate);

    // Determine which events to use
    const events = apiEvents || [];

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

        // Force a re-render by setting the selected date
        setSelectedDate(new Date(event.date));
    };

    // Handle event drop on a date
    const handleEventDrop = (event: Database['public']['Tables']['calendar_events']['Row'], newDate: Date) => {
        // Update the event date
        updateEventDateMutation.mutate({
            event,
            newDate
        }, {
            onSuccess: () => {
                toast({
                    title: "Event updated",
                    description: `"${event.title}" moved to ${format(newDate, "MMMM d, yyyy")}`,
                })
            },
            onError: (error) => {
                toast({
                    title: "Error updating event",
                    description: error instanceof Error ? error.message : "An unknown error occurred",
                    variant: "destructive",
                })
            }
        })
    }

    // Handle calendar date selection
    const handleCalendarSelect = useCallback((date: Date) => {
        console.log(`handleCalendarSelect called with date: ${format(date, "yyyy-MM-dd")}`);

        // Check if the date has events
        const dateStr = format(date, "yyyy-MM-dd");
        const hasEvents = events.some(event => {
            const eventDate = parseISO(event.date);
            return format(eventDate, "yyyy-MM-dd") === dateStr;
        });
        console.log(`Selected date ${dateStr} has events: ${hasEvents}`);

        setSelectedDate(date);
        setShowYearView(false);

        // Set flag to indicate we're programmatically scrolling
        isScrollingProgrammatically.current = true;
        console.log("Setting isScrollingProgrammatically to true");

        // Scroll to the selected date in the events list
        if (scrollToDateRef.current) {
            console.log(`Calling scrollToDateRef with date: ${dateStr}`);
            scrollToDateRef.current(date);

            // Reset the flag after a short delay
            setTimeout(() => {
                isScrollingProgrammatically.current = false;
                console.log("Setting isScrollingProgrammatically to false after timeout");
            }, 500);
        } else {
            console.log("scrollToDateRef is not available");
        }
    }, [events]);

    // Handle visible date change from scrolling
    const handleVisibleDateChange = useCallback((date: Date, fromUserScroll: boolean = true) => {
        console.log(`handleVisibleDateChange called with date: ${format(date, "yyyy-MM-dd")}, fromUserScroll: ${fromUserScroll}`);

        // Always update the visible date
        setVisibleDate(date);

        // If this is not from user scrolling (i.e., it's from our programmatic call in VirtualizedEventsList),
        // then we should update the selected date to match what the user clicked in the calendar
        if (!fromUserScroll) {
            console.log(`Updating selected date to match calendar selection: ${format(date, "yyyy-MM-dd")}`);
            setSelectedDate(date);
            return;
        }

        // Only update the selected date if it's from user scrolling
        // and not from programmatic scrolling, calendar selection, or when showing closest date with events
        if (fromUserScroll && !isScrollingProgrammatically.current && !isSameDay(date, selectedDate)) {
            console.log(`Conditions met for potential selected date update: fromUserScroll=${fromUserScroll}, isScrollingProgrammatically=${isScrollingProgrammatically.current}, isSameDay=${isSameDay(date, selectedDate)}`);

            // We don't want to update the selected date when the events list is showing a different date
            // due to the closest date with events logic
            const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
            const visibleDateStr = format(date, "yyyy-MM-dd");
            console.log(`Selected date: ${selectedDateStr}, Visible date: ${visibleDateStr}`);

            // Check if the visible date is actually from user scrolling and not from the closest date logic
            const hasSelectedDateEvents = events.some(event => {
                const eventDate = parseISO(event.date);
                return format(eventDate, "yyyy-MM-dd") === selectedDateStr;
            });
            console.log(`Selected date has events: ${hasSelectedDateEvents}`);

            // Check if the visible date has events
            const hasVisibleDateEvents = events.some(event => {
                const eventDate = parseISO(event.date);
                return format(eventDate, "yyyy-MM-dd") === visibleDateStr;
            });
            console.log(`Visible date has events: ${hasVisibleDateEvents}`);

            // Only update if the selected date doesn't have events
            // We don't want to change from a date with events to a date without events
            if (!hasSelectedDateEvents) {
                // Only update if the visible date has events
                if (hasVisibleDateEvents) {
                    console.log(`Updating selected date to: ${visibleDateStr} (has events)`);
                    setSelectedDate(date);
                } else {
                    console.log(`Not updating selected date - visible date has no events`);
                }
            } else {
                console.log(`Not updating selected date - current date has events`);
            }
        } else {
            console.log(`Not updating selected date - conditions not met`);
        }
    }, [selectedDate, events]);

    // Render the appropriate calendar view based on the current view type
    const renderCalendarView = () => {
        switch (calendarView) {
            case "month":
                return (
                    <MonthView
                        selectedDate={selectedDate}
                        onDateSelect={handleCalendarSelect}
                        events={events}
                        onEventDrop={handleEventDrop}
                    />
                );
            case "day":
                return (
                    <DayView
                        selectedDate={selectedDate}
                        onDateSelect={handleCalendarSelect}
                        events={events}
                        onEventDrop={handleEventDrop}
                    />
                );
            default:
                return null;
        }
    };

    // Function to show the event form dialog
    const showEventForm = () => {
        // Create the dialog element
        const dialog = document.createElement('dialog');
        dialog.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/50';
        dialog.style.border = 'none';
        dialog.style.outline = 'none';
        dialog.style.background = 'transparent';
        dialog.style.padding = '0';
        dialog.style.maxWidth = '100vw';
        dialog.style.maxHeight = '100vh';
        dialog.style.overflow = 'hidden';
        dialog.style.borderRadius = '0';

        // Create the modal content container
        const modalContent = document.createElement('div');
        modalContent.className = 'bg-background rounded-lg shadow-lg w-full max-w-md relative';
        modalContent.style.border = 'none';
        modalContent.style.overflow = 'hidden';

        // Create a container for the form
        const formWrapper = document.createElement('div');
        formWrapper.id = 'event-form-container';
        modalContent.appendChild(formWrapper);

        // We're removing the X button since we have a Cancel button in the form

        dialog.appendChild(modalContent);
        document.body.appendChild(dialog);

        // Create a new QueryClient instance for the dialog
        const dialogQueryClient = new QueryClient({
            defaultOptions: {
                queries: {
                    staleTime: 5 * 60 * 1000, // 5 minutes
                    refetchOnWindowFocus: false,
                    retry: 1,
                },
                mutations: {
                    retry: 1,
                },
            },
        });

        // Render the EventForm into the container, wrapped in QueryClientProvider and ToastProvider
        const root = ReactDOM.createRoot(document.getElementById('event-form-container') as HTMLElement);
        root.render(
            <QueryClientProvider client={dialogQueryClient}>
                <ToastProvider>
                    <EventForm
                        selectedDate={selectedDate}
                        onEventAdded={(event) => {
                            handleEventAdded(event);
                            dialog.close();
                        }}
                        onCancel={() => dialog.close()}
                        alwaysShowForm={true}
                    />
                </ToastProvider>
            </QueryClientProvider>
        );

        dialog.showModal();

        // Clean up when dialog is closed
        dialog.addEventListener('close', () => {
            document.body.removeChild(dialog);
        });
    };

    return (
        <DndProvider backend={HTML5Backend}>
            <Sidebar side="right" className="transition-none overflow-hidden" style={{ width: "320px" }}>
                <div className="flex h-full flex-col overflow-hidden bg-background">
                    <Tabs defaultValue="calendar" value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                        <TabsList className="grid grid-cols-2 mx-4 mt-2">
                            <TabsTrigger value="calendar" className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>Calendar</span>
                            </TabsTrigger>
                            <TabsTrigger value="assistant" className="flex items-center gap-1">
                                <MessageSquare className="h-4 w-4" />
                                <span>Assistant</span>
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="calendar" className="flex-1 flex flex-col overflow-hidden">
                            <div className="flex-none">
                                <div className="flex flex-col p-2 relative">
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

                                    <div className="flex items-center justify-between mb-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleCalendarSelect(new Date())}
                                            className="flex items-center gap-1"
                                        >
                                            <Calendar className="h-4 w-4" />
                                            <span>Today</span>
                                        </Button>

                                        <div className="flex items-center justify-center">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="p-0 h-8 w-8"
                                                onClick={() => {
                                                    const prevMonth = new Date(selectedDate);
                                                    prevMonth.setMonth(prevMonth.getMonth() - 1);
                                                    handleCalendarSelect(prevMonth);
                                                }}
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </Button>

                                            <div className="relative">
                                                <Button
                                                    variant="ghost"
                                                    className="mx-0 font-bold px-1"
                                                    onClick={() => setShowYearView(!showYearView)}
                                                >
                                                    {format(selectedDate, "MMMM yyyy")}
                                                </Button>

                                                {/* Year view popup */}
                                                {showYearView && (
                                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 bg-background border rounded-md shadow-md z-30 p-2 w-64">
                                                        <div className="flex justify-between items-center mb-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => {
                                                                    const prevYear = new Date(selectedDate);
                                                                    prevYear.setFullYear(prevYear.getFullYear() - 1);
                                                                    handleCalendarSelect(prevYear);
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
                                                                    handleCalendarSelect(nextYear);
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
                                                                            handleCalendarSelect(newDate);
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
                                                size="icon"
                                                className="p-0 h-8 w-8"
                                                onClick={() => {
                                                    const nextMonth = new Date(selectedDate);
                                                    nextMonth.setMonth(nextMonth.getMonth() + 1);
                                                    handleCalendarSelect(nextMonth);
                                                }}
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="p-0 h-8 w-8"
                                                onClick={showEventForm}
                                            >
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>

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
                                    </div>

                                    <div className={`${showCalendar ? 'block' : 'hidden'} relative z-20 bg-background h-[300px] overflow-auto mb-0`}>
                                        {renderCalendarView()}
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col overflow-hidden mt-[-20px]">
                                {isLoading ? (
                                    <div className="flex items-center justify-center py-4">
                                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                    </div>
                                ) : (
                                    <div className="p-0 space-y-4 flex-1 flex flex-col overflow-hidden">
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
                                                    onVisibleDateChange={handleVisibleDateChange}
                                                    scrollToDateRef={scrollToDateRef}
                                                />
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="assistant" className="flex-1 overflow-hidden p-2">
                            <AIProjectAssistant />
                        </TabsContent>
                    </Tabs>
                </div>
            </Sidebar>
        </DndProvider>
    );
}
