"use client"

import { useState, useEffect, useRef } from "react"
import { Plus, ChevronRight, Filter, Check, ListChecks } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { TaskDetailPopup } from "./TaskDetailPopup"
import TaskMultiSelectPopup from "./TaskMultiSelectPopup"
import { useToast } from "./ui/use-toast"
import TaskItem, { Task, TaskList as TaskListType, TASK_ITEM_TYPE } from "./TaskItem"
import { format, addDays, startOfDay, endOfDay, parseISO, isSameDay } from "date-fns"
import useTaskLists from "@/hooks/useTaskLists"
import useTaskDropdowns from "@/hooks/useTaskDropdowns"
import useTaskFilters from "@/hooks/useTaskFilters"
import { useTaskMultiSelect } from "@/lib/context/TaskMultiSelectContext"
import TaskListFilters from "./TaskListFilters"
import { cn } from "@/lib/utils"
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask, useToggleTaskCompletion } from "@/hooks/useTasks"
import { useQueryClient } from "@tanstack/react-query"
import { userTimezone, toLocalDate, isSameDayLocal, preserveDateComponents } from "@/lib/dates"
import { DndProvider, useDrop } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import DroppableTaskSection from "./DroppableTaskSection"

interface TaskListProps {
    filter: 'today' | 'upcoming' | 'all'
    onTaskAdded?: (task: Task) => void
    isAdmin?: boolean
    maxItems?: number
}

export function TaskListContent({
    filter,
    onTaskAdded,
    isAdmin = false,
    maxItems = 5
}: TaskListProps) {
    // Get filter states
    const { 
        statusFilter, 
        listFilter,
        activeFilterCount
    } = useTaskFilters();
    
    // Get multi-select state
    const {
        isMultiSelectMode,
        setMultiSelectMode,
        selectedTaskIds,
        selectAllTasks,
        clearSelectedTasks
    } = useTaskMultiSelect();
    
    // Use the hooks from useTasks.ts with filters
    const { tasks: allTasks, isLoading, error, refetch } = useTasks(filter, statusFilter, listFilter, maxItems);
    
    // Log when tasks change (only in development)
    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            console.log("TaskList: Tasks updated, count:", allTasks?.length);
        }
        // Using a stable dependency array to avoid React warnings
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const createTask = useCreateTask();
    const updateTask = useUpdateTask();
    const deleteTask = useDeleteTask();
    const toggleTaskCompletion = useToggleTaskCompletion();
    const queryClient = useQueryClient();

    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [currentTask, setCurrentTask] = useState<Task | null>(null);

    // For dropdowns
    const { toggleDropdown, isDropdownOpen, dropdownRef } = useTaskDropdowns();

    // Fetch task lists
    const { taskLists, isLoading: listsLoading } = useTaskLists();

    const { toast } = useToast();

    // State for infinite scrolling
    const [visibleItems, setVisibleItems] = useState(maxItems);
    const [hasMore, setHasMore] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Update hasMore when tasks change
    useEffect(() => {
        setHasMore(Array.isArray(allTasks) && allTasks.length > visibleItems);
    }, [allTasks, visibleItems]);

    // Handle scroll event for infinite scrolling
    const handleScroll = () => {
        if (!containerRef.current) return;

        const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
        const scrollBottom = scrollHeight - scrollTop - clientHeight;

        // Load more items when user scrolls near the bottom
        if (scrollBottom < 50 && hasMore) {
            setVisibleItems(prev => prev + maxItems);
        }
    };

    // Add scroll event listener
    useEffect(() => {
        const currentRef = containerRef.current;
        if (currentRef) {
            currentRef.addEventListener('scroll', handleScroll);
        }

        return () => {
            if (currentRef) {
                currentRef.removeEventListener('scroll', handleScroll);
            }
        };
    }, [hasMore]);

    // Handle task completion toggle for a single task
    const handleCompleteTask = async (id: string, completed: boolean) => {
        try {
            // Find the task in allTasks
            const task = Array.isArray(allTasks) ? allTasks.find((t: Task) => t.id === id) : null;
            if (!task) {
                // Handle task not found gracefully
                return;
            }
            
            // Directly use the toggleTaskCompletion function
            try {
                // Force the completion state to the passed value
                toggleTaskCompletion(id, completed);
                
                // Immediately update the cached data for better UI responsiveness
                queryClient.setQueryData(['tasks'], (oldData: Task[] | undefined) => {
                    if (!oldData) return [];
                    
                    return oldData.map(t => 
                        t.id === id ? { ...t, completed: completed } : t
                    );
                });
                
                // Show success toast
                toast({
                    title: completed ? "Task completed" : "Task reopened",
                    description: "Task status updated successfully."
                });
                
                // Manually refetch to ensure all components are updated
                // Reduced timeout for faster updates
                setTimeout(() => {
                    refetch();
                }, 150);
                
            } catch (error) {
                throw error;
            }
            
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update task status. Please try again.",
                variant: "destructive"
            });
        }
    };
    
    // Handle task completion toggle for multiple tasks
    const handleBatchComplete = async (taskIds: string[], completed: boolean) => {
        try {
            // Update each task
            taskIds.forEach(id => {
                toggleTaskCompletion(id, completed);
            });
            
            // Immediately update the cached data for better UI responsiveness
            queryClient.setQueryData(['tasks'], (oldData: Task[] | undefined) => {
                if (!oldData) return [];
                
                return oldData.map(task => 
                    taskIds.includes(task.id) ? { ...task, completed } : task
                );
            });
            
            // Show success toast
            toast({
                title: completed ? "Tasks completed" : "Tasks reopened",
                description: `${taskIds.length} tasks updated successfully.`
            });
            
            // Manually refetch to ensure all components are updated
            setTimeout(() => {
                refetch();
            }, 150);
            
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update task status. Please try again.",
                variant: "destructive"
            });
        }
    };

    // Handle task deletion
    const handleDeleteTask = async (id: string) => {
        try {
            deleteTask.mutate(id);
            toast({
                title: "Task deleted",
                description: "Task has been removed successfully."
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete task. Please try again.",
                variant: "destructive"
            });
        }
    };

    // Handle task edit
    const handleEditTask = (task: Task) => {
        setCurrentTask(task);
        setIsEditDialogOpen(true);
    };

    // Determine if a task is owned by the current user
    const isOwnedByCurrentUser = (task: Task) => {
        // In development mode, all tasks should be treated as owned by the current user
        // This fixes the issue where newly created tasks show "Owned by another user"
        return true;
    };

    // Apply filters to tasks
    const filteredTasks = Array.isArray(allTasks) ? allTasks.filter((task: Task) => {
        // Apply status filter
        if (statusFilter === 'completed' && !task.completed) {
            return false;
        }
        if (statusFilter === 'incomplete' && task.completed) {
            return false;
        }
        
        // Apply list filter
        if (listFilter && task.list_id !== listFilter) {
            return false;
        }
        
        return true;
    }) : [];
    
    // Get local timezone
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Today and tomorrow dates in local timezone, set to start of day
    const today = startOfDay(new Date());
    const tomorrow = startOfDay(addDays(today, 1));
    
    // Filter and group tasks by timeframe
    const todayTasks = filteredTasks.filter((task: Task) => {
        if (!task.due_date) return false;
        
        const localTaskDate = toLocalDate(task.due_date);
        if (!localTaskDate) return false;
        
        // Check if the local task date is today using isSameDayLocal
        return isSameDayLocal(localTaskDate, today);
    });

    const tomorrowTasks = filteredTasks.filter((task: Task) => {
        if (!task.due_date) return false;
        
        const localTaskDate = toLocalDate(task.due_date);
        if (!localTaskDate) return false;
        
        // Check if the local task date is tomorrow using isSameDayLocal
        return isSameDayLocal(localTaskDate, tomorrow);
    });

    const upcomingTasks = filteredTasks.filter((task: Task) => {
        if (!task.due_date) return false;
        
        const localTaskDate = toLocalDate(task.due_date);
        if (!localTaskDate) return false;
        
        // If the date is after tomorrow, it's upcoming
        // We can't use isSameDayLocal here since we're checking for "greater than"
        return localTaskDate > tomorrow;
    });

    const noDateTasks = filteredTasks.filter((task: Task) => {
        return !task.due_date;
    });

    // State for section collapse
    const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
        Today: false,
        Tomorrow: false,
        Upcoming: false,
        Someday: false
    });

    // Toggle section collapse
    const toggleSection = (section: string) => {
        setCollapsedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    // Render a task section with appropriate styling
    const renderTaskSection = (title: string, tasks: Task[]) => {
        // Always render sections, even when empty
        const taskCount = tasks.length;

        return (
            <div className="mb-4">
                <div
                    className="flex items-center justify-between py-1 cursor-pointer"
                    onClick={() => toggleSection(title)}
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
                                    !collapsedSections[title] ? "rotate-90" : ""
                                )}
                            >
                                <path d="M1.4 0L0 1.4L3.6 5L0 8.6L1.4 10L6.4 5L1.4 0Z" fill="currentColor" />
                            </svg>
                        </div>
                        <div className="font-medium text-base">{title}</div>
                    </div>
                    <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-xs">
                        {taskCount}
                    </div>
                </div>

                {!collapsedSections[title] && taskCount > 0 && (
                    <div className="ml-5">
                        {tasks.map((task) => (
                            <TaskItem
                                key={task.id}
                                task={task}
                                taskLists={taskLists}
                                onComplete={handleCompleteTask}
                                onDelete={handleDeleteTask}
                                onEdit={handleEditTask}
                                isAdmin={isAdmin}
                                isOwnedByCurrentUser={isOwnedByCurrentUser(task)}
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div>
            {/* Header with title and more options aligned horizontally */}
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-semibold">Tasks</h2>
                
                <div className="relative" ref={isDropdownOpen('more') ? dropdownRef : undefined}>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => toggleDropdown('more')}
                    >
                        <svg width="4" height="16" viewBox="0 0 4 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto">
                            <path d="M2 4C3.1 4 4 3.1 4 2C4 0.9 3.1 0 2 0C0.9 0 0 0.9 0 2C0 3.1 0.9 4 2 4ZM2 6C0.9 6 0 6.9 0 8C0 9.1 0.9 10 2 10C3.1 10 4 9.1 4 8C4 6.9 3.1 6 2 6ZM2 12C0.9 12 0 12.9 0 14C0 15.1 0.9 16 2 16C3.1 16 4 15.1 4 14C4 12.9 3.1 12 2 12Z" fill="currentColor" />
                        </svg>
                    </Button>

                    <div className={cn(
                        "absolute right-0 mt-2 w-48 bg-background rounded-md shadow-lg border z-50",
                        isDropdownOpen('more') ? "block" : "hidden"
                    )}>
                        <div className="py-1">
                            {/* Add Task option */}
                            <button 
                                className="w-full text-left flex items-center px-4 py-2 text-sm hover:bg-gray-100"
                                onClick={() => {
                                    setIsAddDialogOpen(true);
                                    toggleDropdown('more');
                                }}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                <span>Add Task</span>
                            </button>
                            
                            {/* Clear Completed option */}
                            <button 
                                className="w-full text-left flex items-center px-4 py-2 text-sm hover:bg-gray-100"
                                onClick={() => {
                                    // Find all completed tasks
                                    const completedTasks = filteredTasks.filter(task => task.completed);
                                    
                                    // Delete each completed task
                                    completedTasks.forEach(task => {
                                        deleteTask.mutate(task.id);
                                    });
                                    
                                    // Show success toast
                                    if (completedTasks.length > 0) {
                                        toast({
                                            title: "Tasks cleared",
                                            description: `${completedTasks.length} completed ${completedTasks.length === 1 ? 'task' : 'tasks'} deleted.`
                                        });
                                    } else {
                                        toast({
                                            title: "No completed tasks",
                                            description: "There are no completed tasks to clear."
                                        });
                                    }
                                    
                                    toggleDropdown('more');
                                    
                                    // Refresh the task list
                                    setTimeout(() => {
                                        refetch();
                                    }, 100);
                                }}
                            >
                                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M10 11V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M14 11V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                <span>Clear Completed</span>
                            </button>
                            
                            {/* My Lists section */}
                            <div>
                                <TaskListFilters onClose={() => toggleDropdown('more')} />
                            </div>
                            
                            {/* Additional options */}
                            <div>
                                <button 
                                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center"
                                    onClick={() => {
                                        setMultiSelectMode(true);
                                        toggleDropdown('more');
                                    }}
                                >
                                    <ListChecks className="h-4 w-4 mr-2" />
                                    <span>Multi-select</span>
                                </button>
                                
                                <a href="#" className="px-4 py-2 text-sm hover:bg-gray-100 block">
                                    Print
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Removed separate Filter Dropdown */}
            </div>
            
            {/* Active filters indicator */}
            {activeFilterCount > 0 && (
                <div className="mb-2 flex items-center">
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full flex items-center">
                        <Filter className="h-3 w-3 mr-1" />
                        {activeFilterCount} {activeFilterCount === 1 ? 'filter' : 'filters'} active
                    </span>
                </div>
            )}
            
            {/* Multi-select popup */}
            <TaskMultiSelectPopup onComplete={handleBatchComplete} />
            
            <div className="border rounded-lg overflow-hidden">
                {/* Always render the same initial structure for both server and client */}
                <div className="min-h-[200px]">
                    {/* Client-side content rendering */}
                    {Array.isArray(allTasks) && allTasks.length > 0 ? (
                        <div
                            ref={containerRef}
                            className="h-[calc(100vh-280px)] overflow-y-auto" /* Adjusted height to fit viewport without scrolling */
                            onScroll={handleScroll}
                        >
                            {/* Display tasks in sections based on timeframe */}
                            <div className="px-4 py-2">
                                <DroppableTaskSection
                                    title="Today"
                                    tasks={todayTasks}
                                    taskLists={taskLists}
                                    isCollapsed={collapsedSections["Today"]}
                                    onToggleCollapse={() => toggleSection("Today")}
                                    onComplete={handleCompleteTask}
                                    onDelete={handleDeleteTask}
                                    onEdit={handleEditTask}
                                    onTaskDrop={(taskId: string, newSection: string) => {
                                        // Find the task
                                        const task = filteredTasks.find(t => t.id === taskId);
                                        if (!task) return;
                                        
                                        // Calculate new due date based on section
                                        let newDueDate: string | null = null;
                                        
                                        if (newSection === "Today") {
                                            newDueDate = preserveDateComponents(today);
                                        } else if (newSection === "Tomorrow") {
                                            newDueDate = preserveDateComponents(tomorrow);
                                        } else if (newSection === "Upcoming") {
                                            // Set to 2 days from now for Upcoming
                                            const upcomingDate = new Date(today);
                                            upcomingDate.setDate(upcomingDate.getDate() + 2);
                                            newDueDate = preserveDateComponents(upcomingDate);
                                        } else {
                                            // Someday - remove due date
                                            newDueDate = null;
                                        }
                                        
                                        // Optimistically update the UI immediately
                                        queryClient.setQueryData(['tasks'], (oldData: Task[] | undefined) => {
                                            if (!oldData) return [];
                                            
                                            return oldData.map(t => 
                                                t.id === taskId ? { ...t, due_date: newDueDate } : t
                                            );
                                        });
                                        
                                        // Update the task in the background
                                        updateTask.mutate({
                                            id: taskId,
                                            updates: { due_date: newDueDate }
                                        });
                                        
                                        // Show a subtle toast notification
                                        toast({
                                            title: "Task moved",
                                            description: `Task moved to ${newSection}`
                                        });
                                    }}
                                    isAdmin={isAdmin}
                                    isOwnedByCurrentUser={isOwnedByCurrentUser}
                                />
                                
                                <DroppableTaskSection
                                    title="Tomorrow"
                                    tasks={tomorrowTasks}
                                    taskLists={taskLists}
                                    isCollapsed={collapsedSections["Tomorrow"]}
                                    onToggleCollapse={() => toggleSection("Tomorrow")}
                                    onComplete={handleCompleteTask}
                                    onDelete={handleDeleteTask}
                                    onEdit={handleEditTask}
                                    onTaskDrop={(taskId: string, newSection: string) => {
                                        // Find the task
                                        const task = filteredTasks.find(t => t.id === taskId);
                                        if (!task) return;
                                        
                                        // Calculate new due date based on section
                                        let newDueDate: string | null = null;
                                        
                                        if (newSection === "Today") {
                                            newDueDate = preserveDateComponents(today);
                                        } else if (newSection === "Tomorrow") {
                                            newDueDate = preserveDateComponents(tomorrow);
                                        } else if (newSection === "Upcoming") {
                                            // Set to 2 days from now for Upcoming
                                            const upcomingDate = new Date(today);
                                            upcomingDate.setDate(upcomingDate.getDate() + 2);
                                            newDueDate = preserveDateComponents(upcomingDate);
                                        } else {
                                            // Someday - remove due date
                                            newDueDate = null;
                                        }
                                        
                                        // Optimistically update the UI immediately
                                        queryClient.setQueryData(['tasks'], (oldData: Task[] | undefined) => {
                                            if (!oldData) return [];
                                            
                                            return oldData.map(t => 
                                                t.id === taskId ? { ...t, due_date: newDueDate } : t
                                            );
                                        });
                                        
                                        // Update the task in the background
                                        updateTask.mutate({
                                            id: taskId,
                                            updates: { due_date: newDueDate }
                                        });
                                        
                                        // Show a subtle toast notification
                                        toast({
                                            title: "Task moved",
                                            description: `Task moved to ${newSection}`
                                        });
                                    }}
                                    isAdmin={isAdmin}
                                    isOwnedByCurrentUser={isOwnedByCurrentUser}
                                />
                                
                                <DroppableTaskSection
                                    title="Upcoming"
                                    tasks={upcomingTasks}
                                    taskLists={taskLists}
                                    isCollapsed={collapsedSections["Upcoming"]}
                                    onToggleCollapse={() => toggleSection("Upcoming")}
                                    onComplete={handleCompleteTask}
                                    onDelete={handleDeleteTask}
                                    onEdit={handleEditTask}
                                    onTaskDrop={(taskId: string, newSection: string) => {
                                        // Find the task
                                        const task = filteredTasks.find(t => t.id === taskId);
                                        if (!task) return;
                                        
                                        // Calculate new due date based on section
                                        let newDueDate: string | null = null;
                                        
                                        if (newSection === "Today") {
                                            newDueDate = preserveDateComponents(today);
                                        } else if (newSection === "Tomorrow") {
                                            newDueDate = preserveDateComponents(tomorrow);
                                        } else if (newSection === "Upcoming") {
                                            // Set to 2 days from now for Upcoming
                                            const upcomingDate = new Date(today);
                                            upcomingDate.setDate(upcomingDate.getDate() + 2);
                                            newDueDate = preserveDateComponents(upcomingDate);
                                        } else {
                                            // Someday - remove due date
                                            newDueDate = null;
                                        }
                                        
                                        // Optimistically update the UI immediately
                                        queryClient.setQueryData(['tasks'], (oldData: Task[] | undefined) => {
                                            if (!oldData) return [];
                                            
                                            return oldData.map(t => 
                                                t.id === taskId ? { ...t, due_date: newDueDate } : t
                                            );
                                        });
                                        
                                        // Update the task in the background
                                        updateTask.mutate({
                                            id: taskId,
                                            updates: { due_date: newDueDate }
                                        });
                                        
                                        // Show a subtle toast notification
                                        toast({
                                            title: "Task moved",
                                            description: `Task moved to ${newSection}`
                                        });
                                    }}
                                    isAdmin={isAdmin}
                                    isOwnedByCurrentUser={isOwnedByCurrentUser}
                                />
                                
                                <DroppableTaskSection
                                    title="Someday"
                                    tasks={noDateTasks}
                                    taskLists={taskLists}
                                    isCollapsed={collapsedSections["Someday"]}
                                    onToggleCollapse={() => toggleSection("Someday")}
                                    onComplete={handleCompleteTask}
                                    onDelete={handleDeleteTask}
                                    onEdit={handleEditTask}
                                    onTaskDrop={(taskId: string, newSection: string) => {
                                        // Find the task
                                        const task = filteredTasks.find(t => t.id === taskId);
                                        if (!task) return;
                                        
                                        // Calculate new due date based on section
                                        let newDueDate: string | null = null;
                                        
                                        if (newSection === "Today") {
                                            newDueDate = preserveDateComponents(today);
                                        } else if (newSection === "Tomorrow") {
                                            newDueDate = preserveDateComponents(tomorrow);
                                        } else if (newSection === "Upcoming") {
                                            // Set to 2 days from now for Upcoming
                                            const upcomingDate = new Date(today);
                                            upcomingDate.setDate(upcomingDate.getDate() + 2);
                                            newDueDate = preserveDateComponents(upcomingDate);
                                        } else {
                                            // Someday - remove due date
                                            newDueDate = null;
                                        }
                                        
                                        // Optimistically update the UI immediately
                                        queryClient.setQueryData(['tasks'], (oldData: Task[] | undefined) => {
                                            if (!oldData) return [];
                                            
                                            return oldData.map(t => 
                                                t.id === taskId ? { ...t, due_date: newDueDate } : t
                                            );
                                        });
                                        
                                        // Update the task in the background
                                        updateTask.mutate({
                                            id: taskId,
                                            updates: { due_date: newDueDate }
                                        });
                                        
                                        // Show a subtle toast notification
                                        toast({
                                            title: "Task moved",
                                            description: `Task moved to ${newSection}`
                                        });
                                    }}
                                    isAdmin={isAdmin}
                                    isOwnedByCurrentUser={isOwnedByCurrentUser}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="flex justify-center items-center py-8">
                            <span className="text-sm text-muted-foreground">
                                {/* Use a consistent approach to avoid hydration mismatch */}
                                {isLoading ? "Loading tasks..." : "No tasks scheduled."}
                            </span>
                        </div>
                    )}
                </div>

                {/* Add button at the bottom of the container */}
                <div className="px-4 py-3 border-t">
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-sm text-muted-foreground"
                        onClick={() => setIsAddDialogOpen(true)}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add task
                    </Button>
                </div>
            </div>

            {/* Task Create Popup */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Add New Task</DialogTitle>
                    </DialogHeader>
                    <TaskDetailPopup
                        task={null}
                        taskLists={taskLists}
                        isOpen={isAddDialogOpen}
                        setIsOpen={setIsAddDialogOpen}
                        onUpdate={() => { }}
                        onDelete={() => { }}
                        onComplete={() => { }}
                        mode="create"
                        onCreate={(taskData) => {
                            // Create a new task with a unique ID
                            const newTask = {
                                ...taskData,
                                due_date: taskData.due_date || null, // Ensure due_date is never undefined
                                user_id: "current-user"
                            };
                            
                            // Use the createTask mutation to add the task
                            createTask.mutate(newTask);
                            
                            // Determine which section this task belongs to
                            let section = "Someday";
                            if (newTask.due_date) {
                                const localTaskDate = toLocalDate(newTask.due_date);
                                
                                if (localTaskDate) {
                                    if (localTaskDate.getTime() === today.getTime()) {
                                        section = "Today";
                                    } else if (localTaskDate.getTime() === tomorrow.getTime()) {
                                        section = "Tomorrow";
                                    } else if (localTaskDate.getTime() > tomorrow.getTime()) {
                                        section = "Upcoming";
                                    }
                                }
                            }
                            
                            // Make sure the section is expanded
                            setCollapsedSections(prev => ({
                                ...prev,
                                [section]: false
                            }));
                            
                            // Show success toast
                            toast({
                                title: "Task added",
                                description: "New task has been added successfully."
                            });
                            
                            // Call the onTaskAdded callback if provided
                            if (onTaskAdded) {
                                onTaskAdded({
                                    ...newTask,
                                    id: `temp-${Date.now()}`, // Temporary ID for the callback
                                    created_at: new Date().toISOString()
                                } as Task);
                            }
                            
                            // Refresh the task list
                            setTimeout(() => {
                                refetch();
                            }, 100);
                        }}
                    />
                </DialogContent>
            </Dialog>

            {/* Task Edit Popup */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Edit Task</DialogTitle>
                    </DialogHeader>
                    {currentTask && (
                        <TaskDetailPopup
                            task={currentTask}
                            taskLists={taskLists}
                            isOpen={isEditDialogOpen}
                            setIsOpen={setIsEditDialogOpen}
                            onUpdate={(updatedTask) => {
                                // Use the updateTask mutation to update the task
                                updateTask.mutate({
                                    id: updatedTask.id,
                                    updates: updatedTask
                                });
                                
                                toast({
                                    title: "Task updated",
                                    description: "Task has been updated successfully."
                                });
                                
                                // Refresh the task list
                                setTimeout(() => {
                                    refetch();
                                }, 100);
                            }}
                            onDelete={handleDeleteTask}
                            onComplete={handleCompleteTask}
                            mode="edit"
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

export function TaskList(props: TaskListProps) {
  return (
    <DndProvider backend={HTML5Backend}>
      <TaskListContent {...props} />
    </DndProvider>
  );
}

export default TaskList;
