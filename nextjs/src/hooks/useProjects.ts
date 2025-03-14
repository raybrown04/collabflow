"use client"

import { useQuery } from "@tanstack/react-query";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/lib/database.types";

export interface Project {
  id: string;
  name: string;
  description: string | null;
  color: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// Mock projects for development mode
const mockProjects: Project[] = [
  { 
    id: 'proj-1', 
    name: 'Marketing Campaign', 
    color: '#3B82F6', 
    description: 'Q2 Product Launch',
    user_id: 'mock-user-id',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  { 
    id: 'proj-2', 
    name: 'Website Redesign', 
    color: '#10B981', 
    description: 'UX Improvements',
    user_id: 'mock-user-id',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  { 
    id: 'proj-3', 
    name: 'Mobile App', 
    color: '#F59E0B', 
    description: 'iOS and Android',
    user_id: 'mock-user-id',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  { 
    id: 'proj-4', 
    name: 'Annual Report', 
    color: '#EF4444', 
    description: 'Financial documents',
    user_id: 'mock-user-id',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export default function useProjects(archived = false) {
  const supabase = createClientComponentClient<Database>();
  
  return useQuery({
    queryKey: ['projects', { archived }],
    queryFn: async () => {
      // Use development mock data during dev/testing
      if (process.env.NODE_ENV === 'development') {
        console.log('Using mock projects data in development mode');
        await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API delay
        return mockProjects;
      }
      
      // In production, fetch real data from Supabase
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('archived', archived)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching projects:', error);
        throw error;
      }
      
      return data as Project[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
