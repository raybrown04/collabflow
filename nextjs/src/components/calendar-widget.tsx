"use client"

import { DayPicker } from "react-day-picker"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { format, isSameDay, parseISO } from "date-fns"
import { Database } from "@/lib/database.types"
import { cn } from "@/lib/utils"

type CalendarEvent = Database['public']['Tables']['calendar_events']['Row']

interface CalendarWidgetProps {
    selectedDate: Date
    onDateSelect: (date: Date) => void
    events: CalendarEvent[]
}

const typeColors = {
    meeting: 'bg-blue-500',
    task: 'bg-green-500',
    reminder: 'bg-amber-500'
}

export function CalendarWidget({ selectedDate, onDateSelect, events }: CalendarWidgetProps) {
    console.log("CalendarWidget - events:", events);

    // Custom day content renderer
    function renderDay(day: Date) {
        const dayEvents = events.filter(event => {
            const eventDate = parseISO(event.date);
            const isSame = isSameDay(eventDate, day);
            return isSame;
        });

        console.log(`Day ${format(day, 'yyyy-MM-dd')} has ${dayEvents.length} events`);

        const uniqueTypes = [...new Set(dayEvents.map(event => event.type))];

        const isSelected = isSameDay(day, selectedDate);

        return (
            <div className={cn(
                "relative flex h-full w-full flex-col items-center justify-center",
                isSelected && "rounded-full bg-primary text-primary-foreground"
            )}>
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
            </div>
        )
    }

    return (
        <div className="rounded-lg border">
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
                    day: "h-10 w-10 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-full mx-auto",
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
