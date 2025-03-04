/**
 * useGroupedEvents.ts
 * Created: 2/27/2025
 * 
 * Custom hook to handle grouping events by date.
 * Extracts complex grouping logic from VirtualizedEventsList component.
 * Handles multi-day events by adding them to each day they span.
 */

import { useState, useEffect } from "react";
import { format, parseISO, startOfDay, isSameDay, addDays } from "date-fns";
import { CalendarEvent } from "./useCalendarEvents";

export interface GroupedEvents {
    date: Date;
    events: CalendarEvent[];
}

export function useGroupedEvents(events: CalendarEvent[]) {
    const [groupedEvents, setGroupedEvents] = useState<GroupedEvents[]>([]);
    const [allDates, setAllDates] = useState<Date[]>([]);

    // Group events by date and create a comprehensive date list
    useEffect(() => {
        const eventsByDate = new Map<string, { date: Date, events: CalendarEvent[] }>();
        const dateSet = new Set<string>();

        // Process each event and group by date
        events.forEach(event => {
            const eventStartDate = parseISO(event.date);
            const eventEndDate = event.end_date ? parseISO(event.end_date) : eventStartDate;

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

    // Check if a date has events
    const hasEventsOnDate = (date: Date): boolean => {
        if (!date) return false;

        const dateStr = format(date, "yyyy-MM-dd");
        const targetDate = startOfDay(date);

        // First check if we have a direct match in groupedEvents
        const directMatch = groupedEvents.some(group =>
            format(group.date, "yyyy-MM-dd") === dateStr
        );

        if (directMatch) {
            return true;
        }

        // If no direct match, check individual events
        return events.some(event => {
            const eventStartDate = parseISO(event.date);
            const eventStartStr = format(eventStartDate, "yyyy-MM-dd");

            // If it's a single-day event, just check if it's on this date
            if (!event.end_date) {
                return eventStartStr === dateStr;
            }

            // For multi-day events, check if the target date is within the event's date range
            const eventEndDate = parseISO(event.end_date);
            const eventStartDay = startOfDay(eventStartDate);
            const eventEndDay = startOfDay(eventEndDate);

            return targetDate >= eventStartDay && targetDate <= eventEndDay;
        });
    };

    return { groupedEvents, allDates, hasEventsOnDate };
}
