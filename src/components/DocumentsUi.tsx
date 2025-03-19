"use client"

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDropboxAuth } from "@/hooks/useDropboxAuth";
import { useDocuments } from "@/hooks/useDocuments";
import { useGlobal } from "@/lib/context/GlobalContext";
import { useProjects } from "@/hooks/useProjects";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  FileText, 
  Folder, 
  ExternalLink, 
  DownloadCloud, 
  Upload, 
  RefreshCw, 
  Star, 
  Users, 
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Home
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger
} from "@/components/ui/dropdown-menu";
import { DocumentVersionHistory } from "@/components/DocumentVersionHistory";
import { DocumentsGridView } from "@/components/DocumentsGridView";
import { DocumentsListView } from "@/components/DocumentsListView";
import { DropboxFile, Document } from "@/types/document";

interface DocumentsUiProps {
  projectId?: string;
}

export function DocumentsUi({ projectId }: DocumentsUiProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  // State for UI management
  const [isConnecting, setIsConnecting] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [activeProjectFilter, setActiveProjectFilter] = useState<string | undefined>(projectId);
  const [searchTerm, setSearchTerm] = useState("");
  
  // State for folder navigation
  const [currentPath, setCurrentPath] = useState<string>("");
  const [pathHistory, setPathHistory] = useState<string[]>([]);
  
  // Favorites management
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  
  // Global context for authentication
  const { user, loading: isUserLoading } = useGlobal();
  
  // Load projects
  const { projects, isLoading: isProjectsLoading } = useProjects();
  
  // Dropbox Authentication
  const {
    isAuthenticated,
    isLoading: isAuthLoading,
    error: authError,
    getAuthUrl,
    handleCallback,
    disconnect,
    listFiles,
    uploadFile,
    createFolder,
  } = useDropboxAuth();
  
  // Documents
  const {
    documents,
    isLoading: isDocsLoading,
    error: docsError,
    fetchDocuments,
  } = useDocuments({ projectId: activeProjectFilter });
  
  // Combined loading state
  const isLoading = isUserLoading || isAuthLoading || isDocsLoading || isProjectsLoading;
  
  // State for Dropbox files
  const [dropboxFiles, setDropboxFiles] = useState<DropboxFile[]>([]);
  const [isLoadingDropboxFiles, setIsLoadingDropboxFiles] = useState(false);
  
  // Handle OAuth callback
  useEffect(() => {
    const code = searchParams?.get("code");
    const state = searchParams?.get("state");
    const error = searchParams?.get("error");
    
    if (error) {
      toast({
        title: "Authentication Error",
        description: error,
        variant: "destructive",
      });
      router.replace("/app/documents");
      return;
    }
    
    if (code && state) {
      setIsConnecting(true);
      
      try {
        setTimeout(() => {
          handleCallback(code, state)
            .then(() => {
              toast({
                title: "Connected to Dropbox",
                description: "Your Dropbox account has been successfully connected.",
              });
              router.replace("/app/documents");
            })
            .catch((err) => {
              console.error("Callback error:", err);
              toast({
                title: "Connection Error",
                description: err.message || "Failed to connect to Dropbox",
                variant: "destructive",
              });
              router.replace("/app/documents");
            })
            .finally(() => {
              setIsConnecting(false);
            });
        }, 500);
      } catch (err) {
        console.error("Callback execution error:", err);
        toast({
          title: "Connection Error",
          description: "An unexpected error occurred during authentication",
          variant: "destructive",
        });
        router.replace("/app/documents");
        setIsConnecting(false);
      }
    }
  }, [searchParams, handleCallback, toast, router]);
  
  // Handle Dropbox connection
  const connectDropbox = async () => {
    setIsConnecting(true);
    try {
      const authUrl = await getAuthUrl();
      if (authUrl) {
        window.location.href = authUrl;
      } else {
        toast({
          title: "Connection Error",
          description: "Failed to generate authentication URL",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error connecting to Dropbox:", error);
      toast({
        title: "Connection Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };
  
  // Handle Dropbox disconnection
  const disconnectDropbox = async () => {
    try {
      await disconnect();
      toast({
        title: "Disconnected from Dropbox",
        description: "Your Dropbox account has been successfully disconnected.",
      });
    } catch (error) {
      console.error("Error disconnecting from Dropbox:", error);
      toast({
        title: "Disconnection Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };
  
  // Fetch Dropbox files with path support
  const fetchDropboxFiles = useCallback(async (path: string = currentPath) => {
    if (!isAuthenticated) return;
    
    setIsLoadingDropboxFiles(true);
    try {
      const result = await listFiles(path);
      if (result && result.entries) {
        setDropboxFiles(result.entries);
      }
    } catch (error) {
      console.error("Error listing Dropbox files:", error);
      toast({
        title: "Error",
        description: "Failed to fetch Dropbox files",
        variant: "destructive",
      });
    } finally {
      setIsLoadingDropboxFiles(false);
    }
  }, [isAuthenticated, listFiles, toast, currentPath]);
  
  // Navigate to a folder
  const navigateToFolder = useCallback((folder: DropboxFile) => {
    // Store current path in history
    setPathHistory(prev => [...prev, currentPath]);
    
    // Update current path to the new folder path
    const newPath = folder.path_lower || `/${folder.name}`;
    setCurrentPath(newPath);
    
    // Fetch files for the new path
    fetchDropboxFiles(newPath);
  }, [currentPath, fetchDropboxFiles]);
  
  // Navigate to parent folder
  const navigateBack = useCallback(() => {
    if (pathHistory.length === 0) {
      // If no history, go to root
      setCurrentPath("");
      fetchDropboxFiles("");
      return;
    }
    
    // Get the last path from history
    const previousPath = pathHistory[pathHistory.length - 1];
    
    // Update current path
    setCurrentPath(previousPath);
    
    // Remove the last path from history
    setPathHistory(prev => prev.slice(0, prev.length - 1));
    
    // Fetch files for the previous path
    fetchDropboxFiles(previousPath);
  }, [pathHistory, fetchDropboxFiles]);
  
  // Go to root folder
  const navigateToRoot = useCallback(() => {
    setCurrentPath("");
    setPathHistory([]);
    fetchDropboxFiles("");
  }, [fetchDropboxFiles]);
  
  // Toggle favorite status for a document
  const toggleFavorite = useCallback((id: string) => {
    let wasAdded = false;
    
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(id)) {
        newFavorites.delete(id);
        wasAdded = false;
      } else {
        newFavorites.add(id);
        wasAdded = true;
      }
      return newFavorites;
    });
    
    // Use setTimeout to move the toast call outside of the render cycle
    setTimeout(() => {
      if (wasAdded) {
        toast({
          title: "Added to Favorites",
          description: "Document added to favorites",
        });
      } else {
        toast({
          title: "Removed from Favorites",
          description: "Document removed from favorites",
        });
      }
    }, 0);
  }, [toast]);
  
  // Fetch Dropbox files when authenticated or current path changes
  useEffect(() => {
    if (isAuthenticated && !isAuthLoading) {
      fetchDropboxFiles(currentPath);
    }
  }, [isAuthenticated, isAuthLoading, fetchDropboxFiles, currentPath]);
  
  // Handle errors
  if (authError || docsError) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-md">
        <h3 className="text-lg font-medium text-red-800 mb-2">Error</h3>
        <p className="text-red-700 mb-4">
          {authError?.message || docsError?.message || "An error occurred while loading documents"}
        </p>
        <Button 
          variant="outline" 
          onClick={() => {
            if (authError) window.location.reload();
            if (docsError) fetchDocuments();
          }}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }
  
  // Render loading state
  if (isAuthLoading || isDocsLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-36 w-full" />
          ))}
        </div>
      </div>
    );
  }
  
  // Render connection prompt
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Connect to Dropbox</CardTitle>
            <CardDescription>
              Connect your Dropbox account to sync and manage documents
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="py-6">
              <DownloadCloud className="mx-auto h-12 w-12 text-blue-500 mb-4" />
              <p className="text-muted-foreground mb-6">
                Sync your documents with Dropbox for easy access and collaboration
              </p>
              <Button
                variant="default"
                className="bg-blue-600 hover:bg-blue-700"
                onClick={connectDropbox}
                disabled={isConnecting}
              >
                {isConnecting ? "Connecting..." : "Connect to Dropbox"}
              </Button>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center text-xs text-muted-foreground">
            Your documents will be synced securely with your Dropbox account
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // Create breadcrumbs from current path
  const pathParts = currentPath ? currentPath.split('/').filter(Boolean) : [];
  
  return (
    <div className="space-y-6">
      {/* Header with search and controls */}
      <div className="flex flex-col space-y-4 mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold w-40">Documents</h2>
          
          {/* Search Bar */}
          <div className="relative flex-1 pl-32 pr-14 mx-48">
            <div className="relative">
              <input
                type="text"
                placeholder="Search"
                className="w-full pl-10 pr-4 py-2 border rounded-md text-black placeholder:text-muted-foreground"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          {/* Toolbar buttons */}
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="border rounded-md overflow-hidden flex">
              <Button 
                variant={viewMode === "grid" ? "default" : "ghost"} 
                size="sm" 
                onClick={() => setViewMode("grid")}
                className="rounded-none h-8 px-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" /><rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" /></svg>
              </Button>
              <Button 
                variant={viewMode === "list" ? "default" : "ghost"} 
                size="sm" 
                onClick={() => setViewMode("list")}
                className="rounded-none h-8 px-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" x2="21" y1="6" y2="6" /><line x1="8" x2="21" y1="12" y2="12" /><line x1="8" x2="21" y1="18" y2="18" /><line x1="3" x2="3.01" y1="6" y2="6" /><line x1="3" x2="3.01" y1="12" y2="12" /><line x1="3" x2="3.01" y1="18" y2="18" /></svg>
              </Button>
            </div>
            
            {/* Upload Button */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="gap-1">
                  <Upload className="h-4 w-4" />
                  Upload
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => {
                  const fileInput = document.createElement('input');
                  fileInput.type = 'file';
                  fileInput.onchange = async (e) => {
                    const target = e.target as HTMLInputElement;
                    if (target.files && target.files.length > 0) {
                      try {
                        await uploadFile(target.files[0], currentPath);
                        toast({
                          title: "File Uploaded",
                          description: `File "${target.files[0].name}" has been uploaded successfully`,
                        });
                        fetchDropboxFiles(currentPath);
                      } catch (error) {
                        console.error("Error uploading file:", error);
                        toast({
                          title: "Error",
                          description: "Failed to upload file",
                          variant: "destructive",
                        });
                      }
                    }
                  };
                  fileInput.click();
                }}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload File
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  const folderName = prompt("Enter folder name:");
                  if (folderName) {
                    createFolder(folderName, currentPath)
                      .then(() => {
                        toast({
                          title: "Folder Created",
                          description: `Folder "${folderName}" has been created successfully`,
                        });
                        fetchDropboxFiles(currentPath);
                      })
                      .catch(error => {
                        console.error("Error creating folder:", error);
                        toast({
                          title: "Error",
                          description: "Failed to create folder",
                          variant: "destructive",
                        });
                      });
                  }
                }}>
                  <Folder className="h-4 w-4 mr-2" />
                  Create Folder
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Three-dot Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                >
                  <svg width="4" height="16" viewBox="0 0 4 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto">
                    <path d="M2 4C3.1 4 4 3.1 4 2C4 0.9 3.1 0 2 0C0.9 0 0 0.9 0 2C0 3.1 0.9 4 2 4ZM2 6C0.9 6 0 6.9 0 8C0 9.1 0.9 10 2 10C3.1 10 4 9.1 4 8C4 6.9 3.1 6 2 6ZM2 12C0.9 12 0 12.9 0 14C0 15.1 0.9 16 2 16C3.1 16 4 15.1 4 14C4 12.9 3.1 12 2 12Z" fill="currentColor" />
                  </svg>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {/* Projects Filter */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Users className="h-4 w-4 mr-2" />
                    <span>{activeProjectFilter ? "Project Filter" : "Filter by Project"}</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem 
                      onClick={() => {
                        setActiveProjectFilter(undefined);
                        toast({
                          title: "All Documents",
                          description: "Showing all documents"
                        });
                      }}
                    >
                      <span className="ml-6">Show All</span>
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    
                    {projects.map(project => (
                      <DropdownMenuItem 
                        key={project.id}
                        onClick={() => {
                          setActiveProjectFilter(project.id);
                          toast({
                            title: "Project Filter",
                            description: `Filtering documents by ${project.name}`
                          });
                        }}
                      >
                        <div 
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: project.color }}
                        />
                        {project.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                
                {/* Favorites Filter */}
                <DropdownMenuItem
                  onClick={() => {
                    setShowFavoritesOnly(!showFavoritesOnly);
                    toast({
                      title: showFavoritesOnly ? "All Documents" : "Favorites",
                      description: showFavoritesOnly 
                        ? "Showing all documents" 
                        : "Showing starred documents only"
                    });
                  }}
                >
                  <Star className="h-4 w-4 mr-2" />
                  {showFavoritesOnly ? "Show All" : "Favorites Only"}
                </DropdownMenuItem>
                
                {/* Refresh Option */}
                <DropdownMenuItem 
                  onClick={() => fetchDropboxFiles(currentPath)} 
                  disabled={isLoadingDropboxFiles}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </DropdownMenuItem>
                
                {/* Disconnect Dropbox */}
                <DropdownMenuItem onClick={disconnectDropbox}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Disconnect Dropbox
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Path Navigation Bar (breadcrumbs + back button) */}
        {currentPath && (
          <div className="flex items-center gap-2 px-2 py-1 bg-gray-100 rounded-md">
            <Button 
              variant="ghost"
              size="sm"
              onClick={navigateBack}
              className="h-7 w-7 p-0 rounded-full"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={navigateToRoot}
              className="h-7 w-7 p-0 rounded-full"
            >
              <Home className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-1 overflow-x-auto">
              {pathParts.map((part, index) => (
                <div key={index} className="flex items-center">
                  {index > 0 && <ChevronRight className="h-3 w-3 mx-1 text-muted-foreground" />}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => {
                      // Navigate to a specific part of the path
                      const newPath = '/' + pathParts.slice(0, index + 1).join('/');
                      setCurrentPath(newPath);
                      setPathHistory(prev => [
                        ...prev.slice(0, prev.length - (pathParts.length - index - 1)),
                        currentPath
                      ]);
                      fetchDropboxFiles(newPath);
                    }}
                  >
                    {part}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Documents Display Section - now using extracted components */}
      {viewMode === "list" ? (
        <DocumentsListView
          dropboxFiles={dropboxFiles}
          documents={documents}
          favorites={favorites}
          isLoadingDropboxFiles={isLoadingDropboxFiles}
          showFavoritesOnly={showFavoritesOnly}
          activeProjectFilter={activeProjectFilter}
          currentPath={currentPath}
          navigateToFolder={navigateToFolder}
          toggleFavorite={toggleFavorite}
          uploadFile={uploadFile}
          createFolder={createFolder}
        />
      ) : (
        <DocumentsGridView
          dropboxFiles={dropboxFiles}
          documents={documents}
          favorites={favorites}
          isLoadingDropboxFiles={isLoadingDropboxFiles}
          showFavoritesOnly={showFavoritesOnly}
          activeProjectFilter={activeProjectFilter}
          currentPath={currentPath}
          navigateToFolder={navigateToFolder}
          toggleFavorite={toggleFavorite}
          uploadFile={uploadFile}
          createFolder={createFolder}
        />
      )}
    </div>
  );
}
