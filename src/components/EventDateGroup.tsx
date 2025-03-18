/**
 * EventDateGroup.tsx
 * Created: 2/27/2025
 * 
 * Component to render a group of events for a specific date.
 * Extracted from VirtualizedEventsList to improve modularity and performance.
 */

import React from "react";
import { format } from "date-fns";
import { DraggableEventCard } from "./DraggableEventCard";
import { CalendarEvent } from "@/hooks/useCalendarEvents";

interface EventDateGroupProps {
    date: Date;
    events: CalendarEvent[];
    currentUserId: string | null;
    onEventClick: (event: CalendarEvent) => void;
    onDragStart?: (event: CalendarEvent) => void;
    onDragEnd?: () => void;
    findDateElement?: (dateStr: string) => HTMLElement | null;
    performScroll?: (element: HTMLElement, date: Date) => void;
}

export function EventDateGroup({
    date,
    events,
    currentUserId,
    onEventClick,
    onDragStart,
    onDragEnd,
    findDateElement,
    performScroll
}: EventDateGroupProps) {
    const dateStr = format(date, "yyyy-MM-dd");

    return (
        <div
            className="mb-4 pt-2 scroll-mt-16"
            data-date={dateStr}
            id={`date-${dateStr}`}
            data-testid={`date-group-${dateStr}`}
            aria-label={`Events for ${format(date, "MMMM d, yyyy")}`}
        >
            <div className="bg-background rounded-lg p-3 w-full px-2">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-medium">
                        {format(date, "d")} {format(date, "EEEE")}
                    </h3>
                    <span className="text-sm text-muted-foreground">
                        {events.length} {events.length === 1 ? 'event' : 'events'}
                    </span>
                </div>
                <div className="space-y-3 w-full">
                    {events.map(event => (
                        <div key={event.id} className="mb-3 w-full">
                            <DraggableEventCard
                                key={event.id}
                                event={event}
                                onClick={(clickedEvent) => {
                                    // First handle the event click action
                                    onEventClick(clickedEvent);
                                }}
                                isOwnedByCurrentUser={currentUserId === event.user_id}
                                onDragStart={onDragStart ? () => onDragStart(event) : undefined}
                                onDragEnd={onDragEnd}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
