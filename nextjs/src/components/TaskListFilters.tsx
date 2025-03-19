"use client"

import { useState, useEffect } from "react"
import { Check, ChevronDown, ChevronRight, Tag } from "lucide-react"
import { cn } from "@/lib/utils"
import useTaskFilters from "@/hooks/useTaskFilters"
import { useProjects } from "@/hooks/useProjects"
import useProjectTags from "@/hooks/useProjectTags"

interface TaskListFiltersProps {
    onClose?: () => void
}

export function TaskListFilters({ onClose }: TaskListFiltersProps) {
    const { 
        statusFilter, setStatusFilter,
        resetFilters,
        activeFilterCount
    } = useTaskFilters();
    
    const { projectFilter, setProjectFilter } = useProjectTags();
    
    const { projects = [] } = useProjects();
    
    // State for section collapse - default to collapsed
    const [statusSectionCollapsed, setStatusSectionCollapsed] = useState(true);
    const [projectsSectionCollapsed, setProjectsSectionCollapsed] = useState(true);
    
    // Handle status filter selection
    const handleStatusSelect = (status: 'all' | 'completed' | 'incomplete') => {
        console.log("Setting status filter to:", status);
        console.log("Previous status filter was:", statusFilter);
        setStatusFilter(status);
    };
    
    // Handle project filter selection
    const handleProjectSelect = (projectId: string | null) => {
        console.log("Setting project filter to:", projectId);
        console.log("Previous project filter was:", projectFilter);
        const newProjectFilter = projectFilter === projectId ? null : projectId;
        console.log("New project filter will be:", newProjectFilter);
        setProjectFilter(newProjectFilter);
    };
    
    return (
        <div className="py-2">
            {/* Status filter section - collapsible */}
            <div 
                className="px-4 py-2 text-sm flex items-center justify-between cursor-pointer"
                onClick={() => setStatusSectionCollapsed(!statusSectionCollapsed)}
            >
                <span>Status</span>
                {statusSectionCollapsed ? 
                    <ChevronRight className="h-4 w-4" /> : 
                    <ChevronDown className="h-4 w-4" />
                }
            </div>
            {!statusSectionCollapsed && (
                <div className="px-2 py-1">
                    <button 
                        className={cn(
                            "w-full text-left py-1.5 px-2 rounded flex items-center justify-between text-sm",
                            statusFilter === 'all' ? "bg-primary/10 text-primary" : "hover:bg-gray-100"
                        )}
                        onClick={() => handleStatusSelect('all')}
                    >
                        <span>All</span>
                        {statusFilter === 'all' && <Check className="h-4 w-4" />}
                    </button>
                    <button 
                        className={cn(
                            "w-full text-left py-1.5 px-2 rounded flex items-center justify-between text-sm",
                            statusFilter === 'completed' ? "bg-primary/10 text-primary" : "hover:bg-gray-100"
                        )}
                        onClick={() => handleStatusSelect('completed')}
                    >
                        <span>Completed</span>
                        {statusFilter === 'completed' && <Check className="h-4 w-4" />}
                    </button>
                    <button 
                        className={cn(
                            "w-full text-left py-1.5 px-2 rounded flex items-center justify-between text-sm",
                            statusFilter === 'incomplete' ? "bg-primary/10 text-primary" : "hover:bg-gray-100"
                        )}
                        onClick={() => handleStatusSelect('incomplete')}
                    >
                        <span>Incomplete</span>
                        {statusFilter === 'incomplete' && <Check className="h-4 w-4" />}
                    </button>
                </div>
            )}
            
            {/* Projects filter section - collapsible */}
            <div 
                className="px-4 py-2 text-sm flex items-center justify-between cursor-pointer"
                onClick={() => setProjectsSectionCollapsed(!projectsSectionCollapsed)}
            >
                <span>Projects</span>
                {projectsSectionCollapsed ? 
                    <ChevronRight className="h-4 w-4" /> : 
                    <ChevronDown className="h-4 w-4" />
                }
            </div>
            {!projectsSectionCollapsed && (
                <div className="px-2 py-1">
                    {projects.map(project => (
                        <button
                            key={project.id}
                            className={cn(
                                "w-full text-left py-1.5 px-2 rounded flex items-center justify-between text-sm",
                                projectFilter === project.id ? "bg-primary/10 text-primary" : "hover:bg-gray-100"
                            )}
                            onClick={() => handleProjectSelect(project.id)}
                        >
                            <div className="flex items-center">
                                <span 
                                    className="w-2 h-2 rounded-full mr-2" 
                                    style={{ backgroundColor: project.color }}
                                ></span>
                                <span>{project.name}</span>
                            </div>
                            {projectFilter === project.id && <Check className="h-4 w-4" />}
                        </button>
                    ))}
                </div>
            )}
            
            
            {/* Reset filters button */}
            {activeFilterCount > 0 && (
                <div className="px-2 py-2 mt-2">
                    <button 
                        className="w-full text-sm text-center py-1.5 px-2 border rounded hover:bg-gray-50"
                        onClick={() => {
                            resetFilters();
                            if (onClose) onClose();
                        }}
                    >
                        Reset Filters ({activeFilterCount})
                    </button>
                </div>
            )}
        </div>
    );
}

export default TaskListFilters;
