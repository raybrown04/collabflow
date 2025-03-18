"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Task } from "@/components/TaskItem";

interface TaskMultiSelectContextType {
  isMultiSelectMode: boolean;
  setMultiSelectMode: (mode: boolean) => void;
  selectedTaskIds: string[];
  toggleTaskSelection: (taskId: string) => void;
  selectAllTasks: (taskIds: string[]) => void;
  clearSelectedTasks: () => void;
  selectedCount: number;
}

const TaskMultiSelectContext = createContext<TaskMultiSelectContextType | undefined>(undefined);

export function TaskMultiSelectProvider({ children }: { children: ReactNode }) {
  const [isMultiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

  const setMultiSelectModeWithLog = React.useCallback((mode: boolean) => {
    if (process.env.NODE_ENV === 'development') {
      console.log("TaskMultiSelectContext: Setting multi-select mode to:", mode);
    }
    setMultiSelectMode(mode);
  }, []);

  const toggleTaskSelection = (taskId: string) => {
    console.log("TaskMultiSelectContext: Toggling selection for task:", taskId);
    setSelectedTaskIds(prev => {
      if (prev.includes(taskId)) {
        console.log("TaskMultiSelectContext: Removing task from selection");
        return prev.filter(id => id !== taskId);
      } else {
        console.log("TaskMultiSelectContext: Adding task to selection");
        return [...prev, taskId];
      }
    });
  };

  const selectAllTasks = (taskIds: string[]) => {
    console.log("TaskMultiSelectContext: Selecting all tasks:", taskIds);
    setSelectedTaskIds(taskIds);
  };

  const clearSelectedTasks = () => {
    console.log("TaskMultiSelectContext: Clearing all selected tasks");
    setSelectedTaskIds([]);
  };

  // Only log when selected tasks change, don't auto-exit multi-select mode
  // This allows users to enter multi-select mode and then select tasks

  // Log when multi-select mode changes
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && isMultiSelectMode) {
      console.log("TaskMultiSelectContext: Multi-select mode active");
    }
  }, [isMultiSelectMode]);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && selectedTaskIds.length > 0) {
      console.log("TaskMultiSelectContext: Selected tasks count:", selectedTaskIds.length);
    }
  }, [selectedTaskIds]);

  return (
    <TaskMultiSelectContext.Provider
      value={{
        isMultiSelectMode,
        setMultiSelectMode: setMultiSelectModeWithLog,
        selectedTaskIds,
        toggleTaskSelection,
        selectAllTasks,
        clearSelectedTasks,
        selectedCount: selectedTaskIds.length
      }}
    >
      {children}
    </TaskMultiSelectContext.Provider>
  );
}

export function useTaskMultiSelect() {
  const context = useContext(TaskMultiSelectContext);
  if (context === undefined) {
    throw new Error("useTaskMultiSelect must be used within a TaskMultiSelectProvider");
  }
  return context;
}
