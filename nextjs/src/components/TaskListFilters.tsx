"use client"

import { useState, useEffect } from "react"
import { Check, ChevronDown, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import useTaskLists from "@/hooks/useTaskLists"
import useTaskFilters from "@/hooks/useTaskFilters"

interface TaskListFiltersProps {
    onClose?: () => void
}

export function TaskListFilters({ onClose }: TaskListFiltersProps) {
    const { 
        statusFilter, setStatusFilter,
        listFilter, setListFilter,
        resetFilters,
        activeFilterCount
    } = useTaskFilters();
    
    const { taskLists } = useTaskLists();
    
    // State for section collapse - default to collapsed
    const [statusSectionCollapsed, setStatusSectionCollapsed] = useState(true);
    const [listsSectionCollapsed, setListsSectionCollapsed] = useState(true);
    
    // Handle status filter selection
    const handleStatusSelect = (status: 'all' | 'completed' | 'incomplete') => {
        console.log("Setting status filter to:", status);
        console.log("Previous status filter was:", statusFilter);
        setStatusFilter(status);
    };
    
    // Handle list filter selection
    const handleListSelect = (listId: string | null) => {
        console.log("Setting list filter to:", listId);
        console.log("Previous list filter was:", listFilter);
        const newListFilter = listFilter === listId ? null : listId;
        console.log("New list filter will be:", newListFilter);
        setListFilter(newListFilter);
    };
    
    return (
        <div className="py-2">
            {/* Status filter section - collapsible */}
            <div 
                className="px-4 py-2 text-sm font-medium border-b flex items-center justify-between cursor-pointer"
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
                            "w-full text-left py-1.5 px-2 rounded flex items-center justify-between",
                            statusFilter === 'all' ? "bg-primary/10 text-primary" : "hover:bg-gray-100"
                        )}
                        onClick={() => handleStatusSelect('all')}
                    >
                        <span>All</span>
                        {statusFilter === 'all' && <Check className="h-4 w-4" />}
                    </button>
                    <button 
                        className={cn(
                            "w-full text-left py-1.5 px-2 rounded flex items-center justify-between",
                            statusFilter === 'completed' ? "bg-primary/10 text-primary" : "hover:bg-gray-100"
                        )}
                        onClick={() => handleStatusSelect('completed')}
                    >
                        <span>Completed</span>
                        {statusFilter === 'completed' && <Check className="h-4 w-4" />}
                    </button>
                    <button 
                        className={cn(
                            "w-full text-left py-1.5 px-2 rounded flex items-center justify-between",
                            statusFilter === 'incomplete' ? "bg-primary/10 text-primary" : "hover:bg-gray-100"
                        )}
                        onClick={() => handleStatusSelect('incomplete')}
                    >
                        <span>Incomplete</span>
                        {statusFilter === 'incomplete' && <Check className="h-4 w-4" />}
                    </button>
                </div>
            )}
            
            {/* Lists filter section - collapsible */}
            <div 
                className="px-4 py-2 text-sm font-medium border-b mt-2 flex items-center justify-between cursor-pointer"
                onClick={() => setListsSectionCollapsed(!listsSectionCollapsed)}
            >
                <span>My Lists</span>
                {listsSectionCollapsed ? 
                    <ChevronRight className="h-4 w-4" /> : 
                    <ChevronDown className="h-4 w-4" />
                }
            </div>
            {!listsSectionCollapsed && (
                <div className="px-2 py-1">
                    {taskLists.map(list => (
                        <button
                            key={list.id}
                            className={cn(
                                "w-full text-left py-1.5 px-2 rounded flex items-center justify-between",
                                listFilter === list.id ? "bg-primary/10 text-primary" : "hover:bg-gray-100"
                            )}
                            onClick={() => handleListSelect(list.id)}
                        >
                            <div className="flex items-center">
                                <span 
                                    className="w-2 h-2 rounded-full mr-2" 
                                    style={{ backgroundColor: list.color }}
                                ></span>
                                <span>{list.name}</span>
                            </div>
                            {listFilter === list.id && <Check className="h-4 w-4" />}
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
