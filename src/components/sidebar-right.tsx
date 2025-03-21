"use client";

/**
 * sidebar-right.tsx
 * Updated: 3/4/2025
 * 
 * This component has been updated to:
 * - Remove the AI assistant tab (now using expandable chat in header)
 * - Focus solely on calendar functionality
 * - Match width with left sidebar and align headers properly
 * - Change events list to only show events for the selected date
 * - Keep calendar view options (month and day)
 * - Simplify events list to only display events for selected date
 * - Improve overall design and user experience
 * - Add consistent horizontal spacing and alignment
 */

import { useState, useRef, useEffect, useCallback } from "react";
import * as ReactDOM from "react-dom/client";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Sidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EventsList } from "./events-list";
import { EventForm, EventData } from "./EventForm";
import { useCalendarEvents, useUpdateEvent } from "@/hooks/useCalendarEvents";
import { Database } from "@/lib/database.types";
import { format, isSameDay, parseISO } from "date-fns";
import { ChevronDown, ChevronUp, Calendar, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useQueryClient, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuth, supabase } from "@/lib/auth";
import { Separator } from "@/components/ui/separator";
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
    const { data: events, isLoading, error } = useCalendarEvents();
    const { toast } = useToast();
    const [showEventForm, setShowEventForm] = useState(false);
    const [draggedEvent, setDraggedEvent] = useState<Database["public"]["Tables"]["calendar_events"]["Row"] | null>(null);

    // Handle calendar date selection with improved logging and error handling
    const handleCalendarSelect = useCallback((date: Date) => {
        console.log(`handleCalendarSelect called with date: ${format(date, "yyyy-MM-dd")}`);

        try {
            // Check if the selected date has events
            const hasEvents = events?.some(event => {
                const eventDate = parseISO(event.date);
                return isSameDay(eventDate, date);
            });

            console.log(`Selected date ${format(date, "yyyy-MM-dd")} has events: ${hasEvents}`);

            // Update the selected date
            setSelectedDate(date);

            // Set the flag to indicate we're programmatically scrolling
            isScrollingProgrammatically.current = true;
            console.log(`Setting isScrollingProgrammatically to true`);

            // Scroll to the selected date
            if (scrollToDateRef.current) {
                try {
                    console.log(`Calling scrollToDateRef with date: ${format(date, "yyyy-MM-dd")}`);
                    scrollToDateRef.current(date);

                    // Reset the flag after a longer delay to ensure scrolling completes
                    setTimeout(() => {
                        isScrollingProgrammatically.current = false;
                        console.log("Setting isScrollingProgrammatically to false after timeout");
                    }, 800); // Increased from 500ms to 800ms for better reliability
                } catch (error) {
                    console.error("Error calling scrollToDateRef:", error);
                    isScrollingProgrammatically.current = false;
                }
            } else {
                console.log("scrollToDateRef is not available");
                isScrollingProgrammatically.current = false;
            }
        } catch (error) {
            console.error("Error in handleCalendarSelect:", error);
            isScrollingProgrammatically.current = false;
        }
    }, [events, scrollToDateRef]);

    // Handle visible date change from events list with improved logging
    const handleVisibleDateChange = useCallback((date: Date, fromUserScroll?: boolean) => {
        console.log(`handleVisibleDateChange called with date: ${format(date, "yyyy-MM-dd")}, fromUserScroll: ${fromUserScroll}`);

        // If this is from a programmatic scroll, we don't need to update the selected date
        if (isScrollingProgrammatically.current) {
            console.log("Ignoring visible date change during programmatic scrolling");
            return;
        }

        // Always update the selected date to match the visible date in the events list
        console.log(`Updating selected date to match calendar selection: ${format(date, "yyyy-MM-dd")}`);
        setSelectedDate(date);
    }, []);

    // Handle event drop on a date
    const handleEventDrop = useCallback((event: Database["public"]["Tables"]["calendar_events"]["Row"], newDate: Date) => {
        // Update the event date
        const updateEventDate = async () => {
            try {
                // Create a new date with the same time as the original event
                const originalDate = parseISO(event.date);
                const updatedDate = new Date(newDate);
                updatedDate.setHours(originalDate.getHours(), originalDate.getMinutes(), originalDate.getSeconds());

                // Update the event
                const { data, error } = await supabase
                    .from("calendar_events")
                    .update({ date: updatedDate.toISOString() })
                    .eq("id", event.id);

                if (error) {
                    throw error;
                }

                // Invalidate the events query to refetch the data
                queryClient.invalidateQueries({ queryKey: ["calendar_events"] });

                // Show success toast
                toast({
                    title: "Event updated",
                    description: `${event.title} moved to ${format(newDate, "MMMM d, yyyy")}`,
                });
            } catch (error) {
                console.error("Error updating event date:", error);
                toast({
                    title: "Error",
                    description: "Failed to update event date",
                    variant: "destructive",
                });
            }
        };

        updateEventDate();
    }, [queryClient, toast]);

    // Handle event form submission
    const handleEventSubmit = useCallback((eventData: EventData) => {
        setShowEventForm(false);

        // Show success toast
        toast({
            title: "Event created",
            description: `${eventData.title} scheduled for ${format(new Date(eventData.date), "MMMM d, yyyy")}`,
        });

        // Invalidate the events query to refetch the data
        queryClient.invalidateQueries({ queryKey: ["calendar_events"] });
    }, [queryClient, toast]);

    // Render the calendar view based on the selected view type
    const renderCalendarView = useCallback(() => {
        if (calendarView === "month") {
            return (
                <MonthView
                    selectedDate={selectedDate}
                    onDateSelect={handleCalendarSelect}
                    events={events || []}
                    onEventDrop={handleEventDrop}
                />
            );
        } else if (calendarView === "day") {
            return (
                <DayView
                    selectedDate={selectedDate}
                    onDateSelect={handleCalendarSelect}
                    events={events || []}
                />
            );
        }
    }, [calendarView, selectedDate, events, handleCalendarSelect, handleEventDrop]);

    // Show event form
    const showEventFormHandler = useCallback(() => {
        setShowEventForm(true);
    }, []);

    // No longer need to check for browser environment since DndProvider is now at the AppLayoutWithCalendar level
    return (
        <>
            <Sidebar
                side="right"
                className="border-1"
                style={{
                    zIndex: 10, // Ensure proper stacking with main content
                    width: 'var(--sidebar-right-width)' // Use CSS variable for width
                }}
            >
                <div className="flex flex-col gap-0 p-0 px-1">
                    <div className="h-full flex flex-col">
                        <div className="flex items-center justify-between border-b h-[64px] pt-0 pb-0 px-2">
                            <div className="flex items-center h-full">
                                <h2 className="text-xl font-bold flex items-center">
                                    <Calendar className="h-5 w-5 mr-2" />
                                    Calendar
                                </h2>
                            </div>
                        </div>

                        <div className="flex-1 overflow-hidden flex flex-col">
                            <div className="flex-1 overflow-hidden">
                                {/* Calendar section with higher z-index to ensure buttons are clickable */}
                                <div className="pt-4 pb-0 px-2 mb-0 flex flex-col w-full" style={{ position: 'relative', zIndex: 40 }}>
                                    <div className="calendar-section flex flex-col">
                                        <div className="flex items-center justify-between mb-0">
                                            <div className="flex flex-col">
                                                <h2 className="text-xl font-bold">
                                                    {format(selectedDate, "MMMM yyyy")}
                                                </h2>
                                                <div className="mt-2">
                                                    <CalendarViewSelector
                                                        currentView={calendarView}
                                                        onViewChange={setCalendarView}
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex items-center space-x-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="p-0 h-8 w-8 calendar-nav-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        console.log("Previous month button clicked");
                                                        const prevMonth = new Date(selectedDate);
                                                        prevMonth.setMonth(prevMonth.getMonth() - 1);
                                                        handleCalendarSelect(prevMonth);
                                                    }}
                                                    aria-label="Previous month"
                                                    style={{ position: 'relative', zIndex: 45 }}
                                                >
                                                    <ChevronLeft className="h-4 w-4" />
                                                </Button>

                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="p-0 h-8 w-8 calendar-nav-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        console.log("Next month button clicked");
                                                        const nextMonth = new Date(selectedDate);
                                                        nextMonth.setMonth(nextMonth.getMonth() + 1);
                                                        handleCalendarSelect(nextMonth);
                                                    }}
                                                    aria-label="Next month"
                                                    style={{ position: 'relative', zIndex: 45 }}
                                                >
                                                    <ChevronRight className="h-4 w-4" />
                                                </Button>

                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="p-0 h-8 w-8 ml-1 calendar-nav-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        console.log("Add event button clicked");
                                                        showEventFormHandler();
                                                    }}
                                                    aria-label="Add event"
                                                    style={{ position: 'relative', zIndex: 45 }}
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                            </div>

                                            <div style={{ position: 'relative', zIndex: 50 }}>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="calendar-toggle-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        console.log(`Toggle calendar button clicked. Current state: ${showCalendar}, new state: ${!showCalendar}`);
                                                        setShowCalendar(!showCalendar);
                                                    }}
                                                    aria-label={showCalendar ? "Collapse calendar" : "Expand calendar"}
                                                    aria-expanded={showCalendar}
                                                >
                                                    {showCalendar ? (
                                                        <ChevronUp className="h-4 w-4" />
                                                    ) : (
                                                        <ChevronDown className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Always render the calendar but hide it when collapsed */}
                                        <div
                                            className="calendar-container flex-shrink-0"
                                            style={{
                                                position: 'relative',
                                                zIndex: 20,
                                                backgroundColor: 'var(--background)',
                                                height: showCalendar ? 'auto' : '0',
                                                opacity: showCalendar ? 1 : 0,
                                                overflow: 'hidden',
                                                marginBottom: 0,
                                                width: '100%',
                                                padding: '0',
                                                boxSizing: 'border-box',
                                                transition: 'height 0.2s ease, opacity 0.2s ease'
                                            }}
                                        >
                                            {renderCalendarView()}
                                        </div>
                                    </div>
                                </div>

                                {/* Separator with flexible spacing that adjusts to calendar size */}
                                <div className="px-2 my-4 flex-shrink-0">
                                    <Separator className="w-[calc(100%-8px)] mx-auto z-10" />
                                </div>

                                {/* Events container with flexible spacing */}
                                <div
                                    className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col gap-0 px-0 day-events-container"
                                    style={{
                                        position: 'relative',
                                        zIndex: 30,
                                        width: '100%',
                                        boxSizing: 'border-box'
                                    }}
                                >
                                    {isLoading ? (
                                        <div className="flex items-center justify-center py-4">
                                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                        </div>
                                    ) : (
                                        <div className="p-0 space-y-0 flex-1 flex flex-col overflow-y-auto overflow-x-hidden">
                                            <div className="flex-1 overflow-y-auto overflow-x-hidden w-full">
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
                                                    <div className="h-full flex flex-col gap-0 w-full" data-testid="events-list-wrapper">
                                                        <EventsList
                                                            key={selectedDate.toISOString()}
                                                            date={selectedDate}
                                                            events={events || []}
                                                            onVisibleDateChange={handleVisibleDateChange}
                                                            scrollToDateRef={scrollToDateRef}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Sidebar>
            
            {/* Event Form Dialog - Using proper Dialog component */}
            <Dialog 
                open={showEventForm} 
                onOpenChange={(open: boolean) => {
                    // Only update state if it's different to avoid infinite loop
                    if (open !== showEventForm) {
                        setShowEventForm(open);
                    }
                }}
            >
                <DialogContent className="sm:max-w-md dialog-transition">
                    <DialogHeader>
                        <DialogTitle>Add Event</DialogTitle>
                    </DialogHeader>
                    <EventForm
                        selectedDate={selectedDate}
                        onEventAdded={handleEventSubmit}
                        onCancel={() => setShowEventForm(false)}
                        alwaysShowForm={true}
                    />
                </DialogContent>
            </Dialog>
        </>
    );
}
