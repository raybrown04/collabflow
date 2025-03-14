"use client"

import { useState, useEffect, useCallback } from "react"
import { Check, ChevronDown, ChevronRight, Plus, Tag, X, Edit } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import useProjects, { Project } from "@/hooks/useProjects"
import useProjectTags from "@/hooks/useProjectTags"

interface ProjectSelectorProps {
  taskId: string | null
  eventId?: string | null
  onProjectsChange?: (projects: Project[]) => void
}

export function ProjectSelector({ taskId, eventId, onProjectsChange }: ProjectSelectorProps) {
  const { data: allProjects = [] } = useProjects();
  const { selectedProjects, setSelectedProjects, getTaskProjects } = useProjectTags();
  
  const [isOpen, setIsOpen] = useState(false);
  const [localProjects, setLocalProjects] = useState<Project[]>([]);
  
  // Memoize the function to load entity projects
  const loadEntityProjects = useCallback(() => {
    if (taskId) {
      // For development mode, we'll use the mock data for tasks
      const taskProjects = getTaskProjects(taskId);
      setLocalProjects(taskProjects);
      
      // Also update the selected projects in the context
      setSelectedProjects(taskProjects);
    } else if (eventId) {
      // For development mode, we'll use the mock data for events
      // In a real implementation, this would fetch from the database
      // For now, we'll just use an empty array
      setLocalProjects([]);
      setSelectedProjects([]);
    } else {
      // New entity, no projects
      setLocalProjects([]);
      setSelectedProjects([]);
    }
  }, [taskId, eventId, getTaskProjects, setSelectedProjects]);
  
  // Load entity projects when taskId or eventId changes
  useEffect(() => {
    loadEntityProjects();
  }, [loadEntityProjects]);
  
  // Select a single project (for events)
  const selectProject = (project: Project) => {
    // For events, we only allow a single project
    const updatedProjects = [project];
    
    setLocalProjects(updatedProjects);
    setSelectedProjects(updatedProjects);
    
    // Notify parent component
    if (onProjectsChange) {
      onProjectsChange(updatedProjects);
    }
    
    // Close the dialog after selection
    setIsOpen(false);
  };
  
  // Clear the selected project
  const clearProject = () => {
    setLocalProjects([]);
    setSelectedProjects([]);
    
    // Notify parent component
    if (onProjectsChange) {
      onProjectsChange([]);
    }
  };
  
  return (
    <div>
      <div>
        {/* Project label is now here */}
        <label className="block text-sm font-medium mb-1">Projects</label>
        
        {/* Project selection button */}
        {localProjects.length === 0 ? (
          <Button
            type="button"
            variant="outline"
            className="w-full flex items-center justify-start gap-2 h-10"
            onClick={() => setIsOpen(true)}
          >
            <Plus className="h-4 w-4" />
            <span>Add Project</span>
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            className="w-full flex items-center justify-between h-10 px-3"
            style={{ 
              backgroundColor: `${localProjects[0].color}20`, 
              color: localProjects[0].color,
              borderColor: localProjects[0].color
            }}
            onClick={() => setIsOpen(true)}
          >
            <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
              <Tag className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{localProjects[0].name}</span>
            </div>
            <Edit className="h-4 w-4 flex-shrink-0" />
          </Button>
        )}
      </div>
      
      {/* Project selection dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Select Project</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            {allProjects.map(project => {
              const isSelected = localProjects.length > 0 && localProjects[0].id === project.id;
              
              return (
                <button
                  type="button"
                  key={project.id}
                  className={cn(
                    "w-full text-left py-2 px-3 rounded flex items-center justify-between",
                    isSelected ? "bg-primary/10" : "hover:bg-gray-100"
                  )}
                  onClick={() => selectProject(project)}
                >
                  <div className="flex items-center">
                    <span 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: project.color }}
                    ></span>
                    <span>{project.name}</span>
                  </div>
                  {isSelected && <Check className="h-4 w-4 text-primary" />}
                </button>
              );
            })}
            
            {localProjects.length > 0 && (
              <button
                type="button"
                className="w-full text-left py-2 px-3 rounded flex items-center justify-between text-destructive hover:bg-gray-100"
                onClick={() => {
                  clearProject();
                  setIsOpen(false);
                }}
              >
                <div className="flex items-center">
                  <X className="h-4 w-4 mr-2" />
                  <span>Remove Project</span>
                </div>
              </button>
            )}
            
            {allProjects.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                No projects available
              </div>
            )}
          </div>
          
          <div className="flex justify-end">
            <Button 
              type="button"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ProjectSelector;
