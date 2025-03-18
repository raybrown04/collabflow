"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { startOfDay, format, parseISO } from "date-fns"
import { Database } from "@/lib/database.types"
import { useUpdateEvent } from "./useCalendarEvents"
import { useToast } from "@/components/ui/use-toast"

type CalendarEvent = Database['public']['Tables']['calendar_events']['Row']

export function useUpdateEventDate() {
    const updateEventMutation = useUpdateEvent()
    const queryClient = useQueryClient()
    const { toast } = useToast()

    const updateEventDate = async (event: CalendarEvent, newDate: Date): Promise<CalendarEvent> => {
        try {
            // Parse the current event date
            const currentDate = parseISO(event.date)

            // Create a new date with the same time but different day
            const updatedDate = new Date(newDate)
            updatedDate.setHours(
                currentDate.getHours(),
                currentDate.getMinutes(),
                currentDate.getSeconds(),
                currentDate.getMilliseconds()
            )

            // Prepare the update payload
            const updatedEvent: Partial<CalendarEvent> & { id: string } = {
                id: event.id,
                date: updatedDate.toISOString()
            }

            // Return the updated event
            return {
                ...event,
                date: updatedDate.toISOString()
            }
        } catch (error) {
            console.error('Error in updateEventDate:', error)
            throw error
        }
    }

    return useMutation({
        mutationFn: ({ event, newDate }: { event: CalendarEvent, newDate: Date }) =>
            updateEventDate(event, newDate),
        onMutate: async ({ event, newDate }) => {
            // Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey: ['events'] })

            // Snapshot the previous value
            const previousEvents = queryClient.getQueryData(['events']) as CalendarEvent[] | undefined

            // Optimistically update to the new value
            if (previousEvents) {
                const updatedEvents = previousEvents.map(e => {
                    if (e.id === event.id) {
                        const currentDate = parseISO(e.date)
                        const updatedDate = new Date(newDate)
                        updatedDate.setHours(
                            currentDate.getHours(),
                            currentDate.getMinutes(),
                            currentDate.getSeconds(),
                            currentDate.getMilliseconds()
                        )

                        return {
                            ...e,
                            date: updatedDate.toISOString()
                        }
                    }
                    return e
                })

                queryClient.setQueryData(['events'], updatedEvents)
            }

            // Return a context object with the snapshotted value
            return { previousEvents }
        },
        onSuccess: (updatedEvent) => {
            // Show success toast
            toast({
                title: "Event rescheduled",
                description: `"${updatedEvent.title}" moved to ${format(parseISO(updatedEvent.date), "MMMM d, yyyy")}`,
                variant: "default",
            })

            // Update the real event in the database
            updateEventMutation.mutate({
                id: updatedEvent.id,
                date: updatedEvent.date
            })
        },
        onError: (error, variables, context) => {
            // Show error toast
            toast({
                title: "Failed to reschedule event",
                description: error instanceof Error ? error.message : "An unknown error occurred",
                variant: "destructive",
            })

            // Rollback to the previous value
            if (context?.previousEvents) {
                queryClient.setQueryData(['events'], context.previousEvents)
            }
        },
        onSettled: () => {
            // Always refetch after error or success to ensure we're up to date
            queryClient.invalidateQueries({ queryKey: ['events'] })
        },
    })
}
