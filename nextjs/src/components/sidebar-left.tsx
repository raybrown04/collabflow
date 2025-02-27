"use client"

/**
 * Enhanced SidebarLeft component with CSS grid-based transition technique
 * for smoothly expanding/collapsing menu items.
 * 
 * Changes:
 * - Added company logo and branding
 * - Added AI Assistants section with specialized agents
 * - Added expandable menu items using CSS grid transitions
 * - Implemented inert attribute for accessibility
 * - Added JavaScript to toggle expansion/collapse
 */

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Sidebar } from "@/components/ui/sidebar";
import { useAuth } from "@/lib/auth";
import {
    ChevronDown,
    ChevronRight,
    LayoutDashboard,
    FolderKanban,
    CheckSquare,
    BarChart3,
    Users,
    Settings,
    ActivitySquare,
    Bot,
    Search,
    Scale,
    DollarSign,
    File,
    Mail
} from "lucide-react";

// Badge component for "Coming Soon" indicators
function Badge({ children }: { children: React.ReactNode }) {
    return (
        <span className="ml-2 rounded-full bg-secondary/10 px-2 py-0.5 text-xs font-medium text-secondary">
            {children}
        </span>
    );
}

export function SidebarLeft() {
    const { user, isAdmin } = useAuth();
    // State to track which menu items are expanded
    const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({
        projects: false,
        reports: false,
        admin: false,
        aiAssistants: false
    });

    // Toggle expansion state of a menu item
    const toggleExpand = (itemKey: string) => {
        setExpandedItems(prev => ({
            ...prev,
            [itemKey]: !prev[itemKey]
        }));
    };

    return (
        <Sidebar>
            <div className="flex flex-col gap-4 p-4">
                {/* Company Logo and Branding */}
                <div className="flex items-center gap-2 border-b pb-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
                        <span className="text-lg font-bold text-primary-foreground">CF</span>
                    </div>
                    <span className="text-lg font-semibold">CollabFlow</span>
                </div>
                <nav className="grid gap-1">
                    {/* Main Navigation */}
                    <Link
                        href="/app"
                        className={cn(
                            buttonVariants({ variant: "ghost" }),
                            "justify-start"
                        )}
                    >
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Overview
                    </Link>

                    {/* Documents link */}
                    <Link
                        href="/app/documents"
                        className={cn(
                            buttonVariants({ variant: "ghost" }),
                            "justify-start"
                        )}
                    >
                        <File className="mr-2 h-4 w-4" />
                        Documents
                    </Link>

                    {/* Email link */}
                    <Link
                        href="/app/email"
                        className={cn(
                            buttonVariants({ variant: "ghost" }),
                            "justify-start"
                        )}
                    >
                        <Mail className="mr-2 h-4 w-4" />
                        Email
                    </Link>

                    {/* Expandable menu item - Projects */}
                    <li className="menu-item list-none">
                        <button
                            onClick={() => toggleExpand('projects')}
                            className={cn(
                                buttonVariants({ variant: "ghost" }),
                                "justify-between w-full"
                            )}
                            aria-expanded={expandedItems.projects}
                        >
                            <span className="flex items-center">
                                <FolderKanban className="mr-2 h-4 w-4" />
                                Projects
                            </span>
                            {expandedItems.projects ? (
                                <ChevronDown className="h-4 w-4" />
                            ) : (
                                <ChevronRight className="h-4 w-4" />
                            )}
                        </button>
                        <div inert={!expandedItems.projects || undefined}>
                            <div className="pl-6 py-1">
                                <ul className="space-y-1">
                                    <li>
                                        <Link
                                            href="/app/tasks"
                                            className={cn(
                                                buttonVariants({ variant: "ghost", size: "sm" }),
                                                "justify-start w-full"
                                            )}
                                        >
                                            Active Projects
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="#"
                                            className={cn(
                                                buttonVariants({ variant: "ghost", size: "sm" }),
                                                "justify-start w-full"
                                            )}
                                        >
                                            Archived Projects
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="#"
                                            className={cn(
                                                buttonVariants({ variant: "ghost", size: "sm" }),
                                                "justify-start w-full"
                                            )}
                                        >
                                            Create New
                                        </Link>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </li>

                    {/* Regular link */}
                    <Link
                        href="#"
                        className={cn(
                            buttonVariants({ variant: "ghost" }),
                            "justify-start"
                        )}
                    >
                        <CheckSquare className="mr-2 h-4 w-4" />
                        Tasks
                    </Link>

                    {/* AI Assistants Section */}
                    <div className="mt-4 mb-2 px-2">
                        <span className="text-sm font-semibold text-muted-foreground">AI Assistants</span>
                    </div>

                    {/* Expandable menu item - AI Assistants */}
                    <li className="menu-item list-none">
                        <button
                            onClick={() => toggleExpand('aiAssistants')}
                            className={cn(
                                buttonVariants({ variant: "ghost" }),
                                "justify-between w-full"
                            )}
                            aria-expanded={expandedItems.aiAssistants}
                        >
                            <span className="flex items-center">
                                <Bot className="mr-2 h-4 w-4" />
                                AI Assistants
                            </span>
                            {expandedItems.aiAssistants ? (
                                <ChevronDown className="h-4 w-4" />
                            ) : (
                                <ChevronRight className="h-4 w-4" />
                            )}
                        </button>
                        <div inert={!expandedItems.aiAssistants || undefined}>
                            <div className="pl-6 py-1">
                                <ul className="space-y-1">
                                    <li>
                                        <Link
                                            href="/app/ai/personal"
                                            className={cn(
                                                buttonVariants({ variant: "ghost", size: "sm" }),
                                                "justify-start w-full"
                                            )}
                                        >
                                            Personal Assistant
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="#"
                                            className={cn(
                                                buttonVariants({ variant: "ghost", size: "sm" }),
                                                "justify-start w-full opacity-60"
                                            )}
                                            onClick={(e) => e.preventDefault()}
                                        >
                                            Research Assistant
                                            <Badge>Coming Soon</Badge>
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="#"
                                            className={cn(
                                                buttonVariants({ variant: "ghost", size: "sm" }),
                                                "justify-start w-full opacity-60"
                                            )}
                                            onClick={(e) => e.preventDefault()}
                                        >
                                            Legal Assistant
                                            <Badge>Coming Soon</Badge>
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="#"
                                            className={cn(
                                                buttonVariants({ variant: "ghost", size: "sm" }),
                                                "justify-start w-full opacity-60"
                                            )}
                                            onClick={(e) => e.preventDefault()}
                                        >
                                            Finance Assistant
                                            <Badge>Coming Soon</Badge>
                                        </Link>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </li>

                    {/* Expandable menu item - Reports */}
                    <li className="menu-item list-none">
                        <button
                            onClick={() => toggleExpand('reports')}
                            className={cn(
                                buttonVariants({ variant: "ghost" }),
                                "justify-between w-full"
                            )}
                            aria-expanded={expandedItems.reports}
                        >
                            <span className="flex items-center">
                                <BarChart3 className="mr-2 h-4 w-4" />
                                Reports
                            </span>
                            {expandedItems.reports ? (
                                <ChevronDown className="h-4 w-4" />
                            ) : (
                                <ChevronRight className="h-4 w-4" />
                            )}
                        </button>
                        <div inert={!expandedItems.reports || undefined}>
                            <div className="pl-6 py-1">
                                <ul className="space-y-1">
                                    <li>
                                        <Link
                                            href="#"
                                            className={cn(
                                                buttonVariants({ variant: "ghost", size: "sm" }),
                                                "justify-start w-full"
                                            )}
                                        >
                                            Weekly Summary
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="#"
                                            className={cn(
                                                buttonVariants({ variant: "ghost", size: "sm" }),
                                                "justify-start w-full"
                                            )}
                                        >
                                            Monthly Analytics
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="#"
                                            className={cn(
                                                buttonVariants({ variant: "ghost", size: "sm" }),
                                                "justify-start w-full"
                                            )}
                                        >
                                            Custom Reports
                                        </Link>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </li>

                    {/* Admin-only links */}
                    {isAdmin && (
                        <>
                            <div className="mt-4 mb-2 px-2">
                                <span className="text-sm font-semibold text-muted-foreground">Admin</span>
                            </div>

                            {/* Expandable menu item - Admin */}
                            <li className="menu-item list-none">
                                <button
                                    onClick={() => toggleExpand('admin')}
                                    className={cn(
                                        buttonVariants({ variant: "ghost" }),
                                        "justify-between w-full"
                                    )}
                                    aria-expanded={expandedItems.admin}
                                >
                                    <span className="flex items-center">
                                        <Users className="mr-2 h-4 w-4" />
                                        User Management
                                    </span>
                                    {expandedItems.admin ? (
                                        <ChevronDown className="h-4 w-4" />
                                    ) : (
                                        <ChevronRight className="h-4 w-4" />
                                    )}
                                </button>
                                <div inert={!expandedItems.admin || undefined}>
                                    <div className="pl-6 py-1">
                                        <ul className="space-y-1">
                                            <li>
                                                <Link
                                                    href="#"
                                                    className={cn(
                                                        buttonVariants({ variant: "ghost", size: "sm" }),
                                                        "justify-start w-full"
                                                    )}
                                                >
                                                    User List
                                                </Link>
                                            </li>
                                            <li>
                                                <Link
                                                    href="#"
                                                    className={cn(
                                                        buttonVariants({ variant: "ghost", size: "sm" }),
                                                        "justify-start w-full"
                                                    )}
                                                >
                                                    Roles & Permissions
                                                </Link>
                                            </li>
                                            <li>
                                                <Link
                                                    href="#"
                                                    className={cn(
                                                        buttonVariants({ variant: "ghost", size: "sm" }),
                                                        "justify-start w-full"
                                                    )}
                                                >
                                                    Invite Users
                                                </Link>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </li>

                            <Link
                                href="#"
                                className={cn(
                                    buttonVariants({ variant: "ghost" }),
                                    "justify-start"
                                )}
                            >
                                <Settings className="mr-2 h-4 w-4" />
                                System Settings
                            </Link>
                            <Link
                                href="#"
                                className={cn(
                                    buttonVariants({ variant: "ghost" }),
                                    "justify-start"
                                )}
                            >
                                <ActivitySquare className="mr-2 h-4 w-4" />
                                Activity Logs
                            </Link>
                        </>
                    )}
                </nav>
            </div>
        </Sidebar>
    );
}
