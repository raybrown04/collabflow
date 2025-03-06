"use client"

import { useState, useEffect, useRef } from "react"
import { Plus, Loader2, Filter, ChevronRight, User, Tag, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import TaskDetailPopup from "./TaskDetailPopup"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "./ui/use-toast"
import TaskItem, { Task, TaskList as TaskListType } from "./TaskItem"
import { format, addDays, startOfDay, endOfDay } from "date-fns"
import useTaskLists from "@/hooks/useTaskLists"
import useTaskDropdowns from "@/hooks/useTaskDropdowns"
import { cn } from "@/lib/utils"

// Development mode detection
const isDevelopment = typeof window !== 'undefined' && window.location.hostname === 'localhost'

// Mock tasks for development mode
const mockTasks: Task[] = [
    {
        id: "dev-1",
        title: "Complete dashboard implementation",
        description: "Finish implementing the dashboard components according to the mockup",
        due_date: new Date().toISOString(),
        completed: false,
        priority: "high",
        user_id: "current-user"
    },
    {
        id: "dev-2",
        title: "Update Supabase schema",
        description: "Add tasks table and implement RLS policies",
        due_date: new Date().toISOString(),
        completed: true,
        priority: "medium",
        user_id: "current-user"
    },
    {
        id: "dev-3",
        title: "Review AI integration plan",
        description: "Check the AI integration plan and provide feedback",
        due_date: addDays(new Date(), 1).toISOString(),
        completed: false,
        priority: "low",
        user_id: "current-user"
    },
    {
        id: "dev-4",
        title: "Prepare for team meeting",
        description: "Create agenda and gather project updates",
        due_date: addDays(new Date(), 1).toISOString(),
        completed: false,
        priority: "medium",
        user_id: "current-user"
    },
    {
        id: "dev-5",
        title: "Another user's task",
        description: "This task belongs to another user",
        due_date: new Date().toISOString(),
        completed: false,
        priority: "medium",
        user_id: "other-user"
    }
]

interface TaskListProps {
    filter: 'today' | 'upcoming' | 'all'
    onTaskAdded?: (task: Task) => void
    isAdmin?: boolean
    maxItems?: number
}

export function TaskList({
    filter,
    onTaskAdded,
    isAdmin = false,
    maxItems = 5
}: TaskListProps) {
    const [tasks, setTasks] = useState<Task[]>([])
    const [filteredTasks, setFilteredTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState(true)
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [currentTask, setCurrentTask] = useState<Task | null>(null)

    // For dropdowns
    const { toggleDropdown, isDropdownOpen, dropdownRef } = useTaskDropdowns()

    // Fetch task lists
    const { taskLists, isLoading: listsLoading } = useTaskLists()

    const { toast } = useToast()

    // Fetch tasks on component mount
    useEffect(() => {
        const fetchTasks = async () => {
            try {
                if (isDevelopment) {
                    // In development mode, use mock data
                    console.log("Development mode: Using mock tasks")
                    setTimeout(() => {
                        setTasks(mockTasks)
                        setLoading(false)
                    }, 500)
                } else {
                    // In production, fetch from Supabase
                    // This would be implemented with a custom hook like useTasks
                    setLoading(false)
                }
            } catch (error) {
                console.error("Error fetching tasks:", error)
                toast({
                    title: "Error",
                    description: "Failed to load tasks. Please try again.",
                    variant: "destructive"
                })
                setLoading(false)
            }
        }

        fetchTasks()
    }, [toast])

    // State for infinite scrolling
    const [visibleItems, setVisibleItems] = useState(maxItems)
    const [hasMore, setHasMore] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    // Filter tasks based on the filter prop
    useEffect(() => {
        if (!tasks.length) {
            setFilteredTasks([])
            return
        }

        const today = startOfDay(new Date())
        const tomorrow = startOfDay(addDays(new Date(), 1))

        let filtered = tasks

        // Filter by ownership if not admin
        if (!isAdmin) {
            filtered = filtered.filter(task => task.user_id === "current-user")
        }

        // Filter by date
        if (filter === 'today') {
            filtered = filtered.filter(task => {
                const taskDate = startOfDay(new Date(task.due_date || ""))
                return taskDate.getTime() === today.getTime()
            })
        } else if (filter === 'upcoming') {
            filtered = filtered.filter(task => {
                const taskDate = startOfDay(new Date(task.due_date || ""))
                // Include tomorrow and beyond
                return taskDate.getTime() >= tomorrow.getTime()
            })
        }

        // Sort by priority and completion status
        filtered.sort((a, b) => {
            // Completed tasks go to the bottom
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1
            }

            // Sort by priority (high > medium > low)
            const priorityOrder = { high: 0, medium: 1, low: 2 }
            return priorityOrder[a.priority] - priorityOrder[b.priority]
        })

        setFilteredTasks(filtered)
        setHasMore(filtered.length > visibleItems)
    }, [tasks, filter, isAdmin, visibleItems])

    // Handle scroll event for infinite scrolling
    const handleScroll = () => {
        if (!containerRef.current) return

        const { scrollTop, scrollHeight, clientHeight } = containerRef.current
        const scrollBottom = scrollHeight - scrollTop - clientHeight

        // Load more items when user scrolls near the bottom
        if (scrollBottom < 50 && hasMore) {
            setVisibleItems(prev => prev + maxItems)
        }
    }

    // Add scroll event listener
    useEffect(() => {
        const currentRef = containerRef.current
        if (currentRef) {
            currentRef.addEventListener('scroll', handleScroll)
        }

        return () => {
            if (currentRef) {
                currentRef.removeEventListener('scroll', handleScroll)
            }
        }
    }, [hasMore])

    // Handle task completion toggle
    const handleCompleteTask = async (id: string, completed: boolean) => {
        try {
            if (isDevelopment) {
                // Update local state in development mode
                setTasks(prev => prev.map(task =>
                    task.id === id ? { ...task, completed } : task
                ))

                toast({
                    title: completed ? "Task completed" : "Task reopened",
                    description: "Task status updated successfully."
                })
            } else {
                // In production, update in Supabase
                // This would be implemented with a custom hook like useUpdateTask
            }
        } catch (error) {
            console.error("Error updating task:", error)
            toast({
                title: "Error",
                description: "Failed to update task status. Please try again.",
                variant: "destructive"
            })
        }
    }

    // Handle task deletion
    const handleDeleteTask = async (id: string) => {
        try {
            if (isDevelopment) {
                // Update local state in development mode
                setTasks(prev => prev.filter(task => task.id !== id))

                toast({
                    title: "Task deleted",
                    description: "Task has been removed successfully."
                })
            } else {
                // In production, delete from Supabase
                // This would be implemented with a custom hook like useDeleteTask
            }
        } catch (error) {
            console.error("Error deleting task:", error)
            toast({
                title: "Error",
                description: "Failed to delete task. Please try again.",
                variant: "destructive"
            })
        }
    }

    // Handle task edit
    const handleEditTask = (task: Task) => {
        setCurrentTask(task)
        setIsEditDialogOpen(true)
    }

    // Get the title for the task list based on the filter
    const getListTitle = () => {
        switch (filter) {
            case 'today':
                return "Today"
            case 'upcoming':
                return "Upcoming"
            case 'all':
                return "All Tasks"
            default:
                return "Tasks"
        }
    }

    // Determine if a task is owned by the current user
    const isOwnedByCurrentUser = (task: Task) => {
        return task.user_id === "current-user"
    }

    // Filter and group tasks by timeframe
    const todayTasks = filteredTasks.filter(task => {
        if (!task.due_date) return false;
        const taskDate = startOfDay(new Date(task.due_date));
        return taskDate.getTime() === startOfDay(new Date()).getTime();
    });

    const tomorrowTasks = filteredTasks.filter(task => {
        if (!task.due_date) return false;
        const taskDate = startOfDay(new Date(task.due_date));
        return taskDate.getTime() === startOfDay(addDays(new Date(), 1)).getTime();
    });

    const upcomingTasks = filteredTasks.filter(task => {
        if (!task.due_date) return false;
        const taskDate = startOfDay(new Date(task.due_date));
        const tomorrow = startOfDay(addDays(new Date(), 1));
        return taskDate > tomorrow;
    });

    const somedayTasks = filteredTasks.filter(task => !task.due_date);

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
        <div className="border rounded-lg overflow-hidden">
            {/* Header with filter, view, and more options */}
            <div className="px-4 py-3 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="font-medium">Tasks</div>
                </div>
                <div className="flex items-center gap-2">
                    {/* View Button removed, Add Task button repositioned */}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={() => setIsAddDialogOpen(true)}
                    >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Task
                    </Button>

                    {/* Filter Button & Dropdown */}
                    <div className="relative" ref={isDropdownOpen('filter') ? dropdownRef : undefined}>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs"
                            onClick={() => toggleDropdown('filter')}
                        >
                            Filter
                        </Button>

                        {isDropdownOpen('filter') && (
                            <div className="absolute right-0 mt-2 w-48 bg-background rounded-md shadow-lg border z-50">
                                <div className="py-1">
                                    <div className="px-4 py-2 flex items-center justify-between hover:bg-gray-100">
                                        <div className="flex items-center">
                                            <User className="h-4 w-4 mr-2" />
                                            <span>My lists</span>
                                        </div>
                                        <ChevronRight className="h-4 w-4" />
                                    </div>
                                    <div className="px-4 py-2 flex items-center justify-between hover:bg-gray-100">
                                        <div className="flex items-center">
                                            <Tag className="h-4 w-4 mr-2" />
                                            <span>Tags</span>
                                        </div>
                                        <ChevronRight className="h-4 w-4" />
                                    </div>
                                    <div className="px-4 py-2 flex items-center justify-between hover:bg-gray-100">
                                        <div className="flex items-center">
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            <span>Status</span>
                                        </div>
                                        <ChevronRight className="h-4 w-4" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* More Options Button & Dropdown */}
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

                        {isDropdownOpen('more') && (
                            <div className="absolute right-0 mt-2 w-48 bg-background rounded-md shadow-lg border z-50">
                                <div className="py-1">
                                    <a href="#" className="flex items-center px-4 py-2 text-sm hover:bg-gray-100">
                                        <span className="mr-2">Layout</span>
                                        <span className="ml-auto text-xs text-muted-foreground">Default</span>
                                    </a>
                                    <a href="#" className="flex items-center px-4 py-2 text-sm hover:bg-gray-100">
                                        <span>Multi-select</span>
                                    </a>
                                    <a href="#" className="flex items-center px-4 py-2 text-sm hover:bg-gray-100">
                                        <span>Print</span>
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            ) : filteredTasks.length > 0 ? (
                <div
                    ref={containerRef}
                    className="h-[500px] overflow-y-auto" /* Fixed height instead of max-height */
                    onScroll={handleScroll}
                >
                    {/* Display tasks in sections based on timeframe */}
                    <div className="px-4 py-2">
                        {renderTaskSection("Today", todayTasks)}
                        {renderTaskSection("Tomorrow", tomorrowTasks)}
                        {renderTaskSection("Upcoming", upcomingTasks)}
                        {renderTaskSection("Someday", somedayTasks)}
                    </div>
                </div>
            ) : (
                <div className="text-sm text-muted-foreground text-center py-8">
                    No tasks scheduled.
                </div>
            )}

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

            {/* Task Create Popup */}
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
                    const newTask: Task = {
                        id: `dev-${Date.now()}`,
                        ...taskData,
                        user_id: "current-user"
                    }

                    if (isDevelopment) {
                        setTasks(prev => [...prev, newTask])
                        toast({
                            title: "Task added",
                            description: "New task has been added successfully."
                        })
                    }

                    if (onTaskAdded) {
                        onTaskAdded(newTask)
                    }
                }}
            />

            {/* Task Edit Popup */}
            <TaskDetailPopup
                task={currentTask}
                taskLists={taskLists}
                isOpen={isEditDialogOpen}
                setIsOpen={setIsEditDialogOpen}
                onUpdate={(updatedTask) => {
                    if (isDevelopment) {
                        setTasks(prev => prev.map(task =>
                            task.id === updatedTask.id ? updatedTask : task
                        ))

                        toast({
                            title: "Task updated",
                            description: "Task has been updated successfully."
                        })
                    }
                }}
                onDelete={handleDeleteTask}
                onComplete={handleCompleteTask}
                mode="edit"
            />
        </div>
    )
}

export default TaskList
