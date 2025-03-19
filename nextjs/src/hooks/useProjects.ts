"use client"

import { useState, useEffect, useCallback } from "react";
import { getSupabaseClient } from "@/lib/supabase/clientSingleton";
import { useGlobal } from "@/lib/context/GlobalContext";
import { useQuery } from "@tanstack/react-query";

// Define project interfaces
export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

function useProjects() {
  const supabase = getSupabaseClient();
  const { user, loading: authLoading, refreshSession } = useGlobal();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);

  // Fetch all projects
  const fetchProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if user is authenticated - use user from context
      if (!user) {
        // Try to refresh the session first before failing
        const success = await refreshSession();
        
        // If still no user after refresh, throw error
        if (!success) {
          throw new Error("User not authenticated");
        }
      }

      // Fetch projects
      const { data, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (projectsError) {
        throw new Error(`Failed to fetch projects: ${projectsError.message}`);
      }

      setProjects(data || []);
      return data || [];
    } catch (err) {
      console.error('Error fetching projects:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      const error = new Error(`Error fetching projects: ${errorMessage}`);
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [supabase, user, refreshSession]);

  // Create a new project
  const createProject = useCallback(async (name: string, color: string = "#4F46E5", description?: string) => {
    try {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from('projects')
        .insert({
          name,
          color,
          description,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      // Refresh projects list
      fetchProjects();
      return data;
    } catch (err) {
      console.error('Error creating project:', err);
      throw err;
    }
  }, [supabase, user, fetchProjects]);

  // Update a project
  const updateProject = useCallback(async (id: string, updates: Partial<Omit<Project, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Refresh projects list
      fetchProjects();
      return data;
    } catch (err) {
      console.error('Error updating project:', err);
      throw err;
    }
  }, [supabase, fetchProjects]);

  // Delete a project
  const deleteProject = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Refresh projects list
      fetchProjects();
    } catch (err) {
      console.error('Error deleting project:', err);
      throw err;
    }
  }, [supabase, fetchProjects]);

  // Convert to React Query
  const query = useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Call fetchProjects on mount
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return {
    projects,
    isLoading: query.isLoading || isLoading || authLoading,
    error: query.error || error,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
  };
}

// Export as both named and default export
export { useProjects };
export default useProjects;
