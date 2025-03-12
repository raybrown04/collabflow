"use client";

import React, { useState } from "react";
import { Check, Bell, FileText, Repeat, Trash2, X } from "lucide-react";
import { useTaskMultiSelect } from "@/lib/context/TaskMultiSelectContext";
import { cn } from "@/lib/utils";
import { useTaskLists } from "@/hooks/useTaskLists";
import { useUpdateTask, useDeleteTask } from "@/hooks/useTasks";
import { useToast } from "./ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { format } from "date-fns";
import { ReminderDialog } from "./ReminderDialog";

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
  const [isRecurringDialogOpen, setIsRecurringDialogOpen] = React.useState(false);
  const [isReminderDialogOpen, setIsReminderDialogOpen] = React.useState(false);
  
  // Reminder state
  const [reminderDate, setReminderDate] = React.useState<string>("");
  const [reminderTime, setReminderTime] = React.useState<string>("09:00");
  
  // Recurring state
  const [recurrenceFrequency, setRecurrenceFrequency] = React.useState<"daily" | "weekly" | "monthly" | "yearly">("weekly");
  const [recurrenceInterval, setRecurrenceInterval] = React.useState(1);
  const [recurrenceEndType, setRecurrenceEndType] = React.useState<"never" | "after" | "on">("never");
  const [recurrenceCount, setRecurrenceCount] = React.useState(10);
  const [recurrenceEndDate, setRecurrenceEndDate] = React.useState<Date>(() => {
    // Default to 3 months from now
    const date = new Date();
    date.setMonth(date.getMonth() + 3);
    return date;
  });
  
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
  
  // Handle setting recurring for selected tasks
  const handleSetRecurring = () => {
    if (selectedTaskIds.length === 0) return;
    
    // Generate recurrence rule
    let recurrenceRule = null;
    
    // Build the RRULE string according to iCalendar format
    recurrenceRule = `FREQ=${recurrenceFrequency.toUpperCase()};INTERVAL=${recurrenceInterval}`;
    
    // Add end conditions
    if (recurrenceEndType === "after") {
      recurrenceRule += `;COUNT=${recurrenceCount}`;
    } else if (recurrenceEndType === "on") {
      const untilDate = format(recurrenceEndDate, "yyyyMMdd");
      recurrenceRule += `;UNTIL=${untilDate}T235959Z`;
    }
    
    // Update each selected task with the recurrence rule
    selectedTaskIds.forEach(id => {
      updateTask.mutate({
        id,
        updates: { recurrence_rule: recurrenceRule }
      });
    });
    
    toast({
      title: "Tasks updated",
      description: `${selectedTaskIds.length} tasks set to recurring.`
    });
    
    // Close the recurring dialog
    setIsRecurringDialogOpen(false);
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
          onClick={() => setIsReminderDialogOpen(true)}
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
          onClick={() => setIsRecurringDialogOpen(true)}
          title="Set recurring"
        >
          <Repeat className="h-5 w-5" />
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
        <DialogContent className="sm:max-w-[400px] bg-white text-black">
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
      
      {/* Recurring selection dialog */}
      <Dialog open={isRecurringDialogOpen} onOpenChange={setIsRecurringDialogOpen}>
        <DialogContent className="sm:max-w-[400px] bg-white text-black">
          <DialogHeader>
            <DialogTitle>Set Recurring</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Frequency
              </label>
              <select
                id="recurrence-frequency"
                name="recurrence-frequency"
                value={recurrenceFrequency}
                onChange={(e) => setRecurrenceFrequency(e.target.value as any)}
                className="w-full rounded-md border px-3 py-2 bg-background text-foreground"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Every
              </label>
              <div className="flex items-center">
                <input
                  type="number"
                  id="recurrence-interval"
                  name="recurrence-interval"
                  min="1"
                  max="99"
                  value={recurrenceInterval}
                  onChange={(e) => setRecurrenceInterval(parseInt(e.target.value) || 1)}
                  className="w-20 rounded-md border px-3 py-2 bg-background text-foreground"
                />
                <span className="ml-2">
                  {recurrenceFrequency === "daily" && "day(s)"}
                  {recurrenceFrequency === "weekly" && "week(s)"}
                  {recurrenceFrequency === "monthly" && "month(s)"}
                  {recurrenceFrequency === "yearly" && "year(s)"}
                </span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Ends
              </label>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="never-end"
                    name="recurrence-end"
                    checked={recurrenceEndType === "never"}
                    onChange={() => setRecurrenceEndType("never")}
                    className="mr-2 h-4 w-4"
                  />
                  <label htmlFor="never-end" className="text-sm">
                    Never
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="radio"
                    id="end-after"
                    name="recurrence-end"
                    checked={recurrenceEndType === "after"}
                    onChange={() => setRecurrenceEndType("after")}
                    className="mr-2 h-4 w-4"
                  />
                  <label htmlFor="end-after" className="text-sm mr-2">
                    After
                  </label>
                  <input
                    type="number"
                    id="recurrence-count"
                    name="recurrence-count"
                    min="1"
                    max="999"
                    value={recurrenceCount}
                    onChange={(e) => setRecurrenceCount(parseInt(e.target.value) || 1)}
                    className="w-20 rounded-md border px-3 py-2 bg-background text-foreground"
                    disabled={recurrenceEndType !== "after"}
                  />
                  <span className="ml-2">occurrence(s)</span>
                </div>

                <div className="flex items-center">
                  <input
                    type="radio"
                    id="end-on"
                    name="recurrence-end"
                    checked={recurrenceEndType === "on"}
                    onChange={() => setRecurrenceEndType("on")}
                    className="mr-2 h-4 w-4"
                  />
                  <label htmlFor="end-on" className="text-sm mr-2">
                    On
                  </label>
                  <input
                    type="date"
                    id="recurrence-end-date"
                    name="recurrence-end-date"
                    value={format(recurrenceEndDate, "yyyy-MM-dd")}
                    onChange={(e) => setRecurrenceEndDate(new Date(e.target.value))}
                    className="rounded-md border px-3 py-2 bg-background text-foreground"
                    disabled={recurrenceEndType !== "on"}
                  />
                </div>
              </div>
            </div>
            
            <Button onClick={handleSetRecurring}>
              Apply
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Reminder Dialog */}
      <ReminderDialog
        isOpen={isReminderDialogOpen}
        onClose={() => setIsReminderDialogOpen(false)}
        onSetReminder={(date, time) => {
          if (selectedTaskIds.length === 0) return;
          
          // Create a date object from the date string
          const dateObj = new Date(date);
          const [hours, minutes] = time.split(':').map(Number);
          dateObj.setHours(hours, minutes, 0, 0);
          
          // Convert to ISO string for storage
          const dueDateTime = dateObj.toISOString();
          
          console.log(`[TaskMultiSelectPopup] Setting reminder for ${selectedTaskIds.length} tasks: ${date} at ${time}`);
          console.log(`[TaskMultiSelectPopup] Due date time: ${dueDateTime}`);
          
          // Update each selected task with the new due date
          selectedTaskIds.forEach(id => {
            updateTask.mutate({
              id,
              updates: { due_date: dueDateTime }
            });
          });
          
          toast({
            title: "Reminders set",
            description: `Set reminders for ${selectedTaskIds.length} tasks.`
          });
          
          // Close the reminder dialog
          setIsReminderDialogOpen(false);
        }}
      />
    </>
  );
}

export default TaskMultiSelectPopup;
