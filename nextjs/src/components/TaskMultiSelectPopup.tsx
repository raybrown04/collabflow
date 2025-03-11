"use client";

import React from "react";
import { Check, Bell, FileText, AlertTriangle, Trash2, X } from "lucide-react";
import { useTaskMultiSelect } from "@/lib/context/TaskMultiSelectContext";
import { cn } from "@/lib/utils";
import { useTaskLists } from "@/hooks/useTaskLists";
import { useUpdateTask, useDeleteTask } from "@/hooks/useTasks";
import { useToast } from "./ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";

interface TaskMultiSelectPopupProps {
  onComplete: (taskIds: string[], completed: boolean) => void;
}

export function TaskMultiSelectPopup({ onComplete }: TaskMultiSelectPopupProps) {
  const { 
    isMultiSelectMode, 
    setMultiSelectMode, 
    selectedTaskIds, 
    clearSelectedTasks,
    selectedCount
  } = useTaskMultiSelect();
  
  const { taskLists } = useTaskLists();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const { toast } = useToast();
  
  const [isListDialogOpen, setIsListDialogOpen] = React.useState(false);
  const [isPriorityDialogOpen, setIsPriorityDialogOpen] = React.useState(false);
  
  // Handle marking selected tasks as complete
  const handleComplete = () => {
    if (selectedTaskIds.length === 0) return;
    
    // Call the onComplete callback with all selected task IDs
    onComplete(selectedTaskIds, true);
    
    toast({
      title: "Tasks completed",
      description: `${selectedTaskIds.length} tasks marked as complete.`
    });
    
    // Clear selection and exit multi-select mode
    clearSelectedTasks();
    setMultiSelectMode(false);
  };
  
  // Handle deleting selected tasks
  const handleDelete = () => {
    if (selectedTaskIds.length === 0) return;
    
    // Delete each selected task
    selectedTaskIds.forEach(id => {
      deleteTask.mutate(id);
    });
    
    toast({
      title: "Tasks deleted",
      description: `${selectedTaskIds.length} tasks deleted.`
    });
    
    // Clear selection and exit multi-select mode
    clearSelectedTasks();
    setMultiSelectMode(false);
  };
  
  // Handle changing list for selected tasks
  const handleChangeList = (listId: string) => {
    if (selectedTaskIds.length === 0) return;
    
    // Update each selected task with the new list
    selectedTaskIds.forEach(id => {
      updateTask.mutate({
        id,
        updates: { list_id: listId }
      });
    });
    
    toast({
      title: "Tasks updated",
      description: `${selectedTaskIds.length} tasks moved to new list.`
    });
    
    // Close the list dialog
    setIsListDialogOpen(false);
  };
  
  // Handle changing priority for selected tasks
  const handleChangePriority = (priority: 'low' | 'medium' | 'high') => {
    if (selectedTaskIds.length === 0) return;
    
    // Update each selected task with the new priority
    selectedTaskIds.forEach(id => {
      updateTask.mutate({
        id,
        updates: { priority }
      });
    });
    
    toast({
      title: "Tasks updated",
      description: `${selectedTaskIds.length} tasks priority set to ${priority}.`
    });
    
    // Close the priority dialog
    setIsPriorityDialogOpen(false);
  };
  
  // If not in multi-select mode or no tasks selected, don't render
  if (!isMultiSelectMode || selectedTaskIds.length === 0) {
    return null;
  }
  
  return (
    <>
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 bg-white dark:bg-gray-800 rounded-full shadow-lg px-4 py-2 flex items-center space-x-4">
        <div className="flex items-center bg-primary/10 text-primary rounded-full px-3 py-1">
          <span className="font-medium">{selectedCount}</span>
          <span className="ml-2">Tasks selected</span>
        </div>
        
        <button 
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          onClick={handleComplete}
          title="Mark as complete"
        >
          <Check className="h-5 w-5" />
        </button>
        
        <button 
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          onClick={() => {}}
          title="Set reminder"
        >
          <Bell className="h-5 w-5" />
        </button>
        
        <button 
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          onClick={() => setIsListDialogOpen(true)}
          title="Change list"
        >
          <FileText className="h-5 w-5" />
        </button>
        
        <button 
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          onClick={() => setIsPriorityDialogOpen(true)}
          title="Set priority"
        >
          <AlertTriangle className="h-5 w-5" />
        </button>
        
        <button 
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          onClick={handleDelete}
          title="Delete tasks"
        >
          <Trash2 className="h-5 w-5" />
        </button>
        
        <button 
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          onClick={() => {
            clearSelectedTasks();
            setMultiSelectMode(false);
          }}
          title="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      
      {/* List selection dialog */}
      <Dialog open={isListDialogOpen} onOpenChange={setIsListDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Move to List</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2 py-4">
            {taskLists.map(list => (
              <Button
                key={list.id}
                variant="outline"
                className="justify-start"
                onClick={() => handleChangeList(list.id)}
              >
                <span 
                  className="w-2 h-2 rounded-full mr-2" 
                  style={{ backgroundColor: list.color }}
                ></span>
                {list.name}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Priority selection dialog */}
      <Dialog open={isPriorityDialogOpen} onOpenChange={setIsPriorityDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Set Priority</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2 py-4">
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => handleChangePriority('high')}
            >
              <span className="w-2 h-2 rounded-full mr-2 bg-red-500"></span>
              High
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => handleChangePriority('medium')}
            >
              <span className="w-2 h-2 rounded-full mr-2 bg-yellow-500"></span>
              Medium
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => handleChangePriority('low')}
            >
              <span className="w-2 h-2 rounded-full mr-2 bg-green-500"></span>
              Low
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default TaskMultiSelectPopup;
