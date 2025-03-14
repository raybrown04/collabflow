"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { Project } from "@/hooks/useProjects";

// Define the context type
interface ProjectTagContextType {
  projectFilter: string | null;
  setProjectFilter: (projectId: string | null) => void;
  selectedProjects: Project[];
  setSelectedProjects: (projects: Project[]) => void;
  addProjectToTask: (taskId: string, projectId: string) => void;
  removeProjectFromTask: (taskId: string, projectId: string) => void;
  getTaskProjects: (taskId: string) => Project[];
  resetProjectFilter: () => void;
}

// Create the context with a default value
const ProjectTagContext = createContext<ProjectTagContextType | undefined>(undefined);

// Provider component
export function ProjectTagProvider({ children }: { children: ReactNode }) {
  // Project filter state
  const [projectFilter, setProjectFilter] = useState<string | null>(null);
  
  // Selected projects for the current task being edited
  const [selectedProjects, setSelectedProjects] = useState<Project[]>([]);
  
  // Task projects mapping for development mode
  const [taskProjectsMap, setTaskProjectsMap] = useState<Record<string, Project[]>>({});
  
  // Custom setter with logging - memoized
  const setProjectFilterWithLog = useCallback((projectId: string | null) => {
    if (process.env.NODE_ENV === 'development') {
      console.log("ProjectTagContext: Setting project filter to:", projectId);
    }
    setProjectFilter(projectId);
  }, []);
  
  // Reset project filter - memoized
  const resetProjectFilter = useCallback(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log("ProjectTagContext: Resetting project filter");
    }
    setProjectFilter(null);
  }, []);
  
  // Add a project to a task (for development mode) - memoized
  const addProjectToTask = useCallback((taskId: string, projectId: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`ProjectTagContext: Adding project ${projectId} to task ${taskId}`);
    }
    
    // Get the project from the selected projects
    setTaskProjectsMap(prev => {
      const taskProjects = prev[taskId] || [];
      // Find the project in selected projects
      const project = selectedProjects.find(p => p.id === projectId);
      if (!project) {
        console.error(`Project with ID ${projectId} not found in selected projects`);
        return prev;
      }
      
      // Check if project is already assigned to task
      if (taskProjects.some(p => p.id === projectId)) {
        return prev;
      }
      
      return {
        ...prev,
        [taskId]: [...taskProjects, project]
      };
    });
  }, [selectedProjects]);
  
  // Remove a project from a task (for development mode) - memoized
  const removeProjectFromTask = useCallback((taskId: string, projectId: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`ProjectTagContext: Removing project ${projectId} from task ${taskId}`);
    }
    
    // Update the task projects map
    setTaskProjectsMap(prev => {
      const taskProjects = prev[taskId] || [];
      return {
        ...prev,
        [taskId]: taskProjects.filter(p => p.id !== projectId)
      };
    });
  }, []);
  
  // Get projects for a task (for development mode) - memoized
  const getTaskProjects = useCallback((taskId: string): Project[] => {
    return taskProjectsMap[taskId] || [];
  }, [taskProjectsMap]);
  
  // Create the context value
  const contextValue: ProjectTagContextType = {
    projectFilter,
    setProjectFilter: setProjectFilterWithLog,
    selectedProjects,
    setSelectedProjects,
    addProjectToTask,
    removeProjectFromTask,
    getTaskProjects,
    resetProjectFilter
  };
  
  return (
    <ProjectTagContext.Provider value={contextValue}>
      {children}
    </ProjectTagContext.Provider>
  );
}

// Custom hook to use the context
export function useProjectTagContext() {
  const context = useContext(ProjectTagContext);
  if (context === undefined) {
    throw new Error("useProjectTagContext must be used within a ProjectTagProvider");
  }
  return context;
}
