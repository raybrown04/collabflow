"use client"

import { useState, useCallback, useEffect } from "react";
import { getSupabaseClient } from "@/lib/supabase/clientSingleton";
import { useGlobal } from "@/lib/context/GlobalContext";
import { Database } from "@/lib/database.types";
import { useQuery } from "@tanstack/react-query";

export type Document = Database["public"]["Tables"]["documents"]["Row"];
export type DocumentInsert = Database["public"]["Tables"]["documents"]["Insert"];
export type DocumentUpdate = Database["public"]["Tables"]["documents"]["Update"];

export type DocumentWithProjects = Document & {
  projects: {
    id: string;
    name: string;
    color: string;
  }[];
};

type UseDocumentsParams = {
  projectId?: string;
  searchQuery?: string;
};

export function useDocuments({ projectId, searchQuery }: UseDocumentsParams = {}) {
  const supabase = getSupabaseClient();
  const { user, loading: authLoading, refreshSession } = useGlobal();
  const [documents, setDocuments] = useState<DocumentWithProjects[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch documents
  const fetchDocuments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if user is authenticated - use user from context
      if (!user) {
        // Try to refresh the session first before failing
        const success = await refreshSession();
        
        // If still no user after refresh, throw error
        if (!success) {
          throw new Error("User not authenticated");
        }
      }

      let query;
      let documentsWithProjects: DocumentWithProjects[] = [];

      if (projectId) {
        // Fetch documents by project using the stored function
        const { data, error } = await supabase.rpc('get_documents_by_project', {
          project_id: projectId
        });

        if (error) {
          console.error("Error fetching documents by project:", error);
          throw new Error(`Failed to fetch documents: ${error.message}`);
        }
        
        if (!data) {
          setDocuments([]);
          return [];
        }

        try {
          // For each document, fetch its projects using a simpler approach
          documentsWithProjects = await Promise.all(
            data.map(async (document: Document) => {
              // Get document-project associations
              const { data: documentProjectsData, error: dpError } = await supabase
                .from('document_projects')
                .select('project_id')
                .eq('document_id', document.id);
              
              if (dpError) {
                console.warn(`Error fetching document-project associations for document ${document.id}:`, dpError);
                return { ...document, projects: [] };
              }
              
              if (!documentProjectsData || documentProjectsData.length === 0) {
                return { ...document, projects: [] };
              }
              
              // Get project details
              const projectIds = documentProjectsData.map(dp => dp.project_id);
              const { data: projectsData, error: projectsError } = await supabase
                .from('projects')
                .select('id, name, color')
                .in('id', projectIds);
              
              if (projectsError) {
                console.warn(`Error fetching projects for document ${document.id}:`, projectsError);
                return { ...document, projects: [] };
              }
              
              return {
                ...document,
                projects: projectsData || []
              };
            })
          );
        } catch (err) {
          console.error("Error processing document projects:", err);
          // Continue with partial data if possible
          documentsWithProjects = data.map((document: Document) => ({
            ...document,
            projects: []
          }));
        }

        setDocuments(documentsWithProjects);
      } else {
        // Fetch all user's documents using a simpler approach to avoid schema cache issues
        // First, get all documents
        query = supabase
          .from('documents')
          .select('*');

        if (searchQuery) {
          query = query.ilike('name', `%${searchQuery}%`);
        }

        const { data: documentsData, error: documentsError } = await query.order('updated_at', { ascending: false });

        if (documentsError) {
          console.error("Error fetching all documents:", documentsError);
          throw new Error(`Failed to fetch documents: ${documentsError.message}`);
        }
        
        if (!documentsData || documentsData.length === 0) {
          setDocuments([]);
          return [];
        }

        // Then, for each document, get its associated projects
        documentsWithProjects = await Promise.all(
          documentsData.map(async (document: Document) => {
            try {
              // Get document-project associations
              const { data: documentProjectsData, error: dpError } = await supabase
                .from('document_projects')
                .select('project_id')
                .eq('document_id', document.id);
              
              if (dpError) {
                console.warn(`Error fetching document-project associations for document ${document.id}:`, dpError);
                return { ...document, projects: [] };
              }
              
              if (!documentProjectsData || documentProjectsData.length === 0) {
                return { ...document, projects: [] };
              }
              
              // Get project details
              const projectIds = documentProjectsData.map(dp => dp.project_id);
              const { data: projectsData, error: projectsError } = await supabase
                .from('projects')
                .select('id, name, color')
                .in('id', projectIds);
              
              if (projectsError) {
                console.warn(`Error fetching projects for document ${document.id}:`, projectsError);
                return { ...document, projects: [] };
              }
              
              return {
                ...document,
                projects: projectsData || []
              };
            } catch (err) {
              console.warn(`Error processing projects for document ${document.id}:`, err);
              return { ...document, projects: [] };
            }
          })
        );

        setDocuments(documentsWithProjects);
      }

      // Return the documents for React Query
      return documentsWithProjects;
    } catch (err) {
      console.error('Error fetching documents:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      const error = new Error(`Error fetching documents: ${errorMessage}`);
      setError(error);
      setDocuments([]); // Set empty array on error
      throw error; // Throw the error for React Query to catch
    } finally {
      setIsLoading(false);
    }
  }, [supabase, projectId, searchQuery, user, refreshSession]);

  // Create a new document
  const createDocument = useCallback(
    async (document: DocumentInsert, projectIds?: string[]) => {
      try {
        // Insert the document
        const { data, error } = await supabase
          .from('documents')
          .insert(document)
          .select()
          .single();

        if (error) throw error;

        // If project IDs were provided, associate the document with the projects
        if (projectIds && projectIds.length > 0 && data) {
          const documentProjects = projectIds.map((projectId) => ({
            document_id: data.id,
            project_id: projectId,
            user_id: document.user_id,
          }));

          const { error: linkError } = await supabase
            .from('document_projects')
            .insert(documentProjects);

          if (linkError) throw linkError;
        }

        // Refresh the documents list
        fetchDocuments();

        return data;
      } catch (err) {
        console.error('Error creating document:', err);
        throw err;
      }
    },
    [supabase, fetchDocuments]
  );

  // Update an existing document
  const updateDocument = useCallback(
    async (id: string, updates: DocumentUpdate, projectIds?: string[]) => {
      try {
        // Update the document
        const { data, error } = await supabase
          .from('documents')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;

        // If project IDs were provided, update the document-project associations
        if (projectIds !== undefined && data) {
          // First, remove all existing associations
          const { error: deleteError } = await supabase
            .from('document_projects')
            .delete()
            .eq('document_id', id);

          if (deleteError) throw deleteError;

          // Then, create new associations
          if (projectIds.length > 0) {
            const documentProjects = projectIds.map((projectId) => ({
              document_id: id,
              project_id: projectId,
              user_id: data.user_id,
            }));

            const { error: linkError } = await supabase
              .from('document_projects')
              .insert(documentProjects);

            if (linkError) throw linkError;
          }
        }

        // Refresh the documents list
        fetchDocuments();

        return data;
      } catch (err) {
        console.error('Error updating document:', err);
        throw err;
      }
    },
    [supabase, fetchDocuments]
  );

  // Delete a document
  const deleteDocument = useCallback(
    async (id: string) => {
      try {
        // Delete the document
        const { error } = await supabase.from('documents').delete().eq('id', id);

        if (error) throw error;

        // Refresh the documents list
        fetchDocuments();
      } catch (err) {
        console.error('Error deleting document:', err);
        throw err;
      }
    },
    [supabase, fetchDocuments]
  );

  // Convert to React Query
  const query = useQuery({
    queryKey: ['documents', { projectId, searchQuery }],
    queryFn: fetchDocuments,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Still call fetchDocuments on mount but now React Query will manage it
  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  return {
    documents,
    isLoading: query.isLoading || isLoading || authLoading,
    error: query.error || error,
    fetchDocuments,
    createDocument,
    updateDocument,
    deleteDocument,
  };
}
