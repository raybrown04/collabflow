"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { format, parseISO, startOfDay, isSameDay, addDays } from "date-fns"
import { Database } from "@/lib/database.types"
import { DraggableEventCard } from "./DraggableEventCard"

// Extend the base CalendarEvent type to include our new fields
type CalendarEvent = Database['public']['Tables']['calendar_events']['Row'] & {
    end_date?: string;
    is_all_day?: boolean;
    location?: string;
    invitees?: string[];
    multiDayContinuation?: boolean; // Flag for events that span multiple days
}

interface VirtualizedEventsListProps {
    events: CalendarEvent[]
    currentUserId: string | null
    onEventClick: (event: CalendarEvent) => void
    onVisibleDateChange?: (date: Date, fromUserScroll?: boolean) => void
    onDragStart?: (event: CalendarEvent) => void
    onDragEnd?: () => void
    date?: Date // Selected date from calendar
}

interface GroupedEvents {
    date: Date
    events: CalendarEvent[]
}

export function VirtualizedEventsList({
    events,
    currentUserId,
    onEventClick,
    onVisibleDateChange,
    onDragStart,
    onDragEnd,
    date
}: VirtualizedEventsListProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [isScrolling, setIsScrolling] = useState(false)
    const [groupedEvents, setGroupedEvents] = useState<GroupedEvents[]>([])
    const [lastSelectedDate, setLastSelectedDate] = useState<Date | null>(null)
    const [highlightedDate, setHighlightedDate] = useState<string | null>(null)
    const [allDates, setAllDates] = useState<Date[]>([])
    const [noEventsMessage, setNoEventsMessage] = useState<string | null>(null)

    // Group events by date and create a comprehensive date list
    useEffect(() => {
        const eventsByDate = new Map<string, { date: Date, events: CalendarEvent[] }>();
        const dateSet = new Set<string>();

        // Process each event and group by date
        events.forEach(event => {
            const eventStartDate = parseISO(event.date);
            let eventEndDate = event.end_date ? parseISO(event.end_date) : eventStartDate;

            // Create a simple date string (YYYY-MM-DD) as the key for start date
            const startDateKey = format(eventStartDate, "yyyy-MM-dd");
            dateSet.add(startDateKey);

            if (!eventsByDate.has(startDateKey)) {
                eventsByDate.set(startDateKey, {
                    date: startOfDay(eventStartDate),
                    events: []
                });
            }

            // Add event to its start date
            eventsByDate.get(startDateKey)?.events.push(event);

            // If this is a multi-day event, add it to each day it spans
            if (event.end_date && !isSameDay(eventStartDate, eventEndDate)) {
                let currentDate = addDays(eventStartDate, 1);

                // Add event to each day between start and end date
                while (currentDate <= eventEndDate) {
                    const dateKey = format(currentDate, "yyyy-MM-dd");
                    dateSet.add(dateKey);

                    if (!eventsByDate.has(dateKey)) {
                        eventsByDate.set(dateKey, {
                            date: startOfDay(currentDate),
                            events: []
                        });
                    }

                    // Add the same event to this date
                    eventsByDate.get(dateKey)?.events.push({
                        ...event,
                        // Add a flag to indicate this is a continuation of a multi-day event
                        multiDayContinuation: true
                    });

                    currentDate = addDays(currentDate, 1);
                }
            }
        });

        // Convert to array and sort chronologically
        const sortedDates = Array.from(eventsByDate.values())
            .sort((a, b) => a.date.getTime() - b.date.getTime());

        setGroupedEvents(sortedDates);

        // Create a comprehensive list of all dates in the range
        if (sortedDates.length > 0) {
            const allDatesArray: Date[] = [];
            const startDate = sortedDates[0].date;
            const endDate = sortedDates[sortedDates.length - 1].date;

            let currentDate = new Date(startDate);
            while (currentDate <= endDate) {
                allDatesArray.push(new Date(currentDate));
                currentDate = addDays(currentDate, 1);
            }

            setAllDates(allDatesArray);
        }
    }, [events]);

    // Handle scroll events with throttling
    const handleScroll = useCallback(() => {
        if (!onVisibleDateChange || isScrolling || !containerRef.current) return;

        // Find all date elements
        const dateElements = containerRef.current.querySelectorAll('[data-date]');
        if (dateElements.length === 0) return;

        // Get container dimensions
        const containerRect = containerRef.current.getBoundingClientRect();
        const containerTop = containerRect.top;

        // Find the first date element that's visible in the viewport
        let closestElement: Element | null = null;
        let closestDistance = Infinity;

        dateElements.forEach(element => {
            const rect = element.getBoundingClientRect();
            // Calculate distance from the top of the container
            const distance = Math.abs(rect.top - containerTop);

            // If this element is closer to the top than the current closest
            if (distance < closestDistance) {
                closestElement = element;
                closestDistance = distance;
            }
        });

        // If we found a visible date element, update the visible date
        if (closestElement) {
            const dateStr = (closestElement as Element).getAttribute('data-date');
            if (dateStr) {
                const visibleDate = new Date(dateStr);

                // Update highlighted date
                setHighlightedDate(dateStr);

                // Notify parent component with fromUserScroll=true
                onVisibleDateChange(visibleDate, true);
            }
        }
    }, [onVisibleDateChange, isScrolling]);

    // Throttled scroll handler
    const throttledScrollHandler = useCallback(() => {
        if (!containerRef.current) return;

        // Use requestAnimationFrame for smoother performance
        requestAnimationFrame(() => {
            handleScroll();
        });
    }, [handleScroll]);

    // Check if a date has events
    const hasEventsOnDate = useCallback((date: Date) => {
        if (!date) return false;

        const dateStr = format(date, "yyyy-MM-dd");
        const targetDate = startOfDay(date);

        // Check if any event falls on this date
        const hasEvents = events.some(event => {
            const eventStartDate = parseISO(event.date);

            // If it's a single-day event, just check if it's on this date
            if (!event.end_date) {
                return format(eventStartDate, "yyyy-MM-dd") === dateStr;
            }

            // For multi-day events, check if the target date is within the event's date range
            const eventEndDate = parseISO(event.end_date);
            const eventStartDay = startOfDay(eventStartDate);
            const eventEndDay = startOfDay(eventEndDate);

            return targetDate >= eventStartDay && targetDate <= eventEndDay;
        });

        console.log(`Checking if date ${dateStr} has events:`, hasEvents,
            'Available dates:', groupedEvents.map(g => format(g.date, "yyyy-MM-dd")));

        return hasEvents;
    }, [events, groupedEvents]);

    // Scroll to a specific date
    const scrollToDate = useCallback((targetDate: Date) => {
        if (!containerRef.current) return;

        console.log("scrollToDate called with date:", format(targetDate, "yyyy-MM-dd"));

        // Set a flag to indicate we're programmatically scrolling
        // This will prevent handleScroll from updating the visible date
        setIsScrolling(true);

        // Store the target date so we can use it in handleScroll
        setLastSelectedDate(targetDate);

        // Always update the highlighted date to the selected date
        const targetDateStr = format(targetDate, "yyyy-MM-dd");
        setHighlightedDate(targetDateStr);

        // Check if the target date has events
        const hasEvents = hasEventsOnDate(targetDate);
        console.log(`Date ${targetDateStr} has events:`, hasEvents);

        // Find the date element to scroll to
        const dateElement = containerRef.current.querySelector(`[data-date="${targetDateStr}"]`);
        console.log(`Found element for date ${targetDateStr}:`, !!dateElement);

        if (dateElement && hasEvents) {
            console.log(`Scrolling to date with events: ${targetDateStr}`);
            // If the date has events and the element exists, scroll to it
            dateElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setNoEventsMessage(null);

            // Reset scrolling state after animation completes
            setTimeout(() => {
                setIsScrolling(false);

                // Force the visible date to be the target date
                if (onVisibleDateChange) {
                    console.log(`Forcing visible date to be: ${targetDateStr}`);
                    onVisibleDateChange(targetDate, false); // false = not from user scroll
                }
            }, 500);
        } else if (!hasEvents) {
            console.log(`Date ${targetDateStr} has no events, finding closest date`);
            // If the date doesn't have events, find the closest date with events
            const closestDateGroup = groupedEvents.reduce((closest, current) => {
                const currentDiff = Math.abs(current.date.getTime() - targetDate.getTime());
                const closestDiff = closest ? Math.abs(closest.date.getTime() - targetDate.getTime()) : Infinity;
                return currentDiff < closestDiff ? current : closest;
            }, null as GroupedEvents | null);

            if (closestDateGroup) {
                const closestDateStr = format(closestDateGroup.date, "yyyy-MM-dd");
                console.log(`Found closest date with events: ${closestDateStr}`);
                const closestElement = containerRef.current.querySelector(`[data-date="${closestDateStr}"]`);

                if (closestElement) {
                    // Scroll to the closest element
                    closestElement.scrollIntoView({ behavior: 'smooth', block: 'start' });

                    // Show message that we're showing the closest date with events
                    setNoEventsMessage(`No events on ${format(targetDate, "MMMM d, yyyy")}. Showing closest date with events.`);

                    // Reset scrolling state after animation completes
                    setTimeout(() => {
                        setIsScrolling(false);

                        // Force the visible date to be the target date, not the closest date
                        if (onVisibleDateChange) {
                            console.log(`Forcing visible date to be: ${targetDateStr} (even though showing ${closestDateStr})`);
                            onVisibleDateChange(targetDate, false); // false = not from user scroll
                        }
                    }, 500);
                }
            } else {
                // No events at all
                console.log("No events found at all");
                setNoEventsMessage(`No events on ${format(targetDate, "MMMM d, yyyy")} or nearby dates.`);
                setIsScrolling(false);

                // Force the visible date to be the target date
                if (onVisibleDateChange) {
                    onVisibleDateChange(targetDate, false); // false = not from user scroll
                }
            }
        } else {
            // This case happens when the date has events but the DOM element doesn't exist yet
            // (usually because the groupedEvents haven't been fully processed)
            console.log(`Date ${targetDateStr} has events but element doesn't exist yet, setting up retry`);

            // Set a message to indicate we're loading
            setNoEventsMessage(`Loading events for ${format(targetDate, "MMMM d, yyyy")}...`);

            // Set up a retry mechanism with a short delay to allow DOM to update
            setTimeout(() => {
                console.log(`Retrying scroll to date: ${targetDateStr}`);

                // Check if the element exists now
                const retryElement = containerRef.current?.querySelector(`[data-date="${targetDateStr}"]`);

                if (retryElement) {
                    console.log(`Found element on retry for date ${targetDateStr}`);
                    // Element exists now, scroll to it
                    retryElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    setNoEventsMessage(null);

                    // Reset scrolling state after animation completes
                    setTimeout(() => {
                        setIsScrolling(false);

                        // Force the visible date to be the target date
                        if (onVisibleDateChange) {
                            console.log(`Forcing visible date to be: ${targetDateStr}`);
                            onVisibleDateChange(targetDate, false); // false = not from user scroll
                        }
                    }, 500);
                } else {
                    console.log(`Still couldn't find element for date ${targetDateStr} after retry`);

                    // If we still can't find the element, try to find the closest date with events
                    const closestDateGroup = groupedEvents.reduce((closest, current) => {
                        const currentDiff = Math.abs(current.date.getTime() - targetDate.getTime());
                        const closestDiff = closest ? Math.abs(closest.date.getTime() - targetDate.getTime()) : Infinity;
                        return currentDiff < closestDiff ? current : closest;
                    }, null as GroupedEvents | null);

                    if (closestDateGroup) {
                        const closestDateStr = format(closestDateGroup.date, "yyyy-MM-dd");
                        console.log(`Falling back to closest date with events: ${closestDateStr}`);
                        const closestElement = containerRef.current?.querySelector(`[data-date="${closestDateStr}"]`);

                        if (closestElement) {
                            closestElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            setNoEventsMessage(`Showing events for ${format(closestDateGroup.date, "MMMM d, yyyy")}.`);
                        }
                    }

                    setIsScrolling(false);

                    // Force the visible date to be the target date
                    if (onVisibleDateChange) {
                        onVisibleDateChange(targetDate, false); // false = not from user scroll
                    }
                }
            }, 300); // Short delay to allow DOM to update
        }
    }, [groupedEvents, hasEventsOnDate, onVisibleDateChange]);

    // Scroll to the selected date when it changes
    useEffect(() => {
        if (date && (!lastSelectedDate || !isSameDay(date, lastSelectedDate))) {
            scrollToDate(date);
        }
    }, [date, lastSelectedDate, scrollToDate]);

    // Re-attempt scrolling when groupedEvents changes
    useEffect(() => {
        // Only re-attempt if we have a date and groupedEvents have been populated
        if (date && groupedEvents.length > 0 && lastSelectedDate) {
            console.log("GroupedEvents changed, re-attempting scroll to date:", format(date, "yyyy-MM-dd"));

            // Check if the element for the current date exists now
            const dateStr = format(date, "yyyy-MM-dd");
            const dateElement = containerRef.current?.querySelector(`[data-date="${dateStr}"]`);

            // If the element exists now but didn't before, scroll to it
            if (dateElement && !containerRef.current?.querySelector(`[data-date="${dateStr}"].scrolled-to`)) {
                console.log(`Found element for date ${dateStr} after groupedEvents update`);

                // Mark this element as scrolled to
                dateElement.classList.add('scrolled-to');

                // Scroll to the element
                dateElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                setNoEventsMessage(null);

                // Force the visible date to be the target date
                if (onVisibleDateChange) {
                    console.log(`Forcing visible date to be: ${dateStr} after groupedEvents update`);
                    onVisibleDateChange(date, false); // false = not from user scroll
                }
            }
        }
    }, [groupedEvents, date, lastSelectedDate, onVisibleDateChange]);

    // Add scroll event listener
    useEffect(() => {
        const currentRef = containerRef.current;
        if (currentRef) {
            currentRef.addEventListener('scroll', throttledScrollHandler);
            return () => {
                currentRef.removeEventListener('scroll', throttledScrollHandler);
            };
        }
    }, [throttledScrollHandler]);

    // Expose scrollToDate method via ref
    useEffect(() => {
        if (containerRef.current) {
            (containerRef.current as any).scrollToDate = scrollToDate;
        }
    }, [scrollToDate]);

    // Initial scroll position check
    useEffect(() => {
        // Check scroll position after component mounts and content is rendered
        setTimeout(() => {
            throttledScrollHandler();
        }, 100);
    }, [throttledScrollHandler, groupedEvents]);

    // Update highlighted date when date prop changes
    useEffect(() => {
        if (date) {
            setHighlightedDate(format(date, "yyyy-MM-dd"));
        }
    }, [date]);

    // Render the entire list as a single component
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
                    const dateStr = format(group.date, "yyyy-MM-dd");
                    const currentMonth = format(group.date, "MMMM");
                    const showMonthHeader = lastMonth !== currentMonth;

                    // Update lastMonth for the next iteration
                    if (lastMonth !== currentMonth) {
                        lastMonth = currentMonth;
                    }

                    return (
                        <div key={dateStr}>
                            {showMonthHeader && (
                                <div className="text-4xl font-bold mb-4 px-2 sticky top-0 bg-background pt-2 pb-2 z-10">{currentMonth}</div>
                            )}
                            <div
                                className="mb-4"
                                data-date={dateStr}
                            >
                                <div className="bg-background rounded-lg p-3 w-full px-2">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-base font-medium">
                                            {format(group.date, "d")} {format(group.date, "EEEE")}
                                        </h3>
                                        <span className="text-sm text-muted-foreground">
                                            {group.events.length} {group.events.length === 1 ? 'event' : 'events'}
                                        </span>
                                    </div>
                                    <div className="space-y-3 w-full">
                                        {group.events.map(event => (
                                            <div key={event.id} className="mb-3 w-full">
                                                <DraggableEventCard
                                                    event={event}
                                                    onClick={onEventClick}
                                                    isOwnedByCurrentUser={currentUserId === event.user_id}
                                                    onDragStart={onDragStart ? () => onDragStart(event) : undefined}
                                                    onDragEnd={onDragEnd}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="h-full overflow-auto" ref={containerRef}>
            {renderList()}
        </div>
    );
}
