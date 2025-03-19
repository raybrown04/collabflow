"use client"

import React from "react";
import Link from "next/link";
import { ChevronLeft, Settings, CalendarDays, Users, Folder } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Define the Project interface
interface Project {
  id: string;
  name: string;
  description: string | null;
  color: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface ProjectHeaderProps {
  project: Project;
}

export default function ProjectHeader({ project }: ProjectHeaderProps) {
  return (
    <div className="mb-6">
      {/* Breadcrumb navigation */}
      <Breadcrumb className="mb-2">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/app" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
                <ChevronLeft className="mr-1 h-4 w-4" />
                Dashboard
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/app/projects" className="text-sm text-muted-foreground hover:text-foreground">
                Projects
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink className="text-sm font-medium text-foreground cursor-default">
              {project.name}
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Project header with title and actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div className="flex items-center mb-4 md:mb-0">
          <div 
            className="w-8 h-8 rounded-md mr-3 flex-shrink-0" 
            style={{ backgroundColor: project.color }}
          />
          <div>
            <h1 className="text-2xl font-bold">{project.name}</h1>
            {project.description && (
              <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon">
                  <CalendarDays className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>View project calendar</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon">
                  <Users className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Manage team</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon">
                  <Folder className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Project documents</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Project settings</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Project stats/info */}
      <div className="flex mt-4 gap-4 text-sm">
        <div className="bg-card border rounded-md px-3 py-2">
          <div className="text-muted-foreground">Tasks</div>
          <div className="font-medium">4 active</div>
        </div>
        <div className="bg-card border rounded-md px-3 py-2">
          <div className="text-muted-foreground">Upcoming</div>
          <div className="font-medium">2 events</div>
        </div>
        <div className="bg-card border rounded-md px-3 py-2">
          <div className="text-muted-foreground">Created</div>
          <div className="font-medium">{new Date(project.created_at).toLocaleDateString()}</div>
        </div>
      </div>
    </div>
  );
}
