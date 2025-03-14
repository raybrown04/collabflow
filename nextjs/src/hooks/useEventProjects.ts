"use client";

import { useState, useCallback } from "react";
import { supabase } from "@/lib/auth";
import { Project } from "@/hooks/useProjects";
import { useQueryClient } from "@tanstack/react-query";

/**
 * useEventProjects hook
 * 
 * A custom hook for managing project associations with calendar events.
 * Supports adding and removing projects from events, and retrieving projects for an event.
 */
export function useEventProjects() {
  const [selectedProjects, setSelectedProjects] = useState<Project[]>([]);
  const queryClient = useQueryClient();
  
  // Development mode detection
  // Force development mode to true until database issues are resolved
  const isDevelopment = true;
  
  // Mock event-project associations for development mode
  const [eventProjectsMap, setEventProjectsMap] = useState<Record<string, Project[]>>({});
  
  // Add a project to an event
  const addProjectToEvent = useCallback(async (eventId: string, projectId: string) => {
    if (isDevelopment) {
      console.log(`Development mode: Adding project ${projectId} to event ${eventId}`);
      
      // Get the project from the selected projects
      setEventProjectsMap(prev => {
        const eventProjects = prev[eventId] || [];
        // Find the project in selected projects
        const project = selectedProjects.find(p => p.id === projectId);
        if (!project) {
          console.error(`Project with ID ${projectId} not found in selected projects`);
          return prev;
        }
        
        // Check if project is already assigned to event
        if (eventProjects.some(p => p.id === projectId)) {
          return prev;
        }
        
        return {
          ...prev,
          [eventId]: [...eventProjects, project]
        };
      });
      
      // Invalidate calendar events query to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      
      return true;
    }
    
    try {
      const { error } = await supabase
        .from('event_projects')
        .insert({
          event_id: eventId,
          project_id: projectId
        });
      
      if (error) {
        console.error("Error adding project to event:", error);
        return false;
      }
      
      // Invalidate calendar events query to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      
      return true;
    } catch (error) {
      console.error("Exception in addProjectToEvent:", error);
      return false;
    }
  }, [selectedProjects, queryClient, isDevelopment]);
  
  // Remove a project from an event
  const removeProjectFromEvent = useCallback(async (eventId: string, projectId: string) => {
    if (isDevelopment) {
      console.log(`Development mode: Removing project ${projectId} from event ${eventId}`);
      
      // Update the event projects map
      setEventProjectsMap(prev => {
        const eventProjects = prev[eventId] || [];
        return {
          ...prev,
          [eventId]: eventProjects.filter(p => p.id !== projectId)
        };
      });
      
      // Invalidate calendar events query to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      
      return true;
    }
    
    try {
      const { error } = await supabase
        .from('event_projects')
        .delete()
        .eq('event_id', eventId)
        .eq('project_id', projectId);
      
      if (error) {
        console.error("Error removing project from event:", error);
        return false;
      }
      
      // Invalidate calendar events query to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      
      return true;
    } catch (error) {
      console.error("Exception in removeProjectFromEvent:", error);
      return false;
    }
  }, [queryClient, isDevelopment]);
  
  // Get projects for an event
  const getEventProjects = useCallback((eventId: string): Project[] => {
    if (isDevelopment) {
      return eventProjectsMap[eventId] || [];
    }
    
    // In production, this would fetch from the database
    // For now, return empty array since we're in development mode
    return [];
  }, [eventProjectsMap, isDevelopment]);
  
  // Update event projects (add/remove multiple projects at once)
  const updateEventProjects = useCallback(async (eventId: string, projects: Project[]) => {
    if (isDevelopment) {
      console.log(`Development mode: Updating projects for event ${eventId}`, projects);
      
      // Set the projects for the event
      setEventProjectsMap(prev => ({
        ...prev,
        [eventId]: [...projects]
      }));
      
      // Invalidate calendar events query to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      
      return true;
    }
    
    try {
      // In production, this would:
      // 1. Delete all existing project associations for the event
      // 2. Insert new project associations
      
      // For now, just update the local state
      return true;
    } catch (error) {
      console.error("Exception in updateEventProjects:", error);
      return false;
    }
  }, [queryClient, isDevelopment]);
  
  return {
    selectedProjects,
    setSelectedProjects,
    addProjectToEvent,
    removeProjectFromEvent,
    getEventProjects,
    updateEventProjects
  };
}

export default useEventProjects;
