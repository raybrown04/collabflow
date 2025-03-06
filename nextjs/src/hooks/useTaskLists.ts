"use client";

/**
 * useTaskLists hook
 * 
 * A React Query hook for fetching, creating, updating, and deleting task lists from Supabase.
 * Provides development mode support with mock data.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth, supabase } from "@/lib/auth";

// TaskList interface
export interface TaskList {
    id: string;
    name: string;
    color: string;
    user_id: string;
    created_at: string;
}

// Mock task lists for development mode
const mockTaskLists: TaskList[] = [
    {
        id: "list-1",
        name: "Personal",
        color: "#E91E63",
        user_id: "dev-user",
        created_at: new Date().toISOString()
    },
    {
        id: "list-2",
        name: "Work",
        color: "#2196F3",
        user_id: "dev-user",
        created_at: new Date().toISOString()
    },
    {
        id: "list-3",
        name: "Shopping",
        color: "#4CAF50",
        user_id: "dev-user",
        created_at: new Date().toISOString()
    },
    {
        id: "list-4",
        name: "Stoneys",
        color: "#FFC107",
        user_id: "dev-user",
        created_at: new Date().toISOString()
    }
];

// Development mode detection
const isDevelopment = typeof window !== 'undefined' && window.location.hostname === 'localhost';

/**
 * Fetch task lists from Supabase
 */
async function fetchTaskLists(isAdmin: boolean = false): Promise<TaskList[]> {
    if (isDevelopment) {
        console.log("Development mode: Using mock task lists data");
        return mockTaskLists;
    }

    // In production, fetch from Supabase
    let query = supabase.from('task_lists').select('*');

    // If not admin, only fetch user's own task lists
    if (!isAdmin) {
        query = query.eq('user_id', supabase.auth.getUser().then(({ data }) => data.user?.id));
    }

    // Order by name
    query = query.order('name', { ascending: true });

    const { data, error } = await query;

    if (error) {
        console.error("Error fetching task lists:", error);
        throw error;
    }

    return data as TaskList[];
}

/**
 * Create a new task list in Supabase
 */
async function createTaskList(taskList: Omit<TaskList, 'id' | 'created_at' | 'user_id'>): Promise<TaskList> {
    if (isDevelopment) {
        console.log("Development mode: Creating mock task list", taskList);

        // Create a mock task list
        const newTaskList: TaskList = {
            id: `list-${Math.random().toString(36).substring(2, 9)}`,
            ...taskList,
            created_at: new Date().toISOString(),
            user_id: "dev-user"
        };

        // Add to mock task lists
        mockTaskLists.push(newTaskList);

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        return newTaskList;
    }

    // In production, create in Supabase
    const { data, error } = await supabase
        .from('task_lists')
        .insert([taskList])
        .select()
        .single();

    if (error) {
        console.error("Error creating task list:", error);
        throw error;
    }

    return data as TaskList;
}

/**
 * Update a task list in Supabase
 */
async function updateTaskList(id: string, updates: Partial<TaskList>): Promise<TaskList> {
    if (isDevelopment) {
        console.log("Development mode: Updating mock task list", id, updates);

        // Find the task list in mock task lists
        const taskListIndex = mockTaskLists.findIndex(list => list.id === id);

        if (taskListIndex === -1) {
            throw new Error(`Task list with ID ${id} not found`);
        }

        // Update the task list
        const updatedTaskList = {
            ...mockTaskLists[taskListIndex],
            ...updates
        };

        mockTaskLists[taskListIndex] = updatedTaskList;

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        return updatedTaskList;
    }

    // In production, update in Supabase
    const { data, error } = await supabase
        .from('task_lists')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error("Error updating task list:", error);
        throw error;
    }

    return data as TaskList;
}

/**
 * Delete a task list from Supabase
 */
async function deleteTaskList(id: string): Promise<void> {
    if (isDevelopment) {
        console.log("Development mode: Deleting mock task list", id);

        // Remove the task list from mock task lists
        const taskListIndex = mockTaskLists.findIndex(list => list.id === id);

        if (taskListIndex === -1) {
            throw new Error(`Task list with ID ${id} not found`);
        }

        mockTaskLists.splice(taskListIndex, 1);

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        return;
    }

    // In production, delete from Supabase
    const { error } = await supabase
        .from('task_lists')
        .delete()
        .eq('id', id);

    if (error) {
        console.error("Error deleting task list:", error);
        throw error;
    }
}

/**
 * Hook for fetching task lists
 */
export function useTaskLists() {
    const { user, isAdmin } = useAuth();

    // Fetch task lists with React Query
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['taskLists', user?.id, isAdmin],
        queryFn: () => fetchTaskLists(isAdmin),
        enabled: isDevelopment || !!user,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    return {
        taskLists: data || [],
        isLoading,
        error,
        refetch
    };
}

/**
 * Hook for creating a task list
 */
export function useCreateTaskList() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createTaskList,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['taskLists'] });
        }
    });
}

/**
 * Hook for updating a task list
 */
export function useUpdateTaskList() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, updates }: { id: string, updates: Partial<TaskList> }) =>
            updateTaskList(id, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['taskLists'] });
        }
    });
}

/**
 * Hook for deleting a task list
 */
export function useDeleteTaskList() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteTaskList,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['taskLists'] });
        }
    });
}

export default useTaskLists;
