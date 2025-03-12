"use client";

import { useTaskFiltersContext } from "@/lib/context/TaskFiltersContext";

/**
 * useTaskFilters hook
 * 
 * A custom hook for accessing task filtering states from the TaskFiltersContext.
 * Supports filtering by status (completed/incomplete) and task list.
 */
export function useTaskFilters() {
  // Get filter states from context
  const {
    statusFilter,
    setStatusFilter,
    listFilter,
    setListFilter,
    tagFilter,
    setTagFilter,
    resetFilters,
    hasActiveFilters,
    activeFilterCount
  } = useTaskFiltersContext();
  
  return {
    // Status filter
    statusFilter, 
    setStatusFilter,
    
    // List filter
    listFilter, 
    setListFilter,
    
    // Tag filter (for future implementation)
    tagFilter, 
    setTagFilter,
    
    // Helper functions
    resetFilters,
    hasActiveFilters,
    activeFilterCount
  };
}

export default useTaskFilters;
