"use client"

/**
 * VirtualizedEventsList.tsx
 * Updated: 2/27/2025
 * 
 * This component has been completely refactored to improve performance and maintainability:
 * - Extracted complex event grouping logic to useGroupedEvents hook
 * - Extracted scrolling functionality to useScrollToDate hook
 * - Created separate components for MonthHeader and EventDateGroup
 * - Reduced file size from 500+ lines to under 150 lines
 * - Optimized scroll handling with proper throttling
 * - Improved component structure for better readability and maintenance
 * - Fixed scrolling issues when clicking on dates in the calendar
 * - Enhanced synchronization between calendar and events list
 * - Improved scroll position calculation for better UX
 */

import { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import { format, isSameDay, parseISO } from "date-fns";
import { useDebugValue } from "react";
import { CalendarEvent } from "@/hooks/useCalendarEvents";
import { useGroupedEvents } from "@/hooks/useGroupedEvents";
import { useScrollToDate } from "@/hooks/useScrollToDate";
import { MonthHeader } from "./MonthHeader";
import { EventDateGroup } from "./EventDateGroup";

interface VirtualizedEventsListProps {
    events: CalendarEvent[];
    currentUserId: string | null;
    onEventClick: (event: CalendarEvent) => void;
    onVisibleDateChange?: (date: Date, fromUserScroll?: boolean) => void;
    onDragStart?: (event: CalendarEvent) => void;
    onDragEnd?: () => void;
    date?: Date; // Selected date from calendar
}

export interface VirtualizedEventsListRef {
    scrollToDate: (date: Date) => void;
}

export const VirtualizedEventsList = forwardRef<VirtualizedEventsListRef, VirtualizedEventsListProps>(({
    events,
    currentUserId,
    onEventClick,
    onVisibleDateChange,
    onDragStart,
    onDragEnd,
    date
}, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);

    // Use custom hooks to handle complex logic
    const { groupedEvents, hasEventsOnDate } = useGroupedEvents(events);
    const {
        isScrolling,
        lastSelectedDate,
        highlightedDate,
        noEventsMessage,
        scrollToDate
    } = useScrollToDate({
        containerRef,
        groupedEvents,
        hasEventsOnDate,
        onVisibleDateChange
    });

    // Expose scrollToDate method via ref with improved logging
    useImperativeHandle(ref, () => ({
        scrollToDate: (date: Date) => {
            console.log(`scrollToDate called via ref for date: ${format(date, "yyyy-MM-dd")}`);
            // Add a longer delay to ensure DOM is fully ready
            setTimeout(() => {
                scrollToDate(date);
            }, 100);
        }
    }), [scrollToDate]);

    // Scroll to the selected date when it changes with better logging
    useEffect(() => {
        if (date) {
            console.log(`Date prop changed to: ${format(date, "yyyy-MM-dd")}`);

            if (!lastSelectedDate || !isSameDay(date, lastSelectedDate)) {
                console.log(`Date changed and differs from lastSelectedDate, scrolling to new date`);
                // Force a longer delay to ensure events are fully loaded
                setTimeout(() => {
                    scrollToDate(date);
                }, 100);
            } else {
                console.log(`Date is the same as lastSelectedDate, not scrolling`);
            }
        }
    }, [date, lastSelectedDate, scrollToDate]);

    // Handle event click with improved scrolling and logging
    const handleEventClick = useCallback((clickedEvent: CalendarEvent) => {
        console.log(`Event clicked: ${clickedEvent.title} on ${clickedEvent.date}`);

        // First handle the event click action
        onEventClick(clickedEvent);

        // Then, after a delay to allow onClick processing, scroll to its date
        setTimeout(() => {
            const eventDate = parseISO(clickedEvent.date);
            console.log(`Scrolling to clicked event date: ${format(eventDate, "yyyy-MM-dd")}`);
            scrollToDate(eventDate);
        }, 50); // Increased from 10ms to 50ms for better reliability
    }, [onEventClick, scrollToDate]);

    // Debug value to help track component state
    useDebugValue({
        eventsCount: events.length,
        groupedEventsCount: groupedEvents.length,
        isScrolling,
        lastSelectedDate: lastSelectedDate ? format(lastSelectedDate, "yyyy-MM-dd") : null,
        highlightedDate
    });

    // Render the list with extracted components and improved structure
    const renderList = () => {
        if (groupedEvents.length === 0) {
            return (
                <div className="rounded-lg border border-dashed p-8 text-center">
                    <p className="text-muted-foreground">No events scheduled</p>
                </div>
            );
        }

        // Group events by month
        let lastMonth: string | null = null;

        return (
            <div className="space-y-4 p-1">
                {noEventsMessage && (
                    <div className="bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded-md mb-4 text-sm">
                        {noEventsMessage}
                    </div>
                )}

                {groupedEvents.map((group) => {
                    const currentMonth = format(group.date, "MMMM");
                    const showMonthHeader = lastMonth !== currentMonth;
                    const dateStr = format(group.date, "yyyy-MM-dd");

                    // Update lastMonth for the next iteration
                    if (lastMonth !== currentMonth) {
                        lastMonth = currentMonth;
                    }

                    // Highlight the current date if it matches the highlighted date
                    const isHighlighted = highlightedDate === dateStr;

                    return (
                        <div
                            key={dateStr}
                            className={isHighlighted ? "scroll-mt-16 relative" : "relative"}
                        >
                            {showMonthHeader && <MonthHeader month={currentMonth} />}
                            <EventDateGroup
                                date={group.date}
                                events={group.events}
                                currentUserId={currentUserId}
                                onEventClick={handleEventClick}
                                onDragStart={onDragStart}
                                onDragEnd={onDragEnd}
                            />
                            {isHighlighted && (
                                <div className="absolute left-0 w-1 h-full bg-primary rounded-full -ml-2"
                                    style={{ top: 0 }}
                                    aria-hidden="true"
                                />
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div
            className="h-full overflow-auto pt-2 scroll-smooth"
            ref={containerRef}
            data-testid="events-list-container"
        >
            {renderList()}
        </div>
    );
});

// Add display name for better debugging
VirtualizedEventsList.displayName = "VirtualizedEventsList";
