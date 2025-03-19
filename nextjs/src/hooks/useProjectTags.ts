"use client";

import { useProjectTagContext } from "@/lib/context/ProjectTagContext";
import { Project } from "@/hooks/useProjects";

/**
 * useProjectTags hook
 * 
 * A custom hook for accessing project tag filtering states from the ProjectTagContext.
 * Supports filtering by project and managing task-project associations.
 */
export function useProjectTags() {
  // Get project filter states from context
  const {
    projectFilter,
    setProjectFilter,
    selectedProjects,
    setSelectedProjects,
    addProjectToTask,
    removeProjectFromTask,
    getTaskProjects,
    resetProjectFilter
  } = useProjectTagContext();
  
  return {
    // Project filter
    projectFilter, 
    setProjectFilter,
    
    // Selected projects for the current task being edited
    selectedProjects,
    setSelectedProjects,
    
    // Task-project association management
    addProjectToTask,
    removeProjectFromTask,
    getTaskProjects,
    
    // Helper functions
    resetProjectFilter
  };
}

export default useProjectTags;
