"use client"

/**
 * AppLayoutWithCalendar component
 * Created: 3/4/2025
 * 
 * Extended layout component that includes the base AppLayout plus the calendar sidebar.
 * This is used for app routes that need the calendar functionality.
 */

import { SidebarLeft } from "@/components/sidebar-left"
import { SidebarRight } from "@/components/sidebar-right"
import { DashboardHeader } from "@/components/DashboardHeader"
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar"

interface AppLayoutWithCalendarProps {
    children: React.ReactNode
    isProjectPage?: boolean
    projectName?: string
}

export default function AppLayoutWithCalendar({
    children,
    isProjectPage = false,
    projectName = ""
}: AppLayoutWithCalendarProps) {
    return (
        <SidebarProvider>
            <SidebarLeft />
            <SidebarInset className="!border-0 overflow-hidden">
                <DashboardHeader
                    isProjectPage={isProjectPage}
                    projectName={projectName}
                />
                <div className="flex flex-1 flex-col gap-4 p-4 mx-1 border-t-0">
                    {children}
                </div>
            </SidebarInset>
            <SidebarRight />
        </SidebarProvider>
    )
}
