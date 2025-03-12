"use client"

import { useState, useRef, useEffect } from "react"
import { Check, Trash, Edit, Calendar, Clock, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { format, parseISO, isSameDay, addDays } from "date-fns"
import { useTaskMultiSelect } from "@/lib/context/TaskMultiSelectContext"
import { toLocalDate } from "@/lib/dates"
import { useDrag } from "react-dnd"

export interface Task {
    id: string
    title: string
    description?: string
    due_date?: string | null
    completed: boolean
    priority: 'low' | 'medium' | 'high'
    user_id: string
    list_id?: string | null
    recurrence_rule?: string | null
    subtasks?: { id: string; text: string; completed: boolean }[]
    isRecurringInstance?: boolean // Flag for tasks that are instances of a recurring task
}

export interface TaskList {
    id: string;
    name: string;
    color: string;
    user_id: string;
    created_at: string;
}

interface TaskItemProps {
    task: Task
    taskLists?: TaskList[]
    onComplete: (id: string, completed: boolean) => void
    onDelete: (id: string) => void
    onEdit: (task: Task) => void
    isAdmin?: boolean
    isOwnedByCurrentUser?: boolean
}

// Define the drag item type
export const TASK_ITEM_TYPE = "TASK_ITEM";

export function TaskItem({
    task,
    taskLists = [],
    onComplete,
    onDelete,
    onEdit,
    isAdmin = false,
    isOwnedByCurrentUser = true
}: TaskItemProps) {
    // Set up drag source with React DnD
    const [{ isDragging }, dragRef] = useDrag({
        type: TASK_ITEM_TYPE,
        item: () => {
            return {
                id: task.id,
                due_date: task.due_date,
                task: task
            };
        },
        collect: (monitor: any) => ({
            isDragging: monitor.isDragging()
        }),
        canDrag: () => isOwnedByCurrentUser && !isMultiSelectMode
    });
    const [isHovered, setIsHovered] = useState(false)
    const [isCompletionAnimating, setIsCompletionAnimating] = useState(false)
    const checkboxRef = useRef<HTMLButtonElement>(null)
    
    // Get multi-select state
    const { 
        isMultiSelectMode, 
        selectedTaskIds, 
        toggleTaskSelection 
    } = useTaskMultiSelect()
    
    // Check if this task is selected
    const isSelected = selectedTaskIds.includes(task.id)
    
    // Helper to parse due date safely
    const parseDueDate = (dueDateStr: string | null | undefined) => {
        if (!dueDateStr) return null;
        try {
            // Use our consistent date utility function
            return toLocalDate(dueDateStr);
        } catch (e) {
            console.error(`TaskItem: Error parsing due date: ${dueDateStr}`, e);
            return null;
        }
    };
    
    // Format the due date if it exists
    const formattedDueDate = task.due_date && parseDueDate(task.due_date)
        ? format(parseDueDate(task.due_date)!, "MMM d, yyyy")
        : null

    // Get due date as Date object
    const dueDate = parseDueDate(task.due_date);
    
    // Current date (at start of day for comparison)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Tomorrow date
    const tomorrow = addDays(today, 1);
    
    // Determine if the task is due today using date-fns isSameDay
    const isToday = dueDate ? isSameDay(dueDate, today) : false;
    
    // Determine if the task is due tomorrow using date-fns isSameDay
    const isTomorrow = dueDate ? isSameDay(dueDate, tomorrow) : false;
    
    // Log for debugging in development mode only
    useEffect(() => {
        if (process.env.NODE_ENV === 'development' && dueDate) {
            console.log(`TaskItem ${task.id} - ${task.title}`);
            console.log(`  Due date: ${dueDate.toISOString()}`);
            console.log(`  Is today: ${isToday}, Is tomorrow: ${isTomorrow}`);
        }
        // Using a stable dependency array to avoid React warnings
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Format date as "Wednesday, June 3" for dates beyond tomorrow
    const formattedDay = dueDate && !isToday && !isTomorrow
        ? format(dueDate, "EEEE, MMMM d")
        : null

    // Determine if the task is overdue
    const isOverdue = dueDate
        ? dueDate < new Date() && !task.completed
        : false

    // Get priority color
    const getPriorityColor = () => {
        switch (task.priority) {
            case 'high':
                return 'bg-red-500'
            case 'medium':
                return 'bg-yellow-500'
            case 'low':
                return 'bg-green-500'
            default:
                return 'bg-blue-500'
        }
    }

    // Get task list color
    const getTaskListColor = () => {
        if (task.list_id && taskLists.length > 0) {
            const list = taskLists.find(list => list.id === task.list_id)
            return list?.color || 'bg-gray-300'
        }
        return 'bg-gray-300'
    }

    // Determine if the current user can edit/delete this task
    const canModify = isAdmin || isOwnedByCurrentUser

    // Local state to track task completion for immediate UI feedback
    const [localCompleted, setLocalCompleted] = useState(task.completed);
    
    // Update local state when task prop changes
    useEffect(() => {
        setLocalCompleted(task.completed);
    }, [task.completed]);
    
    // Handle task completion toggle with animation
    const handleComplete = (e: React.MouseEvent) => {
        // Stop event propagation to prevent opening the edit dialog
        e.stopPropagation();
        e.preventDefault();
        
        if (!canModify) {
            return;
        }
        
        // Start animation immediately
        setIsCompletionAnimating(true);
        
        // Update local state immediately for responsive UI feedback
        const newCompletedState = !localCompleted;
        setLocalCompleted(newCompletedState);
        
        // Call the parent completion handler immediately
        try {
            // Call the parent handler right away
            onComplete(task.id, newCompletedState);
            
            // End animation after a shorter delay
            setTimeout(() => {
                setIsCompletionAnimating(false);
            }, 150); // Reduced from 300ms to 150ms for faster feedback
        } catch (error) {
            // Reset animation and local state on error
            setIsCompletionAnimating(false);
            setLocalCompleted(task.completed);
        }
    };

    // Handle task edit
    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation()
        e.preventDefault()
        onEdit(task)
    }

    // Handle task delete
    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation()
        e.preventDefault()
        onDelete(task.id)
    }

    // Focus the checkbox when using keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Enter' && document.activeElement === checkboxRef.current) {
                handleComplete(e as unknown as React.MouseEvent)
            }
        }
        
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [task.id, localCompleted, handleComplete])

    // Handle task click in multi-select mode
    const handleTaskClick = (e: React.MouseEvent) => {
        if (isMultiSelectMode) {
            e.stopPropagation();
            e.preventDefault();
            toggleTaskSelection(task.id);
        } else {
            handleEdit(e);
        }
    };

    return (
        <div
            ref={dragRef}
            className={cn(
                "px-4 py-3 transition-all duration-200 relative group",
                task.completed ? "bg-gray-50" : isOverdue ? "bg-red-50/10" : "bg-transparent",
                isHovered && "bg-gray-50/80",
                isMultiSelectMode && isSelected && "bg-primary/10",
                isDragging && "opacity-50 border border-dashed border-primary bg-primary/5"
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={handleTaskClick}
        >
            <div className="flex items-start gap-3">
                {/* Drag handle */}
                {!isMultiSelectMode && isOwnedByCurrentUser && (
                    <div 
                        className={cn(
                            "flex-shrink-0 mt-1 cursor-grab transition-opacity duration-200",
                            isDragging ? "opacity-100" : "opacity-0 group-hover:opacity-70"
                        )}
                    >
                        <GripVertical className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    </div>
                )}
                
                {/* Accessible checkbox implementation with ripple effect */}
                <div className="flex-shrink-0 mt-0.5 relative">
                    <button
                        ref={checkboxRef}
                        type="button"
                        aria-checked={task.completed}
                        role="checkbox"
                        className={cn(
                            "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary",
                            "relative z-10"
                        )}
                        onClick={handleComplete}
                        aria-label={task.completed ? `Mark "${task.title}" as incomplete` : `Mark "${task.title}" as complete`}
                        tabIndex={0}
                    >
                        <div
                            className={cn(
                                "w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-200",
                                localCompleted 
                                    ? "bg-green-500 border-green-500" 
                                    : "border-gray-300 hover:border-gray-500",
                                isCompletionAnimating && "scale-110"
                            )}
                        >
                            {localCompleted && (
                                <Check className={cn(
                                    "h-3 w-3 text-white transition-opacity duration-100", // Reduced from 200ms to 100ms
                                    isCompletionAnimating ? "opacity-50" : "opacity-100" // Changed from opacity-0 to opacity-50 for better visibility
                                )} />
                            )}
                        </div>
                    </button>
                    
                    {/* Ripple effect on completion - optimized animation */}
                    {isCompletionAnimating && (
                        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-green-500/30 rounded-full animate-ping" />
                    )}
                </div>

                {/* Task content - clickable to open edit dialog or select in multi-select mode */}
                <div 
                    className="flex-1 min-w-0 cursor-pointer"
                >
                    <div className="flex items-center justify-between">
                        <h3 className={cn(
                            "font-medium text-sm transition-all duration-200",
                            localCompleted && "line-through text-gray-400"
                        )}>
                            {task.title}
                        </h3>

                        <div className="flex items-center gap-1 ml-2">
                            {/* Show multi-select checkbox when in multi-select mode */}
                            {isMultiSelectMode ? (
                                <div className="flex items-center">
                                    <div 
                                        className={cn(
                                            "w-5 h-5 rounded border flex items-center justify-center",
                                            isSelected 
                                                ? "bg-primary border-primary" 
                                                : "border-gray-300"
                                        )}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleTaskSelection(task.id);
                                        }}
                                    >
                                        {isSelected && <Check className="h-3 w-3 text-white" />}
                                    </div>
                                </div>
                            ) : (
                                /* Show icons on hover when not in multi-select mode */
                                isHovered && canModify && (
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 hover:bg-gray-200"
                                            onClick={handleEdit}
                                            aria-label={`Edit task "${task.title}"`}
                                        >
                                            <Edit className="h-3 w-3" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                                            onClick={handleDelete}
                                            aria-label={`Delete task "${task.title}"`}
                                        >
                                            <Trash className="h-3 w-3" />
                                        </Button>
                                    </div>
                                )
                            )}
                        </div>
                    </div>

                    {/* Task metadata row */}
                    <div className="mt-1 flex items-center gap-4 text-xs text-gray-500 pl-0">
                        {/* Task list indicator */}
                        {task.list_id && taskLists.length > 0 && (
                            <div className="flex items-center gap-0">
                                <span 
                                    className={cn(
                                        "w-2 h-2 rounded-full",
                                        getTaskListColor()
                                    )}
                                ></span>
                                <span className="text-gray-500">
                                    {taskLists.find(list => list.id === task.list_id)?.name || "Personal"}
                                </span>
                            </div>
                        )}
                        
                        {/* Due date indicator */}
                        {task.due_date && (
                            <div className={cn(
                                "flex items-center gap-1",
                                isOverdue && !task.completed && "text-red-500"
                            )}>
                                <Clock className="h-3 w-3" />
                                <span>
                                    {isToday ? "Today" : 
                                     isTomorrow ? "Tomorrow" : 
                                     formattedDay}
                                </span>
                                {/* Show recurring icon for recurring tasks */}
                                {(task.recurrence_rule || task.isRecurringInstance) && (
                                    <span title="Recurring task" className="ml-1 text-gray-400">
                                        ↻
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Ownership indicator */}
                    {!isOwnedByCurrentUser && (
                        <div className="mt-1 text-xs text-gray-500 italic">
                            Owned by another user
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default TaskItem
