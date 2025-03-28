"use client"

import { useState, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { format, parseISO } from "date-fns"
import { Calendar } from "@/components/ui/calendar"

interface DueDateDialogProps {
    isOpen: boolean
    onClose: () => void
    onSetDueDate: (date: string, time: string) => void
}

export function DueDateDialog({ isOpen, onClose, onSetDueDate }: DueDateDialogProps) {
    // Selected date for the due date
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    
    // Selected date as string (store as string to avoid date conversion issues)
    const [selectedDateStr, setSelectedDateStr] = useState(() => {
        const now = new Date();
        return format(now, "yyyy-MM-dd");
    });
    
    // Time for the due date
    const [dueTime, setDueTime] = useState<string>("09:00");
    const [isDueDateRecurring, setIsDueDateRecurring] = useState(false);
    
    // Handle date selection from calendar
    const handleDateSelect = (date: Date | undefined) => {
        if (!date) return;
        
        // Update the selected date
        setSelectedDate(date);
        
        // Format the date as a string using ISO format
        const dateStr = format(date, "yyyy-MM-dd");
        
        if (process.env.NODE_ENV === 'development') {
            console.log(`DueDateDialog: Selected date: ${dateStr}`);
        }
        
        // Update the selected date string
        setSelectedDateStr(dateStr);
    };
    
    // Handle due date quick options
    const handleDueDateQuickOption = (option: "later_today" | "tomorrow" | "next_week" | "someday") => {
        const now = new Date();
        
        switch (option) {
            case "later_today":
                // Set to 3 hours from now
                const laterToday = new Date();
                laterToday.setHours(laterToday.getHours() + 3);
                setSelectedDateStr(format(now, "yyyy-MM-dd"));
                setDueTime(format(laterToday, "HH:mm"));
                break;
                
            case "tomorrow":
                // Set to tomorrow at 9 AM
                const tomorrow = new Date(now);
                tomorrow.setDate(tomorrow.getDate() + 1);
                setSelectedDateStr(format(tomorrow, "yyyy-MM-dd"));
                setDueTime("09:00");
                break;
                
            case "next_week":
                // Set to next week, same day at 9 AM
                const nextWeek = new Date(now);
                nextWeek.setDate(nextWeek.getDate() + 7);
                setSelectedDateStr(format(nextWeek, "yyyy-MM-dd"));
                setDueTime("09:00");
                break;
                
            case "someday":
                // Set to 2 weeks from now at 9 AM
                const someday = new Date(now);
                someday.setDate(someday.getDate() + 14);
                setSelectedDateStr(format(someday, "yyyy-MM-dd"));
                setDueTime("09:00");
                break;
        }
    };
    
    // Handle setting due date
    const handleSetDueDate = () => {
        // Pass the selected date string directly without any conversion
        onSetDueDate(selectedDateStr, dueTime);
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
            <DialogContent className="sm:max-w-md overflow-y-auto max-h-[90vh] dialog-transition">
                <DialogHeader>
                    <DialogTitle>Due Date</DialogTitle>
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
                                className="text-sm text-foreground"
                                data-testid="date-display"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1 block">TIME</label>
                            <Input
                                type="time"
                                value={dueTime}
                                onChange={(e) => setDueTime(e.target.value)}
                                className="text-sm text-foreground"
                            />
                        </div>
                    </div>
                    
                    {/* Modern Calendar Component */}
                    <div className="border rounded-md">
                        <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={handleDateSelect}
                            className="rounded-md border-0"
                        />
                    </div>
                    
                    {/* Quick options */}
                    <div className="flex flex-col gap-2">
                        <Button
                            variant="outline"
                            className="justify-start"
                            onClick={() => handleDueDateQuickOption("later_today")}
                        >
                            Later today
                        </Button>
                        <Button
                            variant="outline"
                            className="justify-start"
                            onClick={() => handleDueDateQuickOption("tomorrow")}
                        >
                            Tomorrow
                        </Button>
                        <Button
                            variant="outline"
                            className="justify-start"
                            onClick={() => handleDueDateQuickOption("next_week")}
                        >
                            Next week
                        </Button>
                        <Button
                            variant="outline"
                            className="justify-start"
                            onClick={() => handleDueDateQuickOption("someday")}
                        >
                            Someday
                        </Button>
                        
                        {/* Recurring option */}
                        <div className="flex items-center mt-2">
                            <input
                                type="checkbox"
                                id="due-date-recurring"
                                checked={isDueDateRecurring}
                                onChange={(e) => setIsDueDateRecurring(e.target.checked)}
                                className="mr-2 h-4 w-4"
                            />
                            <label htmlFor="due-date-recurring" className="text-sm">
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
                            onClick={handleSetDueDate}
                            data-testid="set-due-date-button"
                        >
                            Set
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default DueDateDialog
