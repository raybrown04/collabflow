"use client"

import { useState, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"

interface RecurringDialogProps {
    isOpen: boolean
    onClose: () => void
    onSetRecurring: (recurrenceRule: string) => void
}

export function RecurringDialog({ isOpen, onClose, onSetRecurring }: RecurringDialogProps) {
    // Recurring state
    const [recurrenceFrequency, setRecurrenceFrequency] = useState<"daily" | "weekly" | "monthly" | "yearly">("weekly")
    const [recurrenceInterval, setRecurrenceInterval] = useState(1)
    const [recurrenceEndType, setRecurrenceEndType] = useState<"never" | "after" | "on">("never")
    const [recurrenceCount, setRecurrenceCount] = useState(10)
    const [recurrenceEndDate, setRecurrenceEndDate] = useState<Date>(() => {
        // Default to 3 months from now
        const date = new Date()
        date.setMonth(date.getMonth() + 3)
        return date
    })
    
    // Handle setting recurring
    const handleSetRecurring = () => {
        // Generate recurrence rule
        let recurrenceRule = null
        
        // Build the RRULE string according to iCalendar format
        recurrenceRule = `FREQ=${recurrenceFrequency.toUpperCase()};INTERVAL=${recurrenceInterval}`
        
        // Add end conditions
        if (recurrenceEndType === "after") {
            recurrenceRule += `;COUNT=${recurrenceCount}`
        } else if (recurrenceEndType === "on") {
            const untilDate = format(recurrenceEndDate, "yyyyMMdd")
            recurrenceRule += `;UNTIL=${untilDate}T235959Z`
        }
        
        onSetRecurring(recurrenceRule)
        onClose()
    }
    
    // Memoize the onOpenChange handler to prevent infinite loops
    const handleOpenChange = useCallback((open: boolean) => {
        if (!open) onClose();
    }, [onClose]);
    
    return (
        <Dialog 
            open={isOpen} 
            onOpenChange={handleOpenChange}
        >
            <DialogContent className="sm:max-w-[400px] bg-background text-foreground">
                <DialogHeader>
                    <DialogTitle>Set Recurring</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Frequency
                        </label>
                        <select
                            id="recurrence-frequency"
                            name="recurrence-frequency"
                            value={recurrenceFrequency}
                            onChange={(e) => setRecurrenceFrequency(e.target.value as any)}
                            className="w-full rounded-md border px-3 py-2 bg-background text-foreground"
                        >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                            <option value="yearly">Yearly</option>
                        </select>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Every
                        </label>
                        <div className="flex items-center">
                            <input
                                type="number"
                                id="recurrence-interval"
                                name="recurrence-interval"
                                min="1"
                                max="99"
                                value={recurrenceInterval}
                                onChange={(e) => setRecurrenceInterval(parseInt(e.target.value) || 1)}
                                className="w-20 rounded-md border px-3 py-2 bg-background text-foreground"
                            />
                            <span className="ml-2">
                                {recurrenceFrequency === "daily" && "day(s)"}
                                {recurrenceFrequency === "weekly" && "week(s)"}
                                {recurrenceFrequency === "monthly" && "month(s)"}
                                {recurrenceFrequency === "yearly" && "year(s)"}
                            </span>
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Ends
                        </label>
                        <div className="space-y-2">
                            <div className="flex items-center">
                                <input
                                    type="radio"
                                    id="never-end"
                                    name="recurrence-end"
                                    checked={recurrenceEndType === "never"}
                                    onChange={() => setRecurrenceEndType("never")}
                                    className="mr-2 h-4 w-4"
                                />
                                <label htmlFor="never-end" className="text-sm">
                                    Never
                                </label>
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="radio"
                                    id="end-after"
                                    name="recurrence-end"
                                    checked={recurrenceEndType === "after"}
                                    onChange={() => setRecurrenceEndType("after")}
                                    className="mr-2 h-4 w-4"
                                />
                                <label htmlFor="end-after" className="text-sm mr-2">
                                    After
                                </label>
                                <input
                                    type="number"
                                    id="recurrence-count"
                                    name="recurrence-count"
                                    min="1"
                                    max="999"
                                    value={recurrenceCount}
                                    onChange={(e) => setRecurrenceCount(parseInt(e.target.value) || 1)}
                                    className="w-20 rounded-md border px-3 py-2 bg-background text-foreground"
                                    disabled={recurrenceEndType !== "after"}
                                />
                                <span className="ml-2">occurrence(s)</span>
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="radio"
                                    id="end-on"
                                    name="recurrence-end"
                                    checked={recurrenceEndType === "on"}
                                    onChange={() => setRecurrenceEndType("on")}
                                    className="mr-2 h-4 w-4"
                                />
                                <label htmlFor="end-on" className="text-sm mr-2">
                                    On
                                </label>
                                <input
                                    type="date"
                                    id="recurrence-end-date"
                                    name="recurrence-end-date"
                                    value={format(recurrenceEndDate, "yyyy-MM-dd")}
                                    onChange={(e) => setRecurrenceEndDate(new Date(e.target.value))}
                                    className="rounded-md border px-3 py-2 bg-background text-foreground"
                                    disabled={recurrenceEndType !== "on"}
                                />
                            </div>
                        </div>
                    </div>
                    
                    <Button onClick={handleSetRecurring} className="w-full">
                        Apply
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default RecurringDialog
