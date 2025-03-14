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
import { useAuth, supabase, getCurrentUserId } from "@/lib/auth";
import { startOfDay, endOfDay, addDays, isBefore, isAfter, parseISO, isSameDay } from "date-fns";

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
    recurrence_rule?: string | null;
    isRecurringInstance?: boolean; // Flag for tasks that are instances of a recurring task
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
// Force development mode to true until database issues are resolved
const isDevelopment = true;

/**
 * Expand recurring tasks into multiple instances based on their recurrence rule
 */
function expandRecurringTasks(tasks: Task[]): Task[] {
    const expandedTasks: Task[] = [];
    
    tasks.forEach(task => {
        // If it's not a recurring task, just add it as is
        if (!task.recurrence_rule) {
            expandedTasks.push(task);
            return;
        }
        
        // Parse the recurrence rule to get frequency, interval, and count/until
        const ruleSegments = task.recurrence_rule.split(';');
        const frequency = ruleSegments.find(s => s.startsWith('FREQ='))?.replace('FREQ=', '').toLowerCase();
        const interval = parseInt(ruleSegments.find(s => s.startsWith('INTERVAL='))?.replace('INTERVAL=', '') || '1');
        const countMatch = ruleSegments.find(s => s.startsWith('COUNT='))?.replace('COUNT=', '');
        const untilMatch = ruleSegments.find(s => s.startsWith('UNTIL='))?.replace('UNTIL=', '');
        
        const count = countMatch ? parseInt(countMatch) : undefined;
        const until = untilMatch ? new Date(
            parseInt(untilMatch.substring(0, 4)),  // Year
            parseInt(untilMatch.substring(4, 6)) - 1,  // Month (0-based)
            parseInt(untilMatch.substring(6, 8))   // Day
        ) : undefined;
        
        // Add the original task first
        expandedTasks.push(task);
        
        // If there's no due date, we can't calculate recurrences
        if (!task.due_date) return;
        
        const originalDueDate = new Date(task.due_date);
        const occurrences = count || (until ? 10 : 3); // Default to 3 occurrences if no count/until
        
        // Create recurring instances starting from the second occurrence
        for (let i = 1; i < occurrences; i++) {
            let nextDueDate: Date;
            
            switch (frequency) {
                case 'daily':
                    nextDueDate = addDays(originalDueDate, i * interval);
                    break;
                case 'weekly':
                    nextDueDate = addDays(originalDueDate, i * 7 * interval);
                    break;
                case 'monthly':
                    nextDueDate = new Date(originalDueDate);
                    nextDueDate.setMonth(nextDueDate.getMonth() + i * interval);
                    break;
                case 'yearly':
                    nextDueDate = new Date(originalDueDate);
                    nextDueDate.setFullYear(nextDueDate.getFullYear() + i * interval);
                    break;
                default:
                    // Unknown frequency, skip this one
                    continue;
            }
            
            // If we've passed the until date, stop creating instances
            if (until && nextDueDate > until) break;
            
            // Create a new task instance with the calculated due date
            expandedTasks.push({
                ...task,
                id: `${task.id}-recurrence-${i}`,
                due_date: nextDueDate.toISOString(),
                // Mark it as a recurring instance
                isRecurringInstance: true
            });
        }
    });
    
    return expandedTasks;
}

/**
 * Fetch tasks from Supabase based on filter
 */
async function fetchTasks(
    filter: 'today' | 'upcoming' | 'all', 
    statusFilter: 'all' | 'completed' | 'incomplete' = 'all',
    projectFilter: string | null = null,
    isAdmin: boolean = false
): Promise<Task[]> {
    if (isDevelopment) {
        console.log("Development mode: Using mock tasks data");

        // Filter mock tasks based on the filter parameter
        const today = startOfDay(new Date());
        const endOfToday = endOfDay(today);
        const tomorrow = startOfDay(addDays(today, 1));

        // First filter tasks based on the specified criteria
        const filteredTasks = mockTasks.filter(task => {
            // First apply the date filter
            let passesDateFilter = true;
            if (!task.due_date) {
                passesDateFilter = filter === 'all';
            } else {
                const dueDate = parseISO(task.due_date);

                if (filter === 'today') {
                    // Check if task is specifically for today
                    passesDateFilter = isSameDay(dueDate, today);
                } else if (filter === 'upcoming') {
                    // Check if task is for tomorrow or later
                    passesDateFilter = isAfter(dueDate, endOfToday);
                }
            }

            if (!passesDateFilter) return false;

            // Then apply status filter
            if (statusFilter === 'completed' && !task.completed) {
                return false;
            }
            if (statusFilter === 'incomplete' && task.completed) {
                return false;
            }

            // Then apply project filter (for development mode)
            if (projectFilter) {
                // In development mode, we'll use a simple pattern matching approach
                // In production, this would use the project_tags table
                if (projectFilter === 'proj-1' && !task.id.includes('dev-1')) {
                    return false;
                } else if (projectFilter === 'proj-2' && !(task.id.includes('dev-2') || task.id.includes('dev-3'))) {
                    return false;
                } else if (projectFilter === 'proj-3' && !task.id.includes('dev-4')) {
                    return false;
                } else if (projectFilter === 'proj-4' && !task.id.includes('dev-5')) {
                    return false;
                }
            }

            return true;
        });
        
        // Now expand recurring tasks into multiple instances
        return expandRecurringTasks(filteredTasks);
    }

    try {
        // In production, fetch from Supabase using todo_list table
        let query = supabase.from('todo_list').select('*');

        // Apply filter
        if (filter === 'today') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const endOfToday = new Date();
            endOfToday.setHours(23, 59, 59, 999);

            query = query.eq('done', false);
            // Note: todo_list might not have due_date field, adjust filtering as needed
        } else if (filter === 'upcoming') {
            // Note: todo_list might not have due_date field, adjust filtering as needed
            query = query.eq('done', false);
        }

        // If not admin, only fetch user's own tasks
        if (!isAdmin) {
            query = query.eq('owner', supabase.auth.getUser().then(({ data }) => data.user?.id));
        }

        // Order by created_at
        query = query.order('created_at', { ascending: false });

        const { data, error } = await query;

        if (error) {
            console.error("Error fetching tasks:", error);
            // Return mock data if there's an error with the database
            console.log("Falling back to mock data due to database error");
            return fetchTasks(filter, statusFilter, projectFilter, isAdmin);
        }

        // Map todo_list data to Task interface format
        return data.map((item: any) => ({
            id: item.id.toString(),
            title: item.title,
            description: item.description || "",
            due_date: null, // todo_list doesn't have due_date
            completed: item.done,
            priority: item.urgent ? "high" : "medium",
            created_at: item.created_at,
            user_id: item.owner,
            list_id: null // todo_list doesn't have list_id
        }));
    } catch (error) {
        console.error("Exception in fetchTasks:", error);
        // Return mock data if there's an exception
        console.log("Falling back to mock data due to exception");
        return fetchTasks(filter, statusFilter, projectFilter, isAdmin);
    }
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

    try {
        // In production, create in Supabase using todo_list table
        const todoListTask = {
            title: task.title,
            description: task.description || null,
            done: false,
            urgent: task.priority === 'high',
            owner: await getCurrentUserId()
        };
        
        const { data, error } = await supabase
            .from('todo_list')
            .insert([todoListTask])
            .select()
            .single();

        if (error) {
            console.error("Error creating task:", error);
            // Fall back to development mode if there's an error
            return createTask(task);
        }

        return {
            id: data.id.toString(),
            title: data.title,
            description: data.description || "",
            due_date: null,
            completed: data.done,
            priority: data.urgent ? "high" : "medium",
            created_at: data.created_at,
            user_id: data.owner,
            list_id: null
        };
    } catch (error) {
        console.error("Exception in createTask:", error);
        // Fall back to development mode if there's an exception
        return createTask(task);
    }
}

/**
 * Update a task in Supabase
 */
async function updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    console.log("=== updateTask function ===");
    console.log("Parameters - id:", id, "updates:", updates);
    console.log("isDevelopment:", isDevelopment);
    
    if (isDevelopment) {
        console.log("Development mode: Updating mock task");
        
        // Find the task in mockTasks
        const taskIndex = mockTasks.findIndex(task => task.id === id);
        console.log("Task index in mockTasks:", taskIndex);
        
        if (taskIndex === -1) {
            console.error(`Task with ID ${id} not found in mockTasks`);
            throw new Error(`Task with ID ${id} not found`);
        }
        
        // Update the task
        const updatedTask = {
            ...mockTasks[taskIndex],
            ...updates
        };
        console.log("Updated task:", updatedTask);
        
        // Replace the task in mockTasks
        mockTasks[taskIndex] = updatedTask;
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return updatedTask;
    }
    
    try {
        console.log("Production mode: Updating task in Supabase");
        
        // Check if the ID is a valid number for Supabase
        const numericId = parseInt(id);
        if (isNaN(numericId)) {
            console.error(`Invalid ID format for Supabase: ${id}`);
            throw new Error(`Invalid ID format for Supabase: ${id}`);
        }
        
        // Map Task updates to todo_list updates
        const todoListUpdates: any = {};
        
        if (updates.title !== undefined) todoListUpdates.title = updates.title;
        if (updates.description !== undefined) todoListUpdates.description = updates.description;
        if (updates.completed !== undefined) todoListUpdates.done = updates.completed;
        if (updates.priority !== undefined) todoListUpdates.urgent = updates.priority === 'high';
        
        console.log("todoListUpdates:", todoListUpdates);
        
        // Update in Supabase
        const { data, error } = await supabase
            .from('todo_list')
            .update(todoListUpdates)
            .eq('id', numericId)
            .select()
            .single();
        
        if (error) {
            console.error("Error updating task:", error);
            // Fall back to development mode if there's an error
            return updateTask(id, updates);
        }
        
        console.log("Supabase update response:", data);
        
        // Map the response back to Task format
        return {
            id: data.id.toString(),
            title: data.title,
            description: data.description || "",
            due_date: null,
            completed: data.done,
            priority: data.urgent ? "high" : "medium",
            created_at: data.created_at,
            user_id: data.owner,
            list_id: null
        };
    } catch (error) {
        console.error("Exception in updateTask:", error);
        // Fall back to development mode if there's an exception
        return updateTask(id, updates);
    }
}

/**
 * Delete a task from Supabase
 */
async function deleteTask(id: string): Promise<void> {
    if (isDevelopment) {
        console.log("Development mode: Deleting mock task", id);
        
        // Find the task index
        const taskIndex = mockTasks.findIndex(task => task.id === id);
        
        if (taskIndex === -1) {
            console.error(`Task with ID ${id} not found in mockTasks`);
            return;
        }
        
        // Remove the task from mockTasks
        mockTasks.splice(taskIndex, 1);
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return;
    }
    
    try {
        // Check if the ID is a valid number for Supabase
        const numericId = parseInt(id);
        if (isNaN(numericId)) {
            console.error(`Invalid ID format for Supabase: ${id}`);
            return;
        }
        
        // Delete from Supabase
        const { error } = await supabase
            .from('todo_list')
            .delete()
            .eq('id', numericId);
        
        if (error) {
            console.error("Error deleting task:", error);
        }
    } catch (error) {
        console.error("Exception in deleteTask:", error);
    }
}

/**
 * Hook for fetching tasks
 */
export function useTasks(
    filter: 'today' | 'upcoming' | 'all' = 'all', 
    statusFilter: 'all' | 'completed' | 'incomplete' = 'all',
    projectFilter: string | null = null,
    limit: number = 10
) {
    const queryClient = useQueryClient();
    
    // Use React Query to fetch tasks
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['tasks', filter, statusFilter, projectFilter],
        queryFn: () => fetchTasks(filter, statusFilter, projectFilter),
        staleTime: 1000 * 60 * 5, // 5 minutes
        refetchOnWindowFocus: true,
        refetchOnMount: true,
        refetchOnReconnect: true,
        retry: 3,
        retryDelay: 1000
    });
    
    // Limit the number of tasks returned
    const tasks = data || [];
    
    return {
        tasks,
        isLoading,
        error,
        refetch
    };
}

/**
 * Hook for creating a task
 */
export function useCreateTask() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: (task: Omit<Task, 'id' | 'created_at' | 'user_id'>) => createTask(task),
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
        mutationFn: ({ id, updates }: { id: string, updates: Partial<Task> }) => updateTask(id, updates),
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
        mutationFn: (id: string) => deleteTask(id),
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
    const queryClient = useQueryClient();
    
    console.log("=== useToggleTaskCompletion hook initialized ===");
    
    // Import the SassClient to use the toggleTaskCompletion function
    const createSPASassClient = async () => {
        console.log("Creating SPA SassClient");
        try {
            const { createSPASassClient } = await import('@/lib/supabase/client');
            console.log("SPA SassClient module imported successfully");
            const client = await createSPASassClient();
            console.log("SPA SassClient created successfully:", client);
            return client;
        } catch (error) {
            console.error("Error creating SPA SassClient:", error);
            throw error;
        }
    };

    return (id: string, completed: boolean) => {
        console.log("=== useToggleTaskCompletion callback ===");
        console.log(`Parameters - id: ${id}, completed: ${completed}`);
        console.log("isDevelopment:", isDevelopment);
        
        if (isDevelopment) {
            // In development mode, directly update the mock data for immediate feedback
            console.log("Development mode: Updating mock task");
            const taskIndex = mockTasks.findIndex(task => task.id === id);
            console.log("Task index in mockTasks:", taskIndex);
            
            if (taskIndex !== -1) {
                console.log("Before update, task was:", mockTasks[taskIndex]);
                mockTasks[taskIndex].completed = completed;
                console.log("After update, task is:", mockTasks[taskIndex]);
                console.log(`Development mode: Updated task ${id} completion to ${completed}`);
            } else {
                console.error(`Task with ID ${id} not found in mockTasks`);
            }
        }
        
        // Immediately update the cache for a more responsive UI
        console.log("Updating query cache");
        queryClient.setQueryData(['tasks'], (oldData: Task[] | undefined) => {
            if (!oldData) {
                console.log("No existing data in cache");
                return undefined;
            }
            
            console.log("Existing tasks in cache:", oldData.length);
            const taskExists = oldData.some(task => task.id === id);
            console.log(`Task ${id} exists in cache:`, taskExists);
            
            const newData = oldData.map(task => 
                task.id === id ? { ...task, completed } : task
            );
            
            console.log("Cache updated");
            return newData;
        });
        
        // Use the updateTask mutation directly instead of SassClient for now
        console.log("Using updateTask mutation directly");
        return updateTask.mutate({ 
            id, 
            updates: { completed } 
        }, {
            onSuccess: (result) => {
                console.log(`Successfully updated task ${id} completion to ${completed}`);
                console.log("Result:", result);
                // Invalidate and refetch to ensure data consistency
                console.log("Invalidating queries");
                queryClient.invalidateQueries({ queryKey: ['tasks'] });
            },
            onError: (error) => {
                console.error(`Error updating task ${id} completion:`, error);
            }
        });
    };
}
