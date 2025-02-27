"use client"

/**
 * AppLayout component
 * 
 * Main layout component for the application that includes the left sidebar, right sidebar,
 * and the main content area with the DashboardHeader.
 * 
 * Changes:
 * - Replaced the old header with the new DashboardHeader component
 * - Added support for project-specific pages with isProjectPage and projectName props
 */

import { SidebarLeft } from "@/components/sidebar-left"
import { SidebarRight } from "@/components/sidebar-right"
import { DashboardHeader } from "@/components/DashboardHeader"
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar"

interface AppLayoutProps {
    children: React.ReactNode
    isProjectPage?: boolean
    projectName?: string
}

export default function AppLayout({
    children,
    isProjectPage = false,
    projectName = ""
}: AppLayoutProps) {
    return (
        <SidebarProvider>
            <SidebarLeft />
            <SidebarInset>
                <DashboardHeader
                    isProjectPage={isProjectPage}
                    projectName={projectName}
                />
                <div className="flex flex-1 flex-col gap-4 p-4">
                    {children}
                </div>
            </SidebarInset>
            <SidebarRight />
        </SidebarProvider>
    )
}
