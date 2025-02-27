"use client"

import { useState, useEffect, useRef } from "react"
import { Plus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "./ui/use-toast"
import TaskItem, { Task } from "./TaskItem"
import { format, addDays, startOfDay, endOfDay } from "date-fns"

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

    // Form state
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [dueDate, setDueDate] = useState("")
    const [dueTime, setDueTime] = useState("")
    const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')

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
        setTitle(task.title)
        setDescription(task.description || "")

        if (task.due_date) {
            const date = new Date(task.due_date)
            setDueDate(format(date, "yyyy-MM-dd"))
            setDueTime(format(date, "HH:mm"))
        } else {
            setDueDate("")
            setDueTime("")
        }

        setPriority(task.priority)
        setIsEditDialogOpen(true)
    }

    // Reset form fields
    const resetForm = () => {
        setTitle("")
        setDescription("")
        setDueDate("")
        setDueTime("")
        setPriority("medium")
        setCurrentTask(null)
    }

    // Handle form submission for adding/editing tasks
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!title.trim()) {
            toast({
                title: "Error",
                description: "Task title is required.",
                variant: "destructive"
            })
            return
        }

        try {
            let dueDateTime = null
            if (dueDate) {
                const dateObj = new Date(dueDate)
                if (dueTime) {
                    const [hours, minutes] = dueTime.split(":").map(Number)
                    dateObj.setHours(hours, minutes)
                }
                dueDateTime = dateObj.toISOString()
            }

            if (currentTask) {
                // Editing existing task
                const updatedTask: Task = {
                    ...currentTask,
                    title,
                    description,
                    due_date: dueDateTime,
                    priority
                }

                if (isDevelopment) {
                    // Update local state in development mode
                    setTasks(prev => prev.map(task =>
                        task.id === currentTask.id ? updatedTask : task
                    ))

                    toast({
                        title: "Task updated",
                        description: "Task has been updated successfully."
                    })
                } else {
                    // In production, update in Supabase
                    // This would be implemented with a custom hook like useUpdateTask
                }

                setIsEditDialogOpen(false)
            } else {
                // Adding new task
                const newTask: Task = {
                    id: `dev-${Date.now()}`, // In production, this would be generated by Supabase
                    title,
                    description,
                    due_date: dueDateTime,
                    completed: false,
                    priority,
                    user_id: "current-user" // In production, this would be the actual user ID
                }

                if (isDevelopment) {
                    // Update local state in development mode
                    setTasks(prev => [...prev, newTask])

                    toast({
                        title: "Task added",
                        description: "New task has been added successfully."
                    })
                } else {
                    // In production, add to Supabase
                    // This would be implemented with a custom hook like useCreateTask
                }

                setIsAddDialogOpen(false)

                // Call the onTaskAdded callback if provided
                if (onTaskAdded) {
                    onTaskAdded(newTask)
                }
            }

            resetForm()
        } catch (error) {
            console.error("Error saving task:", error)
            toast({
                title: "Error",
                description: "Failed to save task. Please try again.",
                variant: "destructive"
            })
        }
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

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{getListTitle()}</h3>

                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs hover:bg-primary/10"
                            onClick={() => {
                                resetForm()
                                // Set default due date based on filter
                                if (filter === 'today') {
                                    setDueDate(format(new Date(), "yyyy-MM-dd"))
                                } else if (filter === 'upcoming') {
                                    setDueDate(format(addDays(new Date(), 1), "yyyy-MM-dd"))
                                }
                            }}
                        >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Task
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Task</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <label htmlFor="title" className="text-sm font-medium">
                                    Title
                                </label>
                                <Input
                                    id="title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Task title"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="description" className="text-sm font-medium">
                                    Description
                                </label>
                                <Textarea
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Task description (optional)"
                                    rows={3}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label htmlFor="due-date" className="text-sm font-medium">
                                        Due Date
                                    </label>
                                    <Input
                                        id="due-date"
                                        type="date"
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="due-time" className="text-sm font-medium">
                                        Due Time
                                    </label>
                                    <Input
                                        id="due-time"
                                        type="time"
                                        value={dueTime}
                                        onChange={(e) => setDueTime(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="priority" className="text-sm font-medium">
                                    Priority
                                </label>
                                <select
                                    id="priority"
                                    value={priority}
                                    onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
                                    className="w-full px-3 py-2 border rounded-md"
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsAddDialogOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit">Add Task</Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            ) : filteredTasks.length > 0 ? (
                <div
                    ref={containerRef}
                    className="space-y-3 max-h-[400px] overflow-y-auto pr-2"
                    onScroll={handleScroll}
                >
                    {filteredTasks.slice(0, visibleItems).map((task) => (
                        <TaskItem
                            key={task.id}
                            task={task}
                            onComplete={handleCompleteTask}
                            onDelete={handleDeleteTask}
                            onEdit={handleEditTask}
                            isAdmin={isAdmin}
                            isOwnedByCurrentUser={isOwnedByCurrentUser(task)}
                        />
                    ))}
                    {hasMore && (
                        <div className="text-center py-2">
                            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-sm text-muted-foreground text-center py-8 border rounded-lg">
                    No tasks scheduled for {filter === "today" ? "today" : filter === "upcoming" ? "the upcoming days" : "this period"}.
                </div>
            )}

            {/* Edit Task Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Task</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <label htmlFor="edit-title" className="text-sm font-medium">
                                Title
                            </label>
                            <Input
                                id="edit-title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Task title"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="edit-description" className="text-sm font-medium">
                                Description
                            </label>
                            <Textarea
                                id="edit-description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Task description (optional)"
                                rows={3}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label htmlFor="edit-due-date" className="text-sm font-medium">
                                    Due Date
                                </label>
                                <Input
                                    id="edit-due-date"
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="edit-due-time" className="text-sm font-medium">
                                    Due Time
                                </label>
                                <Input
                                    id="edit-due-time"
                                    type="time"
                                    value={dueTime}
                                    onChange={(e) => setDueTime(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="edit-priority" className="text-sm font-medium">
                                Priority
                            </label>
                            <select
                                id="edit-priority"
                                value={priority}
                                onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
                                className="w-full px-3 py-2 border rounded-md"
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsEditDialogOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit">Save Changes</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default TaskList
