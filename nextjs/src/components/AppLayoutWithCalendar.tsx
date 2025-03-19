"use client"

/**
 * AppLayoutWithCalendar component
 * Created: 3/4/2025
 * Updated: 3/12/2025
 * 
 * Extended layout component that includes the base AppLayout plus the calendar sidebar.
 * This is used for app routes that need the calendar functionality.
 * 
 * Added DndProvider at this level to avoid multiple HTML5 backends error when
 * both TaskList and SidebarRight components try to initialize their own DndProvider.
 */

import { SidebarLeft } from "@/components/sidebar-left"
import { SidebarRight } from "@/components/sidebar-right"
import { DashboardHeader } from "@/components/DashboardHeader"
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar"
import { DndProvider } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"

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
    // Always wrap with DndProvider to ensure drag and drop functionality works
    return (
        <DndProvider backend={HTML5Backend}>
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
        </DndProvider>
    );
}
