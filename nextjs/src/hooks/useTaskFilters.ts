"use client";

import { useTaskFiltersContext } from "@/lib/context/TaskFiltersContext";

/**
 * useTaskFilters hook
 * 
 * A custom hook for accessing task filtering states from the TaskFiltersContext.
 * Supports filtering by status (completed/incomplete) and tags.
 */
export function useTaskFilters() {
  // Get filter states from context
  const {
    statusFilter,
    setStatusFilter,
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
    
    // Tag filter
    tagFilter, 
    setTagFilter,
    
    // Helper functions
    resetFilters,
    hasActiveFilters,
    activeFilterCount
  };
}

export default useTaskFilters;
