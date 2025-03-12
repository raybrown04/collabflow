"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Task, TaskList } from "./TaskItem"
import TaskItem, { TASK_ITEM_TYPE } from "./TaskItem"
import { useDrop } from "react-dnd"
import { format, parseISO, startOfDay } from "date-fns"
import { toLocalDate } from "@/lib/dates"

interface DroppableTaskSectionProps {
    title: string
    tasks: Task[]
    taskLists: TaskList[]
    isCollapsed: boolean
    onToggleCollapse: () => void
    onComplete: (id: string, completed: boolean) => void
    onDelete: (id: string) => void
    onEdit: (task: Task) => void
    onTaskDrop: (taskId: string, newSection: string) => void
    isAdmin?: boolean
    isOwnedByCurrentUser?: (task: Task) => boolean
}

export function DroppableTaskSection({
    title,
    tasks,
    taskLists,
    isCollapsed,
    onToggleCollapse,
    onComplete,
    onDelete,
    onEdit,
    onTaskDrop,
    isAdmin = false,
    isOwnedByCurrentUser = () => true
}: DroppableTaskSectionProps) {
    // Set up drop target
    const [{ isOver, canDrop }, dropRef] = useDrop({
        accept: TASK_ITEM_TYPE,
        drop: (item: { id: string, task: Task }) => {
            // Handle the drop event without logging
            onTaskDrop(item.id, title);
            return { moved: true };
        },
        collect: (monitor: any) => ({
            isOver: monitor.isOver(),
            canDrop: monitor.canDrop()
        }),
        // Only allow dropping if the task is not already in this section
        canDrop: (item: { id: string, task: Task }) => {
            // Determine if the task is already in this section
            const task = item.task;
            const taskDate = task.due_date ? toLocalDate(task.due_date) : null;
            
            if (!taskDate && title === "Someday") {
                return false; // Already in Someday section
            }
            
            const today = startOfDay(new Date());
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            if (taskDate) {
                const taskDay = startOfDay(taskDate);
                
                if (title === "Today" && taskDay.getTime() === today.getTime()) {
                    return false; // Already in Today section
                }
                
                if (title === "Tomorrow" && taskDay.getTime() === tomorrow.getTime()) {
                    return false; // Already in Tomorrow section
                }
                
                if (title === "Upcoming" && taskDay > tomorrow) {
                    return false; // Already in Upcoming section
                }
            }
            
            return true;
        }
    });
    
    // Visual feedback for drop target
    const isActive = isOver && canDrop;
    
    return (
        <div 
            className={cn(
                "mb-4 transition-colors duration-200",
                isActive ? "bg-primary/10 rounded-lg" : "",
                canDrop && !isActive ? "bg-primary/5 rounded-lg" : ""
            )}
            ref={dropRef}
        >
            <div
                className="flex items-center justify-between py-1 cursor-pointer"
                onClick={onToggleCollapse}
            >
                <div className="flex items-center">
                    <div className="w-4 h-4 mr-1 flex items-center justify-center">
                        <svg
                            width="6"
                            height="10"
                            viewBox="0 0 6 10"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className={cn("transition-transform duration-200",
                                !isCollapsed ? "rotate-90" : ""
                            )}
                        >
                            <path d="M1.4 0L0 1.4L3.6 5L0 8.6L1.4 10L6.4 5L1.4 0Z" fill="currentColor" />
                        </svg>
                    </div>
                    <div className="font-medium text-base">{title}</div>
                </div>
                <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-xs">
                    {tasks.length}
                </div>
            </div>

            {!isCollapsed && tasks.length > 0 && (
                <div className="ml-5">
                    {tasks
                        .slice() // Create a copy to avoid mutating the original array
                        .sort((a, b) => {
                            // Sort by completion status (incomplete first)
                            if (a.completed && !b.completed) return 1;
                            if (!a.completed && b.completed) return -1;
                            return 0; // Maintain original order within each group
                        })
                        .map((task) => (
                            <TaskItem
                                key={task.id}
                                task={task}
                                taskLists={taskLists}
                                onComplete={onComplete}
                                onDelete={onDelete}
                                onEdit={onEdit}
                                isAdmin={isAdmin}
                                isOwnedByCurrentUser={isOwnedByCurrentUser(task)}
                            />
                        ))}
                </div>
            )}
            
            {/* Empty state with drop indicator */}
            {!isCollapsed && (
                <>
                    {tasks.length === 0 && (
                        <div className={cn(
                            "ml-5 py-4 flex items-center justify-center",
                            isActive ? "bg-primary/5" : ""
                        )}>
                            <p className={cn(
                                "text-sm",
                                isActive ? "text-primary" : "text-gray-400"
                            )}>
                                {isActive ? "Drop task here" : "No tasks"}
                            </p>
                        </div>
                    )}
                    
                    {/* Drop indicator for non-empty sections */}
                    {tasks.length > 0 && isActive && (
                        <div className="border-2 border-dashed border-primary/70 rounded-lg p-2 m-2 text-center text-sm text-primary bg-primary/5">
                            Drop task here to move to {title}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default DroppableTaskSection;
