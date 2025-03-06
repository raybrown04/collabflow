"use client";

/**
 * useTasks hook
 * 
 * A React Query hook for fetching, creating, updating, and deleting tasks from Supabase.
 * Supports filtering by date (today, upcoming, all) and handles authentication.
 * Provides development mode support with mock data.
 */

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth, supabase } from "@/lib/auth";
import { startOfDay, endOfDay, addDays, isBefore, isAfter, parseISO } from "date-fns";

// Task interface
export interface Task {
    id: string;
    title: string;
    description?: string;
    due_date: string | null;
    completed: boolean;
    priority: "low" | "medium" | "high";
    created_at: string;
    user_id: string;
    list_id?: string | null;
}

// Mock tasks for development mode
const mockTasks: Task[] = [
    {
        id: "dev-1",
        title: "Complete project proposal",
        description: "Finalize the project proposal document with all requirements",
        due_date: new Date().toISOString(),
        completed: false,
        priority: "high",
        created_at: new Date().toISOString(),
        user_id: "dev-user",
        list_id: "list-1" // Personal
    },
    {
        id: "dev-2",
        title: "Review quarterly budget",
        description: "Review and approve the quarterly budget report",
        due_date: new Date().toISOString(),
        completed: false,
        priority: "medium",
        created_at: new Date().toISOString(),
        user_id: "dev-user",
        list_id: "list-2" // Work
    },
    {
        id: "dev-3",
        title: "Prepare client presentation",
        description: "Create slides for the upcoming client presentation",
        due_date: addDays(new Date(), 1).toISOString(),
        completed: false,
        priority: "high",
        created_at: new Date().toISOString(),
        user_id: "dev-user",
        list_id: "list-2" // Work
    },
    {
        id: "dev-4",
        title: "Update team documentation",
        description: "Update the team documentation with recent changes",
        due_date: addDays(new Date(), 2).toISOString(),
        completed: false,
        priority: "low",
        created_at: new Date().toISOString(),
        user_id: "dev-user",
        list_id: "list-1" // Personal
    },
    {
        id: "dev-5",
        title: "Schedule team meeting",
        description: "Schedule the weekly team meeting",
        due_date: addDays(new Date(), 3).toISOString(),
        completed: true,
        priority: "medium",
        created_at: new Date().toISOString(),
        user_id: "dev-user",
        list_id: "list-4" // Stoneys
    }
];

// Development mode detection
const isDevelopment = typeof window !== 'undefined' && window.location.hostname === 'localhost';

/**
 * Fetch tasks from Supabase based on filter
 */
async function fetchTasks(filter: 'today' | 'upcoming' | 'all', isAdmin: boolean = false): Promise<Task[]> {
    if (isDevelopment) {
        console.log("Development mode: Using mock tasks data");

        // Filter mock tasks based on the filter parameter
        const today = startOfDay(new Date());
        const tomorrow = endOfDay(addDays(today, 1));

        return mockTasks.filter(task => {
            if (!task.due_date) return filter === 'all';

            const dueDate = parseISO(task.due_date);

            if (filter === 'today') {
                return isBefore(dueDate, endOfDay(today)) && !task.completed;
            } else if (filter === 'upcoming') {
                return isAfter(dueDate, today) && !task.completed;
            }

            return true; // 'all' filter
        });
    }

    // In production, fetch from Supabase
    let query = supabase.from('tasks').select('*');

    // Apply filter
    if (filter === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);

        query = query
            .lte('due_date', endOfToday.toISOString())
            .eq('completed', false);
    } else if (filter === 'upcoming') {
        const tomorrow = new Date();
        tomorrow.setHours(0, 0, 0, 0);
        tomorrow.setDate(tomorrow.getDate() + 1);

        query = query
            .gte('due_date', tomorrow.toISOString())
            .eq('completed', false);
    }

    // If not admin, only fetch user's own tasks
    if (!isAdmin) {
        query = query.eq('user_id', supabase.auth.getUser().then(({ data }) => data.user?.id));
    }

    // Order by due date
    query = query.order('due_date', { ascending: true });

    const { data, error } = await query;

    if (error) {
        console.error("Error fetching tasks:", error);
        throw error;
    }

    return data as Task[];
}

/**
 * Create a new task in Supabase
 */
async function createTask(task: Omit<Task, 'id' | 'created_at' | 'user_id'>): Promise<Task> {
    if (isDevelopment) {
        console.log("Development mode: Creating mock task", task);

        // Create a mock task
        const newTask: Task = {
            id: `dev-${Math.random().toString(36).substring(2, 9)}`,
            ...task,
            created_at: new Date().toISOString(),
            user_id: "dev-user"
        };

        // Add to mock tasks
        mockTasks.push(newTask);

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        return newTask;
    }

    // In production, create in Supabase
    const { data, error } = await supabase
        .from('tasks')
        .insert([task])
        .select()
        .single();

    if (error) {
        console.error("Error creating task:", error);
        throw error;
    }

    return data as Task;
}

/**
 * Update a task in Supabase
 */
async function updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    if (isDevelopment) {
        console.log("Development mode: Updating mock task", id, updates);

        // Find the task in mock tasks
        const taskIndex = mockTasks.findIndex(task => task.id === id);

        if (taskIndex === -1) {
            throw new Error(`Task with ID ${id} not found`);
        }

        // Update the task
        const updatedTask = {
            ...mockTasks[taskIndex],
            ...updates
        };

        mockTasks[taskIndex] = updatedTask;

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        return updatedTask;
    }

    // In production, update in Supabase
    const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error("Error updating task:", error);
        throw error;
    }

    return data as Task;
}

/**
 * Delete a task from Supabase
 */
async function deleteTask(id: string): Promise<void> {
    if (isDevelopment) {
        console.log("Development mode: Deleting mock task", id);

        // Remove the task from mock tasks
        const taskIndex = mockTasks.findIndex(task => task.id === id);

        if (taskIndex === -1) {
            throw new Error(`Task with ID ${id} not found`);
        }

        mockTasks.splice(taskIndex, 1);

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        return;
    }

    // In production, delete from Supabase
    const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

    if (error) {
        console.error("Error deleting task:", error);
        throw error;
    }
}

/**
 * Hook for fetching tasks
 */
export function useTasks(filter: 'today' | 'upcoming' | 'all' = 'all', limit: number = 10) {
    const { user, isAdmin } = useAuth();
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [allTasks, setAllTasks] = useState<Task[]>([]);

    // Fetch tasks with React Query
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['tasks', filter, user?.id, isAdmin, page],
        queryFn: () => fetchTasks(filter, isAdmin),
        enabled: isDevelopment || !!user,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    // Update allTasks when data changes
    useEffect(() => {
        if (data) {
            if (page === 1) {
                setAllTasks(data.slice(0, limit));
            } else {
                setAllTasks(prev => [...prev, ...data.slice((page - 1) * limit, page * limit)]);
            }

            setHasMore(data.length > page * limit);
        }
    }, [data, page, limit]);

    // Load more tasks
    const loadMore = () => {
        if (hasMore && !isLoading) {
            setPage(prev => prev + 1);
        }
    };

    return {
        tasks: allTasks,
        isLoading,
        error,
        refetch,
        loadMore,
        hasMore
    };
}

/**
 * Hook for creating a task
 */
export function useCreateTask() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createTask,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        }
    });
}

/**
 * Hook for updating a task
 */
export function useUpdateTask() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, updates }: { id: string, updates: Partial<Task> }) =>
            updateTask(id, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        }
    });
}

/**
 * Hook for deleting a task
 */
export function useDeleteTask() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteTask,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        }
    });
}

/**
 * Hook for toggling task completion
 */
export function useToggleTaskCompletion() {
    const updateTask = useUpdateTask();

    return (id: string, completed: boolean) => {
        return updateTask.mutate({ id, updates: { completed } });
    };
}

export default useTasks;
