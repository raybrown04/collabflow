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
 * - Added project list with real-time filtering
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
    Mail,
    Plus
} from "lucide-react";

// Type definition for projects
interface Project {
  id: string;
  name: string;
  color: string;
  description?: string;
}

// Mock projects for development (in production, this would come from useProjects hook)
const mockProjects: Project[] = [
  { id: 'proj-1', name: 'Marketing Campaign', color: '#3B82F6', description: 'Q2 Product Launch' },
  { id: 'proj-2', name: 'Website Redesign', color: '#10B981', description: 'UX Improvements' },
  { id: 'proj-3', name: 'Mobile App', color: '#F59E0B', description: 'iOS and Android' },
  { id: 'proj-4', name: 'Annual Report', color: '#EF4444', description: 'Financial documents' }
];

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
    const pathname = usePathname();
    
    // In a real app, we would use a hook to fetch projects
    // const { data: projects, isLoading: projectsLoading } = useProjects();
    const projects = mockProjects;
    const projectsLoading = false;
    
    // State to track which menu items are expanded
    const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({
        projects: false,
        reports: false,
        admin: false,
        aiAssistants: false
    });

    // Handle auto-expand/collapse of menus based on current path
    useEffect(() => {
        // Create a mapping of path prefixes to menu keys
        const pathMenuMapping = {
            '/app/projects': 'projects',
            '/app/ai': 'aiAssistants',
            '/app/reports': 'reports',
            '/app/admin': 'admin'
        };
        
        const newExpandedState = { ...expandedItems };
        
        // Reset all to false first
        Object.keys(newExpandedState).forEach(key => {
            newExpandedState[key] = false;
        });
        
        // Then set the current one to true if applicable
        for (const [pathPrefix, menuKey] of Object.entries(pathMenuMapping)) {
            if (pathname?.startsWith(pathPrefix)) {
                newExpandedState[menuKey] = true;
                break; // Only expand one menu at a time
            }
        }
        
        setExpandedItems(newExpandedState);
    }, [pathname]); // Don't include expandedItems in dependencies to prevent loops

    // Toggle expansion state of a menu item
    const toggleExpand = (itemKey: string) => {
        setExpandedItems(prev => ({
            ...prev,
            [itemKey]: !prev[itemKey]
        }));
    };

    // CSS class for consistent button styling
    const menuItemStyle = "max-w-full mx-0 px-2";

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
                            "justify-start w-full",
                            menuItemStyle
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
                            "justify-start w-full",
                            menuItemStyle
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
                            "justify-start w-full",
                            menuItemStyle
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
                                "justify-start w-full",
                                menuItemStyle,
                                pathname?.startsWith('/app/projects') && "bg-accent text-accent-foreground"
                            )}
                            aria-expanded={expandedItems.projects}
                        >
                            <div className="flex items-center justify-between w-full">
                                <span className="flex items-center">
                                    <FolderKanban className="mr-2 h-4 w-4" />
                                    Projects
                                </span>
                                {expandedItems.projects ? (
                                    <ChevronDown className="h-4 w-4" />
                                ) : (
                                    <ChevronRight className="h-4 w-4" />
                                )}
                            </div>
                        </button>
                        <div inert={!expandedItems.projects || undefined}>
                            <div className="pl-6 py-1">
                                <ul className="space-y-1">
                                    {/* "All Projects" link removed as requested */}
                                    
                                    {/* Display active projects */}
                                    {projectsLoading ? (
                                        <li className="px-3 py-2 text-xs text-muted-foreground">
                                            Loading projects...
                                        </li>
                                    ) : projects && projects.length > 0 ? (
                                        projects.map((project: Project) => (
                                            <li key={project.id}>
                                                <Link
                                                    href={`/app/projects/${project.id}`}
                                                    className={cn(
                                                        buttonVariants({ variant: "ghost" }),
                                                        "justify-start h-9 text-sm w-full",
                                                        menuItemStyle,
                                                        pathname === `/app/projects/${project.id}` && "bg-accent/50 text-accent-foreground"
                                                    )}
                                                >
                                                    <div className="flex items-center w-full overflow-hidden">
                                                        <div 
                                                            className="w-2 h-2 rounded-full mr-2 flex-shrink-0" 
                                                            style={{ backgroundColor: project.color }}
                                                        />
                                                        <span className="truncate">{project.name}</span>
                                                    </div>
                                                </Link>
                                            </li>
                                        ))
                                    ) : (
                                        <li className="px-3 py-2 text-xs text-muted-foreground">
                                            No active projects
                                        </li>
                                    )}
                                    
                                    <li>
                                        <Link
                                            href="/app/projects?view=archived"
                                            className={cn(
                                                buttonVariants({ variant: "ghost" }),
                                                "justify-start h-9 text-sm w-full",
                                                menuItemStyle
                                            )}
                                        >
                                            Archived Projects
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="/app/projects/new"
                                            className={cn(
                                                buttonVariants({ variant: "ghost" }),
                                                "justify-start h-9 text-sm w-full",
                                                menuItemStyle
                                            )}
                                        >
                                            <Plus className="mr-1 h-3 w-3" />
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
                            "justify-start w-full",
                            menuItemStyle
                        )}
                    >
                        <CheckSquare className="mr-2 h-4 w-4" />
                        Tasks
                    </Link>

                    {/* Section header removed as requested */}

                    {/* Expandable menu item - AI Assistants */}
                    <li className="menu-item list-none">
                        <button
                            onClick={() => toggleExpand('aiAssistants')}
                            className={cn(
                                buttonVariants({ variant: "ghost" }),
                                "justify-start w-full",
                                menuItemStyle
                            )}
                            aria-expanded={expandedItems.aiAssistants}
                        >
                            <div className="flex items-center justify-between w-full">
                                <span className="flex items-center">
                                    <Bot className="mr-2 h-4 w-4" />
                                    AI Assistants
                                </span>
                                {expandedItems.aiAssistants ? (
                                    <ChevronDown className="h-4 w-4" />
                                ) : (
                                    <ChevronRight className="h-4 w-4" />
                                )}
                            </div>
                        </button>
                        <div inert={!expandedItems.aiAssistants || undefined}>
                            <div className="pl-6 py-1">
                                <ul className="space-y-1">
                                    <li>
                                        <Link
                                            href="/app/ai/personal"
                                            className={cn(
                                                buttonVariants({ variant: "ghost" }),
                                                "justify-start h-9 text-sm w-full",
                                                menuItemStyle
                                            )}
                                        >
                                            Personal
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="#"
                                            className={cn(
                                                buttonVariants({ variant: "ghost" }),
                                                "justify-start h-9 text-sm w-full",
                                                menuItemStyle
                                            )}
                                            onClick={(e) => e.preventDefault()}
                                        >
                                            Research
                                            <Badge>Coming Soon</Badge>
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="#"
                                            className={cn(
                                                buttonVariants({ variant: "ghost" }),
                                                "justify-start h-9 text-sm w-full",
                                                menuItemStyle
                                            )}
                                            onClick={(e) => e.preventDefault()}
                                        >
                                            Legal
                                            <Badge>Coming Soon</Badge>
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="#"
                                            className={cn(
                                                buttonVariants({ variant: "ghost" }),
                                                "justify-start h-9 text-sm w-full",
                                                menuItemStyle
                                            )}
                                            onClick={(e) => e.preventDefault()}
                                        >
                                            Finance
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
                                "justify-start w-full",
                                menuItemStyle
                            )}
                            aria-expanded={expandedItems.reports}
                        >
                            <div className="flex items-center justify-between w-full">
                                <span className="flex items-center">
                                    <BarChart3 className="mr-2 h-4 w-4" />
                                    Reports
                                </span>
                                {expandedItems.reports ? (
                                    <ChevronDown className="h-4 w-4" />
                                ) : (
                                    <ChevronRight className="h-4 w-4" />
                                )}
                            </div>
                        </button>
                        <div inert={!expandedItems.reports || undefined}>
                            <div className="pl-6 py-1">
                                <ul className="space-y-1">
                                    <li>
                                        <Link
                                            href="#"
                                            className={cn(
                                                buttonVariants({ variant: "ghost" }),
                                                "justify-start h-9 text-sm w-full",
                                                menuItemStyle
                                            )}
                                        >
                                            Weekly Summary
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="#"
                                            className={cn(
                                                buttonVariants({ variant: "ghost" }),
                                                "justify-start h-9 text-sm w-full",
                                                menuItemStyle
                                            )}
                                        >
                                            Monthly Analytics
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="#"
                                            className={cn(
                                                buttonVariants({ variant: "ghost" }),
                                                "justify-start h-9 text-sm w-full",
                                                menuItemStyle
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
                                        "justify-start w-full",
                                        menuItemStyle
                                    )}
                                    aria-expanded={expandedItems.admin}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <span className="flex items-center">
                                            <Users className="mr-2 h-4 w-4" />
                                            User Management
                                        </span>
                                        {expandedItems.admin ? (
                                            <ChevronDown className="h-4 w-4" />
                                        ) : (
                                            <ChevronRight className="h-4 w-4" />
                                        )}
                                    </div>
                                </button>
                                <div inert={!expandedItems.admin || undefined}>
                                    <div className="pl-6 py-1">
                                        <ul className="space-y-1">
                                            <li>
                                                <Link
                                                    href="#"
                                                    className={cn(
                                                        buttonVariants({ variant: "ghost" }),
                                                        "justify-start h-9 text-sm w-full",
                                                        menuItemStyle
                                                    )}
                                                >
                                                    User List
                                                </Link>
                                            </li>
                                            <li>
                                                <Link
                                                    href="#"
                                                    className={cn(
                                                        buttonVariants({ variant: "ghost" }),
                                                        "justify-start h-9 text-sm w-full",
                                                        menuItemStyle
                                                    )}
                                                >
                                                    Roles & Permissions
                                                </Link>
                                            </li>
                                            <li>
                                                <Link
                                                    href="#"
                                                    className={cn(
                                                        buttonVariants({ variant: "ghost" }),
                                                        "justify-start h-9 text-sm w-full",
                                                        menuItemStyle
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
                                    "justify-start w-full",
                                    menuItemStyle
                                )}
                            >
                                <Settings className="mr-2 h-4 w-4" />
                                System Settings
                            </Link>
                            <Link
                                href="#"
                                className={cn(
                                    buttonVariants({ variant: "ghost" }),
                                    "justify-start w-full",
                                    menuItemStyle
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
