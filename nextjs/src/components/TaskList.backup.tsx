"use client"

import { useState, useEffect, useRef } from "react"
import { Plus, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { TaskDetailPopup } from "./TaskDetailPopup"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "./ui/use-toast"
import TaskItem, { Task, TaskList as TaskListType } from "./TaskItem"
import { format, addDays, startOfDay, endOfDay } from "date-fns"
import useTaskLists from "@/hooks/useTaskLists"
import useTaskDropdowns from "@/hooks/useTaskDropdowns"
import { cn } from "@/lib/utils"
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask, useToggleTaskCompletion } from "@/hooks/useTasks"

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
    // Use the hooks from useTasks.ts
    const { tasks: allTasks, isLoading, error, refetch } = useTasks(filter, 'all', null, maxItems);
    const createTask = useCreateTask();
    const updateTask = useUpdateTask();
    const deleteTask = useDeleteTask();
    const toggleTaskCompletion = useToggleTaskCompletion();

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

    // Handle task completion toggle
    const handleCompleteTask = async (id: string, completed: boolean) => {
        try {
            console.log("=== TaskList.handleCompleteTask ===");
            console.log("Parameters - id:", id, "completed:", completed);
            console.log("All tasks:", allTasks);
            
            // Find the task in allTasks
            const task = Array.isArray(allTasks) ? allTasks.find((t: Task) => t.id === id) : null;
            if (!task) {
                console.error("Task not found in allTasks array:", id);
                console.log("All task IDs:", Array.isArray(allTasks) ? allTasks.map((t: Task) => t.id) : []);
                return;
            }
            
            console.log("Found task:", task);
            console.log("Current task.completed:", task.completed);
            console.log("New completed state:", completed);
            
            // Call toggleTaskCompletion directly
            console.log("Calling toggleTaskCompletion");
            toggleTaskCompletion(id, completed);
            
            // Show success toast
            toast({
                title: completed ? "Task completed" : "Task reopened",
                description: "Task status updated successfully."
            });
            
            // No need to call refetch as the toggleTaskCompletion function
            // already invalidates the queries
            
        } catch (error) {
            console.error("Exception in handleCompleteTask:", error);
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
            console.error("Error deleting task:", error);
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
        return task.user_id === "current-user";
    };

    // Filter and group tasks by timeframe
    const todayTasks = Array.isArray(allTasks) ? allTasks.filter((task: Task) => {
        if (!task.due_date) return false;
        const taskDate = startOfDay(new Date(task.due_date));
        const today = startOfDay(new Date());
        return taskDate.getTime() === today.getTime();
    }) : [];

    const tomorrowTasks = Array.isArray(allTasks) ? allTasks.filter((task: Task) => {
        if (!task.due_date) return false;
        const taskDate = startOfDay(new Date(task.due_date));
        const tomorrow = startOfDay(addDays(new Date(), 1));
        return taskDate.getTime() === tomorrow.getTime();
    }) : [];

    const upcomingTasks = Array.isArray(allTasks) ? allTasks.filter((task: Task) => {
        if (!task.due_date) return false;
        const taskDate = startOfDay(new Date(task.due_date));
        const today = startOfDay(new Date());
        const tomorrow = startOfDay(addDays(today, 1));
        return taskDate.getTime() > tomorrow.getTime();
    }) : [];

    const noDateTasks = Array.isArray(allTasks) ? allTasks.filter((task: Task) => {
        return !task.due_date;
    }) : [];

    // Determine which tasks to display based on filter
    let tasksToDisplay: Task[] = [];
    if (filter === 'today') {
        tasksToDisplay = todayTasks;
    } else if (filter === 'upcoming') {
        tasksToDisplay = [...tomorrowTasks, ...upcomingTasks];
    } else {
        tasksToDisplay = Array.isArray(allTasks) ? allTasks : [];
    }

    // Limit the number of tasks displayed
    const displayedTasks = tasksToDisplay.slice(0, visibleItems);

    // Handle task creation
    const handleCreateTask = async (task: Omit<Task, 'id' | 'created_at' | 'user_id'>) => {
        try {
            // Ensure due_date is never undefined
            const taskToCreate = {
                ...task,
                due_date: task.due_date || null
            };
            
            createTask.mutate(taskToCreate, {
                onSuccess: (newTask) => {
                    toast({
                        title: "Task created",
                        description: "New task has been added successfully."
                    });

                    setIsAddDialogOpen(false);

                    // Call the onTaskAdded callback if provided
                    if (onTaskAdded) {
                        onTaskAdded(newTask);
                    }
                },
                onError: (error) => {
                    console.error("Error creating task:", error);
                    toast({
                        title: "Error",
                        description: "Failed to create task. Please try again.",
                        variant: "destructive"
                    });
                }
            });
        } catch (error) {
            console.error("Exception in handleCreateTask:", error);
            toast({
                title: "Error",
                description: "Failed to create task. Please try again.",
                variant: "destructive"
            });
        }
    };

    // Handle task update
    const handleUpdateTask = async (task: Task) => {
        try {
            updateTask.mutate({
                id: task.id,
                updates: task
            }, {
                onSuccess: () => {
                    toast({
                        title: "Task updated",
                        description: "Task has been updated successfully."
                    });

                    setIsEditDialogOpen(false);
                    setCurrentTask(null);
                },
                onError: (error) => {
                    console.error("Error updating task:", error);
                    toast({
                        title: "Error",
                        description: "Failed to update task. Please try again.",
                        variant: "destructive"
                    });
                }
            });
        } catch (error) {
            console.error("Exception in handleUpdateTask:", error);
            toast({
                title: "Error",
                description: "Failed to update task. Please try again.",
                variant: "destructive"
            });
        }
    };

    // Show loading state
    if (isLoading) {
        return (
            <div className="p-4 space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Tasks</h2>
                </div>
                <div className="animate-pulse space-y-3">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-16 bg-gray-100 rounded-md"></div>
                    ))}
                </div>
            </div>
        );
    }

    // Show error state
    if (error) {
        return (
            <div className="p-4 space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Tasks</h2>
                </div>
                <div className="p-4 bg-red-50 text-red-700 rounded-md">
                    <p>Error loading tasks. Please try again later.</p>
                </div>
            </div>
        );
    }

    // Determine if there are no tasks to display
    const noTasks = Array.isArray(allTasks) && allTasks.length === 0;

    return (
        <div className="p-4 space-y-4">
            {/* Header with title and add button */}
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Tasks</h2>
                <Button
                    onClick={() => setIsAddDialogOpen(true)}
                    size="sm"
                    className="flex items-center gap-1"
                >
                    <Plus className="h-4 w-4" />
                    <span>Add Task</span>
                </Button>
            </div>

            {/* Task list */}
            <div
                ref={containerRef}
                className="space-y-1 max-h-[500px] overflow-y-auto pr-2"
            >
                {noTasks ? (
                    <div className="p-4 text-center text-gray-500">
                        <p>No tasks to display. Add a new task to get started.</p>
                    </div>
                ) : (
                    <>
                        {displayedTasks.map((task) => (
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

                        {hasMore && (
                            <div className="py-2 text-center">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setVisibleItems(prev => prev + maxItems)}
                                >
                                    Load more
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Add task dialog */}
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
                        onUpdate={() => {}}
                        onDelete={() => {}}
                        onComplete={() => {}}
                        mode="create"
                        onCreate={handleCreateTask}
                    />
                </DialogContent>
            </Dialog>

            {/* Edit task dialog */}
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
                            onUpdate={handleUpdateTask}
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

export default TaskList;
