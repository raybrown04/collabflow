"use client"

import { useState, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { format, addMonths, subMonths, parseISO } from "date-fns"
import { cn } from "@/lib/utils"
import { RecurringDialog } from "./RecurringDialog"

interface CalendarDay {
    date: Date;
    dayOfMonth: number;
    isCurrentMonth: boolean;
    isSelected: boolean;
}

interface ReminderDialogProps {
    isOpen: boolean
    onClose: () => void
    onSetReminder: (date: string, time: string) => void
}

export function ReminderDialog({ isOpen, onClose, onSetReminder }: ReminderDialogProps) {
    // Current visible month in the calendar
    const [viewDate, setViewDate] = useState(() => {
        const now = new Date();
        now.setDate(1); // Set to first day of month for easier month navigation
        return now;
    });
    
    // Selected date for the reminder (store as string to avoid date conversion issues)
    const [selectedDateStr, setSelectedDateStr] = useState(() => {
        const now = new Date();
        // Don't set hours to noon - just use the date as is to avoid timezone issues
        return format(now, "yyyy-MM-dd");
    });
    
    // Time for the reminder
    const [reminderTime, setReminderTime] = useState<string>("09:00");
    const [isReminderRecurring, setIsReminderRecurring] = useState(false);
    const [isRecurringDialogOpen, setIsRecurringDialogOpen] = useState(false);
    
    // Generate calendar grid for the current view month
    const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
    
    // Debug logs for troubleshooting
    useEffect(() => {
        console.log(`ReminderDialog: Selected date updated: ${selectedDateStr}`);
        console.log(`ReminderDialog: Display date: ${format(parseISO(selectedDateStr), "MM.dd.yyyy")}`);
    }, [selectedDateStr]);
    
    // Recalculate calendar when view month changes or selected date changes
    useEffect(() => {
        const days: CalendarDay[] = [];
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        
        // Parse the selected date string to a Date object for comparison
        const selectedDate = parseISO(selectedDateStr);
        
        // Get the first day of the month
        const firstDayOfMonth = new Date(year, month, 1);
        
        // Determine what day of the week the first day is (0 = Sunday, 1 = Monday, etc.)
        // We need to adjust to make Monday the first day of the week
        let firstDayOfWeek = firstDayOfMonth.getDay() - 1;
        if (firstDayOfWeek < 0) firstDayOfWeek = 6; // Sunday becomes last (6)
        
        // Add days from the previous month to fill the first week
        const daysFromPrevMonth = firstDayOfWeek;
        const prevMonth = new Date(year, month, 0); // Last day of previous month
        const prevMonthDays = prevMonth.getDate();
        
        for (let i = prevMonthDays - daysFromPrevMonth + 1; i <= prevMonthDays; i++) {
            const date = new Date(year, month - 1, i);
            days.push({
                date,
                dayOfMonth: i,
                isCurrentMonth: false,
                isSelected: isSameDay(date, selectedDate)
            });
        }
        
        // Add days from current month
        const lastDayOfMonth = new Date(year, month + 1, 0); // Last day of current month
        const daysInMonth = lastDayOfMonth.getDate();
        
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(year, month, i);
            days.push({
                date,
                dayOfMonth: i,
                isCurrentMonth: true,
                isSelected: isSameDay(date, selectedDate)
            });
        }
        
        // Fill remaining days from next month to complete the grid (6 rows x 7 days = 42 cells)
        const daysNeeded = 42 - days.length;
        for (let i = 1; i <= daysNeeded; i++) {
            const date = new Date(year, month + 1, i);
            days.push({
                date,
                dayOfMonth: i,
                isCurrentMonth: false,
                isSelected: isSameDay(date, selectedDate)
            });
        }
        
        setCalendarDays(days);
    }, [viewDate, selectedDateStr]);
    
    // Helper to check if two dates are the same day
    function isSameDay(date1: Date, date2: Date): boolean {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }
    
    // Navigate to previous month
    const showPreviousMonth = () => {
        setViewDate(prev => subMonths(prev, 1));
    };
    
    // Navigate to next month
    const showNextMonth = () => {
        setViewDate(prev => addMonths(prev, 1));
    };
    
    // Handle day selection
    const handleSelectDay = (day: CalendarDay) => {
        // Format the date as a string using ISO format with the actual date components
        // This ensures we preserve the date regardless of timezone
        const year = day.date.getFullYear();
        const month = day.date.getMonth() + 1; // getMonth is 0-based
        const dayOfMonth = day.date.getDate();
        
        const dateStr = `${year}-${month.toString().padStart(2, '0')}-${dayOfMonth.toString().padStart(2, '0')}`;
        
        if (process.env.NODE_ENV === 'development') {
            console.log(`ReminderDialog: Selected date: ${dateStr} (day ${day.dayOfMonth})`);
            console.log(`ReminderDialog: Date components: Year=${year}, Month=${month}, Day=${dayOfMonth}`);
        }
        
        // Update the selected date string
        setSelectedDateStr(dateStr);
        
        // If the selected day is from a different month, change the view
        if (!day.isCurrentMonth) {
            setViewDate(new Date(day.date.getFullYear(), day.date.getMonth(), 1));
        }
    };
    
    // Handle reminder quick options
    const handleReminderQuickOption = (option: "later_today" | "tomorrow" | "next_week" | "someday") => {
        const now = new Date();
        
        switch (option) {
            case "later_today":
                // Set to 3 hours from now
                const laterToday = new Date();
                laterToday.setHours(laterToday.getHours() + 3);
                setSelectedDateStr(format(now, "yyyy-MM-dd"));
                setReminderTime(format(laterToday, "HH:mm"));
                break;
                
            case "tomorrow":
                // Set to tomorrow at 9 AM
                const tomorrow = new Date(now);
                tomorrow.setDate(tomorrow.getDate() + 1);
                setSelectedDateStr(format(tomorrow, "yyyy-MM-dd"));
                setReminderTime("09:00");
                break;
                
            case "next_week":
                // Set to next week, same day at 9 AM
                const nextWeek = new Date(now);
                nextWeek.setDate(nextWeek.getDate() + 7);
                setSelectedDateStr(format(nextWeek, "yyyy-MM-dd"));
                setReminderTime("09:00");
                break;
                
            case "someday":
                // Set to 2 weeks from now at 9 AM
                const someday = new Date(now);
                someday.setDate(someday.getDate() + 14);
                setSelectedDateStr(format(someday, "yyyy-MM-dd"));
                setReminderTime("09:00");
                break;
        }
    };
    
    // Handle setting recurring
    const handleSetRecurring = (recurrenceRule: string) => {
        setIsReminderRecurring(true);
        setIsRecurringDialogOpen(false);
    };
    
    // Handle setting reminder
    const handleSetReminder = () => {
        // Pass the selected date string directly without any conversion
        onSetReminder(selectedDateStr, reminderTime);
        onClose();
    };
    
    // Memoize the onOpenChange handler to prevent infinite loops
    const handleOpenChange = useCallback((open: boolean) => {
        if (!open) onClose();
    }, [onClose]);
    
    return (
        <Dialog 
            open={isOpen} 
            onOpenChange={handleOpenChange}
        >
            <DialogContent className="sm:max-w-md dialog-transition" aria-describedby="reminder-description">
                <DialogHeader>
                    <DialogTitle>Reminder</DialogTitle>
                    <DialogDescription id="reminder-description">
                        Set a reminder for your event
                    </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6 mt-2">
                    {/* Date and Time Inputs */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium mb-1 block">DATE</label>
                            <Input
                                type="text"
                                value={format(parseISO(selectedDateStr), "MM.dd.yyyy")}
                                readOnly
                                className="text-sm text-foreground placeholder:text-gray-400"
                                data-testid="date-display"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1 block">TIME</label>
                            <Input
                                type="time"
                                value={reminderTime}
                                onChange={(e) => setReminderTime(e.target.value)}
                                className="text-sm text-foreground placeholder:text-gray-400"
                                required={false}
                            />
                        </div>
                    </div>
                    
                    {/* Calendar */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium">
                                {format(viewDate, "MMMM yyyy")}
                            </h3>
                            <div className="flex gap-2">
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8 w-8 p-0"
                                    onClick={showPreviousMonth}
                                >
                                    &lt;
                                </Button>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8 w-8 p-0"
                                    onClick={showNextMonth}
                                >
                                    &gt;
                                </Button>
                            </div>
                        </div>
                        
                        {/* Calendar grid */}
                        <div className="grid grid-cols-7 gap-1">
                            {/* Day headers */}
                            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                                <div key={day} className="text-center text-sm font-medium py-1">
                                    {day}
                                </div>
                            ))}
                            
                            {/* Calendar days */}
                            {calendarDays.map((day, index) => (
                                <div
                                    key={`day-${index}`}
                                    className={cn(
                                        "text-center text-sm py-2",
                                        day.isCurrentMonth ? "cursor-pointer" : "text-gray-400",
                                        day.isSelected
                                            ? "bg-primary text-primary-foreground rounded-full" 
                                            : day.isCurrentMonth ? "hover:bg-gray-100" : ""
                                    )}
                                    onClick={() => handleSelectDay(day)}
                                    data-date={format(day.date, "yyyy-MM-dd")}
                                    data-day={day.dayOfMonth}
                                    data-selected={day.isSelected}
                                >
                                    {day.dayOfMonth}
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {/* Quick options */}
                    <div className="flex flex-col gap-2">
                        <Button
                            variant="outline"
                            className="justify-start"
                            onClick={() => handleReminderQuickOption("later_today")}
                        >
                            Later today
                        </Button>
                        <Button
                            variant="outline"
                            className="justify-start"
                            onClick={() => handleReminderQuickOption("tomorrow")}
                        >
                            Tomorrow
                        </Button>
                        <Button
                            variant="outline"
                            className="justify-start"
                            onClick={() => handleReminderQuickOption("next_week")}
                        >
                            Next week
                        </Button>
                        <Button
                            variant="outline"
                            className="justify-start"
                            onClick={() => handleReminderQuickOption("someday")}
                        >
                            Someday
                        </Button>
                        
                        {/* Recurring option */}
                        <div className="flex items-center mt-2">
                            <input
                                type="checkbox"
                                id="reminder-recurring"
                                checked={isReminderRecurring}
                                onChange={(e) => {
                                    setIsReminderRecurring(e.target.checked);
                                    if (e.target.checked) {
                                        setIsRecurringDialogOpen(true);
                                    }
                                }}
                                className="mr-2 h-4 w-4"
                            />
                            <label htmlFor="reminder-recurring" className="text-sm">
                                Recurring
                            </label>
                        </div>
                    </div>
                    
                    {/* Action buttons */}
                    <div className="flex justify-between gap-2 pt-4">
                        <Button
                            variant="outline"
                            onClick={onClose}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="default"
                            onClick={handleSetReminder}
                            data-testid="set-reminder-button"
                        >
                            Set
                        </Button>
                    </div>
                </div>
            </DialogContent>
            
            <RecurringDialog
                isOpen={isRecurringDialogOpen}
                onClose={() => setIsRecurringDialogOpen(false)}
                onSetRecurring={handleSetRecurring}
            />
        </Dialog>
    )
}

export default ReminderDialog
