"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Check, Trash, Calendar, Clock, Plus } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Task, TaskList } from "./TaskItem"

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
    const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
    const [listId, setListId] = useState<string | null>(null)
    const [dueDate, setDueDate] = useState("")
    const [dueTime, setDueTime] = useState("")
    const [newSubtask, setNewSubtask] = useState("")
    const [subtasks, setSubtasks] = useState<{ id: string; text: string; completed: boolean }[]>([])

    // Update form fields when task changes
    useEffect(() => {
        if (task) {
            setTitle(task.title)
            setDescription(task.description || "")
            setPriority(task.priority)
            setListId(task.list_id || null)

            if (task.due_date) {
                const date = new Date(task.due_date)
                setDueDate(format(date, "yyyy-MM-dd"))
                setDueTime(format(date, "HH:mm"))
            } else {
                setDueDate("")
                setDueTime("")
            }

            // In a real app, we'd fetch subtasks here
            setSubtasks([])
        } else {
            resetForm()
        }
    }, [task])

    // Reset form fields
    const resetForm = () => {
        setTitle("")
        setDescription("")
        setDueDate("")
        setDueTime("")
        setPriority("medium")
        setListId(null)
        setSubtasks([])
    }

    // Handle form submission
    const handleSave = () => {
        if (!task) return
        if (!title.trim()) return

        let dueDateTime = null
        if (dueDate) {
            const dateObj = new Date(dueDate)
            if (dueTime) {
                const [hours, minutes] = dueTime.split(":").map(Number)
                dateObj.setHours(hours, minutes)
            }
            dueDateTime = dateObj.toISOString()
        }

        const updatedTask: Task = {
            ...task,
            title,
            description,
            due_date: dueDateTime,
            priority,
            list_id: listId
        }

        onUpdate(updatedTask)
    }

    // Handle task delete
    const handleDelete = () => {
        if (!task) return
        onDelete(task.id)
        setIsOpen(false)
    }

    // Handle task completion toggle
    const handleComplete = () => {
        if (!task) return
        onComplete(task.id, !task.completed)
    }

    // Add subtask
    const handleAddSubtask = () => {
        if (!newSubtask.trim()) return
        setSubtasks([
            ...subtasks,
            { id: `subtask-${Date.now()}`, text: newSubtask, completed: false }
        ])
        setNewSubtask("")
    }

    // Toggle subtask completion
    const toggleSubtaskCompletion = (id: string) => {
        setSubtasks(
            subtasks.map(subtask =>
                subtask.id === id
                    ? { ...subtask, completed: !subtask.completed }
                    : subtask
            )
        )
    }

    // Delete subtask
    const deleteSubtask = (id: string) => {
        setSubtasks(subtasks.filter(subtask => subtask.id !== id))
    }

    // Format the due date if it exists
    const formattedDueDate = dueDate
        ? format(new Date(dueDate), "MMMM d, yyyy")
        : null

    // Get the current task list
    const currentList = taskLists.find(list => list.id === listId)

    // Auto-save on form field changes
    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            if (isOpen && task) {
                handleSave()
            }
        }, 1000)

        return () => clearTimeout(debounceTimer)
    }, [title, description, dueDate, dueTime, priority, listId, isOpen, task])

    // Handle creating a new task
    const handleCreate = () => {
        if (!title.trim() || !onCreate) return

        let dueDateTime = null
        if (dueDate) {
            const dateObj = new Date(dueDate)
            if (dueTime) {
                const [hours, minutes] = dueTime.split(":").map(Number)
                dateObj.setHours(hours, minutes)
            }
            dueDateTime = dateObj.toISOString()
        }

        const newTask = {
            title,
            description,
            due_date: dueDateTime,
            completed: false,
            priority,
            list_id: listId
        }

        onCreate(newTask)
        setIsOpen(false)
        resetForm()
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-md md:max-w-xl overflow-y-auto max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle className="flex-1">
                        {mode === 'edit' && task ? 'Edit Task' : 'Add New Task'}
                    </DialogTitle>
                </DialogHeader>

                {mode === 'edit' && task ? (
                    <>
                        <DialogHeader>
                            <div className="flex items-center gap-2">
                                <div
                                    className={cn(
                                        "flex-shrink-0 w-6 h-6 rounded-full border cursor-pointer flex items-center justify-center",
                                        task.completed ? "bg-green-500 border-green-500" : "border-gray-300 hover:border-gray-500"
                                    )}
                                    onClick={handleComplete}
                                >
                                    {task.completed && <Check className="h-4 w-4 text-white" />}
                                </div>
                                <DialogTitle className="flex-1">
                                    <Input
                                        className="text-xl font-bold border-none p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Task title"
                                    />
                                </DialogTitle>
                            </div>
                        </DialogHeader>

                        <div className="space-y-6 mt-2">
                            {/* List and Priority Selectors */}
                            <div className="flex gap-3">
                                <div className="flex-1">
                                    <label className="text-sm font-medium mb-1 block">List</label>
                                    <select
                                        value={listId || ''}
                                        onChange={(e) => setListId(e.target.value || null)}
                                        className="w-full px-3 py-2 border rounded-md text-sm"
                                    >
                                        <option value="">No List</option>
                                        {taskLists.map((list) => (
                                            <option key={list.id} value={list.id}>
                                                {list.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex-1">
                                    <label className="text-sm font-medium mb-1 block">Priority</label>
                                    <select
                                        value={priority}
                                        onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
                                        className="w-full px-3 py-2 border rounded-md text-sm"
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                </div>
                            </div>

                            {/* Due Date */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium">Due Date</label>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <Input
                                        type="date"
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                        className="text-sm"
                                    />
                                    <Input
                                        type="time"
                                        value={dueTime}
                                        onChange={(e) => setDueTime(e.target.value)}
                                        className="text-sm"
                                    />
                                </div>
                            </div>

                            {/* Notes Section */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Notes</label>
                                <Textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Add notes here..."
                                    className="min-h-24 text-sm"
                                />
                            </div>

                            {/* Subtasks Section */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium">Subtasks ({subtasks.filter(s => s.completed).length}/{subtasks.length})</label>
                                </div>

                                <div className="space-y-2">
                                    {subtasks.map((subtask) => (
                                        <div key={subtask.id} className="flex items-center gap-2">
                                            <div
                                                className={cn(
                                                    "flex-shrink-0 w-5 h-5 rounded-full border cursor-pointer flex items-center justify-center",
                                                    subtask.completed ? "bg-green-500 border-green-500" : "border-gray-300 hover:border-gray-500"
                                                )}
                                                onClick={() => toggleSubtaskCompletion(subtask.id)}
                                            >
                                                {subtask.completed && <Check className="h-3 w-3 text-white" />}
                                            </div>
                                            <span className={cn(
                                                "flex-1 text-sm",
                                                subtask.completed && "line-through text-gray-500"
                                            )}>
                                                {subtask.text}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-red-500 hover:text-red-700"
                                                onClick={() => deleteSubtask(subtask.id)}
                                            >
                                                <Trash className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    ))}

                                    <div className="flex items-center gap-2">
                                        <Input
                                            placeholder="Add a subtask..."
                                            value={newSubtask}
                                            onChange={(e) => setNewSubtask(e.target.value)}
                                            className="text-sm"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault()
                                                    handleAddSubtask()
                                                }
                                            }}
                                        />
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleAddSubtask}
                                        >
                                            <Plus className="h-3 w-3 mr-1" />
                                            Add
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Attachments Section */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Attachments</label>
                                <div className="border border-dashed rounded-md p-4 text-center">
                                    <p className="text-xs text-gray-500">
                                        Click to add / drop your files here
                                    </p>
                                </div>
                            </div>

                            {/* Footer with Delete Button */}
                            <div className="flex justify-end gap-2 border-t pt-4">
                                <Button
                                    variant="destructive"
                                    onClick={handleDelete}
                                >
                                    <Trash className="h-4 w-4 mr-1" />
                                    Delete Task
                                </Button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="space-y-6 mt-2">
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
                                className="min-h-24 text-sm"
                            />
                        </div>

                        <div className="flex gap-3">
                            <div className="flex-1">
                                <label className="text-sm font-medium mb-1 block">List</label>
                                <select
                                    value={listId || ''}
                                    onChange={(e) => setListId(e.target.value || null)}
                                    className="w-full px-3 py-2 border rounded-md text-sm"
                                >
                                    <option value="">No List</option>
                                    {taskLists.map((list) => (
                                        <option key={list.id} value={list.id}>
                                            {list.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex-1">
                                <label className="text-sm font-medium mb-1 block">Priority</label>
                                <select
                                    value={priority}
                                    onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
                                    className="w-full px-3 py-2 border rounded-md text-sm"
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium">Due Date</label>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <Input
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    className="text-sm"
                                />
                                <Input
                                    type="time"
                                    value={dueTime}
                                    onChange={(e) => setDueTime(e.target.value)}
                                    className="text-sm"
                                />
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
                                type="submit"
                                onClick={handleCreate}
                            >
                                Add Task
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}

export default TaskDetailPopup
