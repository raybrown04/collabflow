"use client"

import { useState, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Check, Trash, Plus, Bell } from "lucide-react"
import { format, parseISO } from "date-fns"
import { cn } from "@/lib/utils"
import { Task, TaskList } from "./TaskItem"
import { ReminderDialog } from "./ReminderDialog"
import { RecurringDialog } from "./RecurringDialog"
import { DueDateDialog } from "./DueDateDialog"
import { ProjectSelector } from "./ProjectSelector"
import { Project } from "@/hooks/useProjects"
import useProjectTags from "@/hooks/useProjectTags"

interface TaskDetailPopupProps {
    task: Task | null
    taskLists: TaskList[]
    isOpen: boolean
    setIsOpen: (open: boolean) => void
    onUpdate: (task: Task) => void
    onDelete: (id: string) => void
    onComplete: (id: string, completed: boolean) => void
    mode: 'edit' | 'create'
    onCreate?: (task: Omit<Task, 'id' | 'created_at' | 'user_id'>) => void
}

export function TaskDetailPopup({
    task,
    taskLists,
    isOpen,
    setIsOpen,
    onUpdate,
    onDelete,
    onComplete,
    mode = 'edit',
    onCreate
}: TaskDetailPopupProps) {
    // Form state
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [listId, setListId] = useState<string | null>(null)
    const [dueDate, setDueDate] = useState("")
    const [newSubtask, setNewSubtask] = useState("")
    const [subtasks, setSubtasks] = useState<{ id: string; text: string; completed: boolean }[]>([])
    const [isRecurring, setIsRecurring] = useState(false)
    const [recurrenceFrequency, setRecurrenceFrequency] = useState<"daily" | "weekly" | "monthly" | "yearly">("weekly")
    const [recurrenceInterval, setRecurrenceInterval] = useState(1)
    const [completed, setCompleted] = useState(false)
    const [isCompletionAnimating, setIsCompletionAnimating] = useState(false)
    
    // Reminder state
    const [isReminderDialogOpen, setIsReminderDialogOpen] = useState(false)
    const [reminderDate, setReminderDate] = useState<string>("")
    const [reminderTime, setReminderTime] = useState<string>("")
    const [hasReminder, setHasReminder] = useState(false)
    
    // Recurring dialog state
    const [isRecurringDialogOpen, setIsRecurringDialogOpen] = useState(false)
    const [recurrenceRule, setRecurrenceRule] = useState<string | null>(null)
    
    // Due Date dialog state
    const [isDueDateDialogOpen, setIsDueDateDialogOpen] = useState(false)
    const [dueTime, setDueTime] = useState<string>("09:00")

    // Debug logs for date synchronization
    useEffect(() => {
        console.log(`[TaskDetailPopup] dueDate updated: ${dueDate}`);
        console.log(`[TaskDetailPopup] reminderDate: ${reminderDate}`);
    }, [dueDate, reminderDate]);

    // Reset form fields
    const resetForm = () => {
        setTitle("")
        setDescription("")
        setDueDate("")
        setListId(null)
        setSubtasks([])
        setIsRecurring(false)
        setHasReminder(false)
        setReminderDate("")
        setReminderTime("")
        setCompleted(false)
    }

    // Load task data when task changes
    useEffect(() => {
        if (task) {
            setTitle(task.title || "")
            setDescription(task.description || "")
            setListId(task.list_id || null)
            
            // Properly format the due date using UTC date components to preserve the actual date
            if (task.due_date) {
                const date = new Date(task.due_date);
                const year = date.getUTCFullYear();
                const month = date.getUTCMonth() + 1; // getUTCMonth is 0-based
                const day = date.getUTCDate();
                
                // Format as YYYY-MM-DD for the date input
                const formattedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                console.log(`[TaskDetailPopup] Formatting due date from ${task.due_date} to ${formattedDate}`);
                
                setDueDate(formattedDate);
            } else {
                setDueDate("");
            }
            
            setCompleted(task.completed || false)
            // Load subtasks if available
            if (task.subtasks) {
                setSubtasks(task.subtasks)
            } else {
                setSubtasks([])
            }
        } else {
            resetForm()
        }
    }, [task])

    // Handle completion toggle with animation
    const handleCompleteToggle = () => {
        setIsCompletionAnimating(true)
        const newCompletedState = !completed
        setCompleted(newCompletedState)
        
        if (task) {
            onComplete(task.id, newCompletedState)
        }
        
        setTimeout(() => {
            setIsCompletionAnimating(false)
        }, 150)
    }

    // Create a task update object
    const createUpdatedTask = () => {
        if (!task) return null
        if (!title.trim()) return null

        let dueDateTime = null
        if (dueDate) {
            // Parse the date string to extract components
            const [year, month, day] = dueDate.split('-').map(Number);
            
            // Create a date object with the extracted components
            // Month is 0-indexed in JavaScript Date
            const dateObj = new Date(year, month - 1, day);
            
            // Add the time component if a reminder time is set
            if (hasReminder && reminderTime) {
                const [hours, minutes] = reminderTime.split(':').map(Number);
                dateObj.setHours(hours, minutes, 0, 0);
            } else {
                // Set to noon to avoid timezone edge cases
                dateObj.setHours(12, 0, 0, 0);
            }
            
            // Use preserveDateComponents to ensure consistent date handling
            dueDateTime = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T12:00:00.000Z`;
            
            if (process.env.NODE_ENV === 'development') {
                console.log(`[TaskDetailPopup] createUpdatedTask - Original date: ${dueDate}`);
                console.log(`[TaskDetailPopup] createUpdatedTask - Parsed components: year=${year}, month=${month}, day=${day}`);
                console.log(`[TaskDetailPopup] createUpdatedTask - With time: ${hasReminder ? reminderTime : 'noon'}`);
                console.log(`[TaskDetailPopup] createUpdatedTask - Final due date: ${dueDateTime}`);
            }
        }

        return {
            ...task,
            title,
            description,
            due_date: dueDateTime,
            completed,
            recurrence_rule: isRecurring ? recurrenceRule : null,
            subtasks
        }
    }
    
    // Handle form submission - save and close
    const handleSave = () => {
        const updatedTask = createUpdatedTask()
        if (updatedTask) {
            onUpdate(updatedTask)
            setIsOpen(false)
        }
    }

    // Handle task delete
    const handleDelete = () => {
        if (!task) return
        onDelete(task.id)
        setIsOpen(false)
    }

    // Handle creating a new task
    const handleCreate = () => {
        if (!title.trim() || !onCreate) return

        let dueDateTime = null
        if (dueDate) {
            // Parse the date string to extract components
            const [year, month, day] = dueDate.split('-').map(Number);
            
            // Create a date object with the extracted components
            // Month is 0-indexed in JavaScript Date
            const dateObj = new Date(year, month - 1, day);
            
            // Add the time component if a reminder time is set
            if (hasReminder && reminderTime) {
                const [hours, minutes] = reminderTime.split(':').map(Number);
                dateObj.setHours(hours, minutes, 0, 0);
            } else {
                // Set to noon to avoid timezone edge cases
                dateObj.setHours(12, 0, 0, 0);
            }
            
            // Use preserveDateComponents to ensure consistent date handling
            dueDateTime = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T12:00:00.000Z`;
            
            if (process.env.NODE_ENV === 'development') {
                console.log(`[TaskDetailPopup] handleCreate - Original date: ${dueDate}`);
                console.log(`[TaskDetailPopup] handleCreate - Parsed components: year=${year}, month=${month}, day=${day}`);
                console.log(`[TaskDetailPopup] handleCreate - With time: ${hasReminder ? reminderTime : 'noon'}`);
                console.log(`[TaskDetailPopup] handleCreate - Final due date: ${dueDateTime}`);
            }
        }

        const newTask = {
            title,
            description,
            due_date: dueDateTime,
            completed: false,
            priority: 'medium' as const,
            subtasks,
            recurrence_rule: isRecurring ? recurrenceRule : null
        }

        onCreate(newTask)
        setIsOpen(false)
        resetForm()
    }
    
    // Handle setting reminder
    const handleSetReminder = (date: string, time: string) => {
        console.log(`[TaskDetailPopup] Setting reminder with date: ${date}, time: ${time}`);
        
        // Update reminder date and time
        setReminderDate(date);
        setReminderTime(time);
        setHasReminder(true);
        
        // Update the due date to match the reminder date
        setDueDate(date);
        
        // Parse the date string to extract components
        const [year, month, day] = date.split('-').map(Number);
        const [hours, minutes] = time.split(':').map(Number);
        
        if (process.env.NODE_ENV === 'development') {
            // Log the date information for debugging
            console.log(`[TaskDetailPopup] Reminder date: ${date}, time: ${time}`);
            console.log(`[TaskDetailPopup] Parsed components: year=${year}, month=${month}, day=${day}, hours=${hours}, minutes=${minutes}`);
        }
        
        // Close the dialog
        setIsReminderDialogOpen(false);
    }
    
    // Handle setting recurring
    const handleSetRecurring = (rule: string) => {
        setRecurrenceRule(rule)
        setIsRecurring(true)
        setIsRecurringDialogOpen(false)
    }
    
    // Handle setting due date
    const handleSetDueDate = (date: string, time: string) => {
        console.log(`[TaskDetailPopup] Setting due date with date: ${date}, time: ${time}`);
        
        // Update due date and time
        setDueDate(date);
        setDueTime(time);
        
        // Parse the date string to extract components
        const [year, month, day] = date.split('-').map(Number);
        const [hours, minutes] = time.split(':').map(Number);
        
        if (process.env.NODE_ENV === 'development') {
            // Log the date information for debugging
            console.log(`[TaskDetailPopup] Due date: ${date}, time: ${time}`);
            console.log(`[TaskDetailPopup] Parsed components: year=${year}, month=${month}, day=${day}, hours=${hours}, minutes=${minutes}`);
        }
        
        // Close the dialog
        setIsDueDateDialogOpen(false);
    }

    // Generate unique ID for new subtask
    const generateSubtaskId = () => {
        return `subtask-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    }

    // Add new subtask
    const handleAddSubtask = () => {
        if (!newSubtask.trim()) return
        
        const newSubtaskItem = {
            id: generateSubtaskId(),
            text: newSubtask,
            completed: false
        }
        
        setSubtasks([...subtasks, newSubtaskItem])
        setNewSubtask("")
    }

    // Toggle subtask completion
    const handleToggleSubtask = (id: string) => {
        const updatedSubtasks = subtasks.map(subtask => 
            subtask.id === id 
                ? { ...subtask, completed: !subtask.completed } 
                : subtask
        )
        setSubtasks(updatedSubtasks)
    }

    // Delete subtask
    const handleDeleteSubtask = (id: string) => {
        setSubtasks(subtasks.filter(subtask => subtask.id !== id))
    }

    // Format reminder date for display
    const formatReminderDisplay = () => {
        if (!hasReminder || !reminderDate) {
            return "Set Reminder";
        }
        
        try {
            // Parse the date string directly to get the components
            const [year, month, day] = reminderDate.split('-').map(Number);
            
            // Format the date manually to ensure correct display
            const monthStr = month.toString().padStart(2, '0');
            const dayStr = day.toString().padStart(2, '0');
            
            console.log(`[TaskDetailPopup] Formatting reminder: ${reminderDate} as ${monthStr}/${dayStr} at ${reminderTime}`);
            
            return `${monthStr}/${dayStr} at ${reminderTime}`;
        } catch (error) {
            console.error("Error formatting reminder date:", error);
            return "Set Reminder";
        }
    }

    // Memoize the onOpenChange handler to prevent infinite loops
    const handleOpenChange = useCallback((open: boolean) => {
        // Only update state if it's different to avoid infinite loop
        if (open !== isOpen) {
            setIsOpen(open);
        }
    }, [isOpen, setIsOpen]);
    
    return (
        <>
            <Dialog 
                open={isOpen} 
                onOpenChange={handleOpenChange}
            >
                <DialogContent className="sm:max-w-md md:max-w-xl overflow-y-auto max-h-[90vh] dialog-transition">
                    <DialogHeader>
                        <DialogTitle className="flex-1">
                            {mode === 'edit' && task ? 'Edit Task' : 'Add New Task'}
                        </DialogTitle>
                    </DialogHeader>

                    {mode === 'edit' && task ? (
                        <div className="space-y-6 mt-2">
                            {/* Title with completion checkbox */}
                            <div className="flex items-center gap-3">
                                {/* Click to complete circle */}
                                <button
                                    type="button"
                                    aria-checked={completed}
                                    role="checkbox"
                                    className="focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary relative z-10"
                                    onClick={handleCompleteToggle}
                                    aria-label={completed ? `Mark task as incomplete` : `Mark task as complete`}
                                >
                                    <div
                                        className={cn(
                                            "w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-200",
                                            completed 
                                                ? "bg-green-500 border-green-500" 
                                                : "border-gray-300 hover:border-gray-500",
                                            isCompletionAnimating && "scale-110"
                                        )}
                                    >
                                        {completed && (
                                            <Check className={cn(
                                                "h-3 w-3 text-white transition-opacity duration-100",
                                                isCompletionAnimating ? "opacity-50" : "opacity-100"
                                            )} />
                                        )}
                                    </div>
                                    
                                    {/* Ripple effect */}
                                    {isCompletionAnimating && (
                                        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-green-500/30 rounded-full animate-ping" />
                                    )}
                                </button>
                                
                                <Input
                                    id="edit-title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Task title"
                                    className={cn(
                                        "text-foreground flex-1",
                                        completed && "line-through text-gray-400"
                                    )}
                                />
                            </div>

                            {/* Project selection replaces List selection */}
                            <ProjectSelector taskId={task?.id || null} />

                            <div className="space-y-2">
                                <label htmlFor="edit-description" className="text-sm font-medium">
                                    Notes
                                </label>
                                <Textarea
                                    id="edit-description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Add notes here..."
                                    className="min-h-24 text-sm text-foreground"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label htmlFor="edit-duedate" className="text-sm font-medium">
                                        Due Date
                                    </label>
                                    <Button
                                        id="edit-duedate"
                                        variant="outline"
                                        className={cn(
                                            "w-full flex items-center justify-center gap-2",
                                            dueDate && "bg-primary/10 border-primary text-primary"
                                        )}
                                        onClick={() => setIsDueDateDialogOpen(true)}
                                    >
                                        <span>
                                            {dueDate ? format(parseISO(dueDate), "MM/dd/yyyy") : "Set Due Date"}
                                        </span>
                                    </Button>
                                </div>
                                
                                <div className="space-y-2">
                                    <label htmlFor="edit-reminder" className="text-sm font-medium">
                                        Reminder
                                    </label>
                                    <Button
                                        id="edit-reminder"
                                        variant="outline"
                                        className={cn(
                                            "w-full flex items-center justify-center gap-2",
                                            hasReminder && "bg-primary/10 border-primary text-primary"
                                        )}
                                        onClick={() => {
                                            // Pre-set the date in the reminder dialog to the current due date if it exists
                                            if (dueDate) {
                                                setReminderDate(dueDate);
                                            }
                                            setIsReminderDialogOpen(true);
                                        }}
                                    >
                                        <Bell className="h-4 w-4" />
                                        <span>
                                            {hasReminder ? formatReminderDisplay() : "Set Reminder"}
                                        </span>
                                    </Button>
                                </div>
                            </div>
                            

                            {/* Checkbox for recurring tasks */}
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="edit-recurring"
                                    checked={isRecurring}
                                    onChange={(e) => {
                                        setIsRecurring(e.target.checked);
                                        if (e.target.checked) {
                                            setIsRecurringDialogOpen(true);
                                        } else {
                                            setRecurrenceRule(null);
                                        }
                                    }}
                                    className="mr-2 h-4 w-4"
                                />
                                <label htmlFor="edit-recurring" className="text-sm">
                                    Recurring {recurrenceRule && recurrenceRule.startsWith("FREQ=") && `(${recurrenceRule.split(";")[0].replace("FREQ=", "")})`}
                                </label>
                            </div>
                            
                            {/* Subtasks section */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    Subtasks ({subtasks.filter(s => s.completed).length}/{subtasks.length})
                                </label>
                                <div className="space-y-2">
                                    {subtasks.map(subtask => (
                                        <div key={subtask.id} className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => handleToggleSubtask(subtask.id)}
                                                className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                            >
                                                <div className={cn(
                                                    "w-4 h-4 rounded-full border flex items-center justify-center",
                                                    subtask.completed ? "bg-green-500 border-green-500" : "border-gray-300"
                                                )}>
                                                    {subtask.completed && <Check className="h-2 w-2 text-white" />}
                                                </div>
                                            </button>
                                            <span className={cn(
                                                "flex-1 text-sm",
                                                subtask.completed && "line-through text-gray-400"
                                            )}>
                                                {subtask.text}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => handleDeleteSubtask(subtask.id)}
                                            >
                                                <Trash className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <Input
                                        value={newSubtask}
                                        onChange={(e) => setNewSubtask(e.target.value)}
                                        placeholder="Add a subtask..."
                                    className="text-sm text-foreground"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && newSubtask.trim()) {
                                                handleAddSubtask();
                                                e.preventDefault();
                                            }
                                        }}
                                    />
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={handleAddSubtask}
                                        disabled={!newSubtask.trim()}
                                    >
                                        <Plus className="h-4 w-4" />
                                        Add
                                    </Button>
                                </div>
                            </div>

                            <div className="flex justify-between gap-2 border-t pt-4">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                    onClick={handleDelete}
                                >
                                    <Trash className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="default"
                                    onClick={handleSave}
                                >
                                    Save
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 mt-2">
                            <div className="space-y-2">
                                <label htmlFor="create-title" className="text-sm font-medium">
                                    Title
                                </label>
                                <Input
                                    id="create-title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Task title"
                                    className="text-foreground"
                                    required
                                />
                            </div>

                            {/* Project selection replaces List selection */}
                            <ProjectSelector taskId={null} />

                            <div className="space-y-2">
                                <label htmlFor="create-description" className="text-sm font-medium">
                                    Notes
                                </label>
                                <Textarea
                                    id="create-description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Add notes here..."
                                    className="min-h-24 text-sm text-foreground"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label htmlFor="create-duedate" className="text-sm font-medium">
                                        Due Date
                                    </label>
                                    <Button
                                        id="create-duedate"
                                        variant="outline"
                                        className={cn(
                                            "w-full flex items-center justify-center gap-2",
                                            dueDate && "bg-primary/10 border-primary text-primary"
                                        )}
                                        onClick={() => setIsDueDateDialogOpen(true)}
                                    >
                                        <span>
                                            {dueDate ? format(parseISO(dueDate), "MM/dd/yyyy") : "Set Due Date"}
                                        </span>
                                    </Button>
                                </div>
                                
                                <div className="space-y-2">
                                    <label htmlFor="create-reminder" className="text-sm font-medium">
                                        Reminder
                                    </label>
                                    <Button
                                        id="create-reminder"
                                        variant="outline"
                                        className={cn(
                                            "w-full flex items-center justify-center gap-2",
                                            hasReminder && "bg-primary/10 border-primary text-primary"
                                        )}
                                        onClick={() => {
                                            // Pre-set the date in the reminder dialog to the current due date if it exists
                                            if (dueDate) {
                                                setReminderDate(dueDate);
                                            }
                                            setIsReminderDialogOpen(true);
                                        }}
                                    >
                                        <Bell className="h-4 w-4" />
                                        <span>
                                            {hasReminder ? formatReminderDisplay() : "Set Reminder"}
                                        </span>
                                    </Button>
                                </div>
                            </div>
                            

                            {/* Checkbox for recurring tasks */}
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="create-recurring"
                                    checked={isRecurring}
                                    onChange={(e) => {
                                        setIsRecurring(e.target.checked);
                                        if (e.target.checked) {
                                            setIsRecurringDialogOpen(true);
                                        } else {
                                            setRecurrenceRule(null);
                                        }
                                    }}
                                    className="mr-2 h-4 w-4"
                                />
                                <label htmlFor="create-recurring" className="text-sm">
                                    Recurring {recurrenceRule && recurrenceRule.startsWith("FREQ=") && `(${recurrenceRule.split(";")[0].replace("FREQ=", "")})`}
                                </label>
                            </div>
                            
                            {/* Subtasks section */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    Subtasks ({subtasks.filter(s => s.completed).length}/{subtasks.length})
                                </label>
                                <div className="space-y-2">
                                    {subtasks.map(subtask => (
                                        <div key={subtask.id} className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => handleToggleSubtask(subtask.id)}
                                                className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                            >
                                                <div className={cn(
                                                    "w-4 h-4 rounded-full border flex items-center justify-center",
                                                    subtask.completed ? "bg-green-500 border-green-500" : "border-gray-300"
                                                )}>
                                                    {subtask.completed && <Check className="h-2 w-2 text-white" />}
                                                </div>
                                            </button>
                                            <span className={cn(
                                                "flex-1 text-sm",
                                                subtask.completed && "line-through text-gray-400"
                                            )}>
                                                {subtask.text}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => handleDeleteSubtask(subtask.id)}
                                            >
                                                <Trash className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <Input
                                        value={newSubtask}
                                        onChange={(e) => setNewSubtask(e.target.value)}
                                        placeholder="Add a subtask..."
                                        className="text-sm text-foreground"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && newSubtask.trim()) {
                                                handleAddSubtask();
                                                e.preventDefault();
                                            }
                                        }}
                                    />
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={handleAddSubtask}
                                        disabled={!newSubtask.trim()}
                                    >
                                        <Plus className="h-4 w-4" />
                                        Add
                                    </Button>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 border-t pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    variant="default"
                                    onClick={handleCreate}
                                >
                                    Create
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
            
            {/* Reminder Dialog */}
            <ReminderDialog
                isOpen={isReminderDialogOpen}
                onClose={() => setIsReminderDialogOpen(false)}
                onSetReminder={handleSetReminder}
            />
            
            {/* Recurring Dialog */}
            <RecurringDialog
                isOpen={isRecurringDialogOpen}
                onClose={() => setIsRecurringDialogOpen(false)}
                onSetRecurring={handleSetRecurring}
            />
            
            {/* Due Date Dialog */}
            <DueDateDialog
                isOpen={isDueDateDialogOpen}
                onClose={() => setIsDueDateDialogOpen(false)}
                onSetDueDate={handleSetDueDate}
            />
        </>
    )
}
