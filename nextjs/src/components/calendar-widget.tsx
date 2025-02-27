"use client"

import { DayPicker } from "react-day-picker"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { format, isSameDay, parseISO } from "date-fns"
import { Database } from "@/lib/database.types"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { DroppableCalendarDay } from "./DroppableCalendarDay"
import { useUpdateEventDate } from "@/hooks/useUpdateEventDate"
import { useToast } from "@/components/ui/use-toast"

type CalendarEvent = Database['public']['Tables']['calendar_events']['Row']

interface CalendarWidgetProps {
    selectedDate: Date
    onDateSelect: (date: Date) => void
    events: CalendarEvent[]
    onEventDrop?: (event: CalendarEvent, newDate: Date) => void
}

const typeColors = {
    meeting: 'bg-blue-500',
    task: 'bg-green-500',
    reminder: 'bg-amber-500'
}

export function CalendarWidget({ selectedDate, onDateSelect, events, onEventDrop }: CalendarWidgetProps) {
    const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null)
    const updateEventDateMutation = useUpdateEventDate()
    const { toast } = useToast()

    // Handle event drop on a date
    const handleEventDrop = (event: CalendarEvent, newDate: Date) => {
        if (onEventDrop) {
            // Use the provided event drop handler
            onEventDrop(event, newDate)
        } else {
            // Use the default event drop handler
            updateEventDateMutation.mutate({
                event,
                newDate
            })
        }
    }

    // Custom day content renderer
    function renderDay(day: Date) {
        const dayEvents = events.filter(event => {
            const eventDate = parseISO(event.date);
            const isSame = isSameDay(eventDate, day);
            return isSame;
        });

        const uniqueTypes = [...new Set(dayEvents.map(event => event.type))];
        const isSelected = isSameDay(day, selectedDate);

        return (
            <DroppableCalendarDay
                day={day}
                isSelected={isSelected}
                onEventDrop={handleEventDrop}
            >
                <div className="text-center">{format(day, "d")}</div>
                {dayEvents.length > 0 && (
                    <div className="absolute bottom-1 flex gap-0.5">
                        {uniqueTypes.map((type, i) => (
                            <div
                                key={type}
                                className={`h-1.5 w-1.5 rounded-full ${typeColors[type]}`}
                                style={{
                                    transform: `translateX(${i * 6 - (uniqueTypes.length - 1) * 3}px)`
                                }}
                            />
                        ))}
                    </div>
                )}
            </DroppableCalendarDay>
        )
    }

    return (
        <div className="rounded-lg border mx-auto mb-4 bg-background shadow-sm" style={{ width: "calc(100% - 0.5rem)" }}>
            <DayPicker
                mode="single"
                month={selectedDate}
                selected={selectedDate}
                onSelect={(date) => date && onDateSelect(date)}
                showOutsideDays={true}
                fixedWeeks
                hideHead={false}
                className="w-full p-0"
                classNames={{
                    months: "w-full",
                    month: "w-full",
                    caption: "hidden",
                    caption_label: "hidden",
                    nav: "hidden",
                    nav_button: "hidden",
                    nav_button_previous: "hidden",
                    nav_button_next: "hidden",
                    table: "w-full border-collapse",
                    head_row: "flex w-full",
                    head_cell: "text-muted-foreground rounded-none w-full font-normal text-[0.8rem] uppercase",
                    row: "flex w-full mt-0",
                    cell: "relative h-10 w-full p-0 text-center text-sm focus-within:relative focus-within:z-20",
                    day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-full mx-auto",
                    day_outside: "opacity-50 cursor-default",
                    day_today: "bg-accent/50 text-accent-foreground",
                    day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                }}
                components={{
                    DayContent: ({ date, ...props }) => date && renderDay(date)
                }}
            />
        </div>
    )
}
