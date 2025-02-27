"use client"

/**
 * DashboardHeader component
 * 
 * Header component for the dashboard with title, search bar, and user profile menu.
 * Shows "Dashboard" for the main page and project name for project-specific pages.
 */

import { useState } from "react"
import { Search, Bell, User, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface DashboardHeaderProps {
    title?: string
    isProjectPage?: boolean
    projectName?: string
}

export function DashboardHeader({
    title = "Dashboard",
    isProjectPage = false,
    projectName = ""
}: DashboardHeaderProps) {
    const [searchQuery, setSearchQuery] = useState("")
    const { user, isAdmin } = useAuth()

    const displayName = user?.email?.split('@')[0] || 'User'

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        // Implement search functionality
        console.log("Search query:", searchQuery)
    }

    const handleLogout = async () => {
        try {
            // Implement logout functionality
            window.location.href = '/auth/login'
        } catch (error) {
            console.error('Error logging out:', error)
        }
    }

    return (
        <header className="flex items-center justify-between p-4 border-b bg-background">
            <div className="flex items-center">
                <h1 className="text-2xl font-bold">
                    {isProjectPage ? projectName : title}
                </h1>
            </div>

            <div className="flex items-center gap-4">
                <form onSubmit={handleSearch} className="relative hidden md:block">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search..."
                        className="w-64 pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </form>

                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary"></span>
                </Button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <User className="h-5 w-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>
                            <div className="flex flex-col">
                                <span>{displayName}</span>
                                <span className="text-xs text-muted-foreground">{user?.email}</span>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                            <User className="mr-2 h-4 w-4" />
                            <span>Profile</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Settings</span>
                        </DropdownMenuItem>
                        {isAdmin && (
                            <DropdownMenuItem>
                                <Settings className="mr-2 h-4 w-4" />
                                <span>Admin Panel</span>
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout}>
                            <span>Log out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}

export default DashboardHeader
