"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

// Define the context type
interface TaskFiltersContextType {
  statusFilter: 'all' | 'completed' | 'incomplete';
  setStatusFilter: (status: 'all' | 'completed' | 'incomplete') => void;
  listFilter: string | null;
  setListFilter: (list: string | null) => void;
  tagFilter: string | null;
  setTagFilter: (tag: string | null) => void;
  resetFilters: () => void;
  hasActiveFilters: () => boolean;
  activeFilterCount: number;
}

// Create the context with a default value
const TaskFiltersContext = createContext<TaskFiltersContextType | undefined>(undefined);

// Provider component
export function TaskFiltersProvider({ children }: { children: ReactNode }) {
  // Filter states
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'incomplete'>('all');
  const [listFilter, setListFilter] = useState<string | null>(null);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  
  // Track if any filters are active
  const [activeFilterCount, setActiveFilterCount] = useState(0);
  
  // Custom setters with logging
  const setStatusFilterWithLog = (status: 'all' | 'completed' | 'incomplete') => {
    console.log("TaskFiltersContext: Setting status filter to:", status);
    setStatusFilter(status);
  };
  
  const setListFilterWithLog = (list: string | null) => {
    console.log("TaskFiltersContext: Setting list filter to:", list);
    setListFilter(list);
  };
  
  const setTagFilterWithLog = (tag: string | null) => {
    console.log("TaskFiltersContext: Setting tag filter to:", tag);
    setTagFilter(tag);
  };
  
  // Update active filter count when filters change
  useEffect(() => {
    console.log("TaskFiltersContext: Filters changed - status:", statusFilter, "list:", listFilter, "tag:", tagFilter);
    let count = 0;
    if (statusFilter !== 'all') count++;
    if (listFilter !== null) count++;
    if (tagFilter !== null) count++;
    console.log("TaskFiltersContext: New active filter count:", count);
    setActiveFilterCount(count);
  }, [statusFilter, listFilter, tagFilter]);
  
  // Reset all filters
  const resetFilters = () => {
    console.log("TaskFiltersContext: Resetting all filters");
    setStatusFilter('all');
    setListFilter(null);
    setTagFilter(null);
  };
  
  // Helper to check if any filters are active
  const hasActiveFilters = () => {
    return statusFilter !== 'all' || listFilter !== null || tagFilter !== null;
  };
  
  // Create the context value
  const contextValue: TaskFiltersContextType = {
    statusFilter,
    setStatusFilter: setStatusFilterWithLog,
    listFilter,
    setListFilter: setListFilterWithLog,
    tagFilter,
    setTagFilter: setTagFilterWithLog,
    resetFilters,
    hasActiveFilters,
    activeFilterCount
  };
  
  return (
    <TaskFiltersContext.Provider value={contextValue}>
      {children}
    </TaskFiltersContext.Provider>
  );
}

// Custom hook to use the context
export function useTaskFiltersContext() {
  const context = useContext(TaskFiltersContext);
  if (context === undefined) {
    throw new Error("useTaskFiltersContext must be used within a TaskFiltersProvider");
  }
  return context;
}
