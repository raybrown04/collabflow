"use client"

import { useState } from "react"
import { Check, Trash, Edit, Clock, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

export interface Task {
    id: string
    title: string
    description?: string
    due_date?: string | null
    completed: boolean
    priority: 'low' | 'medium' | 'high'
    user_id: string
}

interface TaskItemProps {
    task: Task
    onComplete: (id: string, completed: boolean) => void
    onDelete: (id: string) => void
    onEdit: (task: Task) => void
    isAdmin?: boolean
    isOwnedByCurrentUser?: boolean
}

export function TaskItem({
    task,
    onComplete,
    onDelete,
    onEdit,
    isAdmin = false,
    isOwnedByCurrentUser = true
}: TaskItemProps) {
    const [isHovered, setIsHovered] = useState(false)

    // Format the due date if it exists
    const formattedDueDate = task.due_date
        ? format(new Date(task.due_date), "MMM d, yyyy h:mm a")
        : null

    // Determine if the task is due today
    const isToday = task.due_date
        ? new Date(task.due_date).toDateString() === new Date().toDateString()
        : false

    // Determine if the task is due tomorrow
    const isTomorrow = task.due_date
        ? new Date(task.due_date).toDateString() === new Date(Date.now() + 86400000).toDateString()
        : false

    // Format date as "Wednesday, June 3" for dates beyond tomorrow
    const formattedDay = task.due_date && !isToday && !isTomorrow
        ? format(new Date(task.due_date), "EEEE, MMMM d")
        : null

    // Determine if the task is overdue
    const isOverdue = task.due_date
        ? new Date(task.due_date) < new Date() && !task.completed
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

    // Determine if the current user can edit/delete this task
    const canModify = isAdmin || isOwnedByCurrentUser

    return (
        <Card
            className={cn(
                "p-4 transition-all duration-200 border-l-4",
                task.completed ? "border-l-green-500 bg-green-50 dark:bg-green-950/20" :
                    isOverdue ? "border-l-red-500 bg-red-50 dark:bg-red-950/20" :
                        `border-l-${getPriorityColor().replace('bg-', '')}`
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="flex items-start gap-3">
                <div
                    className={cn(
                        "flex-shrink-0 w-5 h-5 mt-0.5 rounded-full border cursor-pointer flex items-center justify-center",
                        task.completed ? "bg-green-500 border-green-500" : "border-gray-300 hover:border-gray-500"
                    )}
                    onClick={() => canModify && onComplete(task.id, !task.completed)}
                >
                    {task.completed && <Check className="h-3 w-3 text-white" />}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                        <h3 className={cn(
                            "font-medium text-sm",
                            task.completed && "line-through text-gray-500"
                        )}>
                            {task.title}
                        </h3>

                        <div className="flex items-center gap-1 ml-2">
                            <div className={cn(
                                "w-2 h-2 rounded-full",
                                getPriorityColor()
                            )} />

                            {(isHovered || isOverdue) && canModify && (
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={() => onEdit(task)}
                                    >
                                        <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => onDelete(task.id)}
                                    >
                                        <Trash className="h-3 w-3" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    {task.description && (
                        <p className={cn(
                            "text-xs text-gray-500 mt-1 line-clamp-2",
                            task.completed && "line-through"
                        )}>
                            {task.description}
                        </p>
                    )}

                    {formattedDueDate && (
                        <div className="flex items-center mt-2 text-xs text-gray-500">
                            {isOverdue ? (
                                <Clock className="h-3 w-3 mr-1 text-red-500" />
                            ) : (
                                <Calendar className="h-3 w-3 mr-1" />
                            )}
                            <span className={cn(
                                isOverdue && !task.completed ? "text-red-500 font-medium" : "",
                                task.completed && "line-through"
                            )}>
                                {isToday ? "Today" : isTomorrow ? "Tomorrow" : formattedDay || formattedDueDate}
                            </span>
                        </div>
                    )}

                    {!isOwnedByCurrentUser && (
                        <div className="mt-2 text-xs text-gray-500 italic">
                            Owned by another user
                        </div>
                    )}
                </div>
            </div>
        </Card>
    )
}

export default TaskItem
