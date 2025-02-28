"use client";

/**
 * sidebar-right.tsx
 * Updated: 2/27/2025
 * 
 * This component has been updated to:
 * - Match width with left sidebar and align headers properly
 * - Change events list to only show events for the selected date (removed scroll sync)
 * - Keep calendar view options (month and day)
 * - Simplify events list to only display events for selected date
 * - Improve overall design and user experience
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

    return (
        <DndProvider backend={HTML5Backend}>
            <Sidebar
                side="right"
                className="border-l"
            >
                <div className="flex flex-col gap-4 p-4">
                    <Tabs
                        defaultValue="calendar"
                        value={activeTab}
                        onValueChange={setActiveTab}
                        className="h-full flex flex-col"
                    >
                        <div className="flex items-center gap-2 border-b pb-4">
                            <div className="w-full">
                                <TabsList className="grid grid-cols-2">
                                    <TabsTrigger value="calendar" className="text-sm">
                                        <Calendar className="h-4 w-4 mr-2" />
                                        Calendar
                                    </TabsTrigger>
                                    <TabsTrigger value="assistant" className="text-sm">
                                        <MessageSquare className="h-4 w-4 mr-2" />
                                        Assistant
                                    </TabsTrigger>
                                </TabsList>
                            </div>
                        </div>

                        <TabsContent value="calendar" className="flex-1 overflow-hidden flex flex-col">
                            <div className="flex-1 overflow-hidden">
                                <div className="pb-0 px-0 mb-0">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center space-x-2">
                                            <h2 className="text-xl font-bold">
                                                {format(selectedDate, "MMMM yyyy")}
                                            </h2>
                                            <CalendarViewSelector
                                                currentView={calendarView}
                                                onViewChange={setCalendarView}
                                            />
                                        </div>

                                        <div className="flex items-center space-x-1">
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

                                            {showYearView && (
                                                <div className="flex items-center space-x-1 overflow-x-auto max-w-[200px] scrollbar-hide">
                                                    {Array.from({ length: 12 }, (_, i) => {
                                                        const monthDate = new Date(selectedDate);
                                                        monthDate.setMonth(i);
                                                        return monthDate;
                                                    }).map((monthDate) => (
                                                        <Button
                                                            key={format(monthDate, "MMM")}
                                                            variant={isSameDay(
                                                                new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1),
                                                                new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
                                                            ) ? "default" : "ghost"}
                                                            size="sm"
                                                            className="px-2 py-1 h-auto text-xs"
                                                            onClick={() => handleCalendarSelect(monthDate)}
                                                        >
                                                            {format(monthDate, "MMM")}
                                                        </Button>
                                                    ))}
                                                </div>
                                            )}

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
                                                className="p-0 h-8 w-8 ml-1"
                                                onClick={showEventFormHandler}
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

                                    <div className={`${showCalendar ? 'block' : 'hidden'} relative z-20 bg-background h-[300px] overflow-hidden mb-0 calendar-widget w-full max-w-full`}>
                                        {renderCalendarView()}
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto overflow-x-hidden -mt-4 flex flex-col gap-0 max-w-full">
                                    {isLoading ? (
                                        <div className="flex items-center justify-center py-4">
                                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                        </div>
                                    ) : (
                                        <div className="p-0 space-y-0 flex-1 flex flex-col overflow-y-auto overflow-x-hidden">
                                            <div className="flex-1 overflow-y-auto overflow-x-hidden max-w-full">
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
                                                    <div className="h-full flex flex-col gap-0 max-w-full" data-testid="events-list-wrapper">
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
                        </TabsContent>

                        <TabsContent value="assistant" className="flex-1 overflow-hidden p-2">
                            <AIProjectAssistant />
                        </TabsContent>
                    </Tabs>
                </div>
            </Sidebar>

            {/* Event Form Dialog */}
            {showEventForm && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
                    onClick={(e) => {
                        // Close when clicking the overlay
                        if (e.target === e.currentTarget) {
                            setShowEventForm(false);
                        }
                    }}
                >
                    <div className="bg-background rounded-lg shadow-lg border border-border w-full max-w-md">
                        <EventForm
                            selectedDate={selectedDate}
                            onEventAdded={handleEventSubmit}
                            onCancel={() => setShowEventForm(false)}
                            alwaysShowForm={true}
                        />
                    </div>
                </div>
            )}
        </DndProvider>
    );
}
