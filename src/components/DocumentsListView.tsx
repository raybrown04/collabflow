import { Button } from "./ui/button";
import { Folder, FileText, Star, Users, Upload } from "lucide-react";
import { DropboxFile, Document } from "@/types/document";
import { useToast } from "./ui/use-toast";
import { Skeleton } from "./ui/skeleton";
import { Badge } from "./ui/badge";

interface DocumentsListViewProps {
  dropboxFiles: DropboxFile[];
  documents: Document[];
  favorites: Set<string>;
  isLoadingDropboxFiles: boolean;
  showFavoritesOnly: boolean;
  activeProjectFilter?: string;
  currentPath: string;
  navigateToFolder: (folder: DropboxFile) => void;
  toggleFavorite: (id: string) => void;
  uploadFile: (file: File, path: string) => Promise<void>;
  createFolder: (name: string, path: string) => Promise<void>;
}

export function DocumentsListView({
  dropboxFiles,
  documents,
  favorites,
  isLoadingDropboxFiles,
  showFavoritesOnly,
  activeProjectFilter,
  currentPath,
  navigateToFolder,
  toggleFavorite,
  uploadFile,
  createFolder
}: DocumentsListViewProps) {
  const { toast } = useToast();

  if (isLoadingDropboxFiles) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array(6).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-36 w-full" />
        ))}
      </div>
    );
  }

  // Render empty state if no content
  if (dropboxFiles.length === 0 && documents.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">No documents found in this location</p>
        <div className="mt-4">
          <Button onClick={() => {
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
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-2">
      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-gray-100 rounded-md text-sm font-medium">
        <div className="col-span-5">Name</div>
        <div className="col-span-2">Owner</div>
        <div className="col-span-2">Modified</div>
        <div className="col-span-2">Projects</div>
        <div className="col-span-1 text-right">Actions</div>
      </div>
      
      {/* Folders */}
      {dropboxFiles
        .filter(item => item[".tag"] === "folder")
        .map((folder, index) => (
          <div 
            key={`folder-${index}`}
            className="grid grid-cols-12 gap-4 px-4 py-3 border-b hover:bg-gray-50 cursor-pointer items-center"
            onClick={() => navigateToFolder(folder)}
          >
            <div className="col-span-5 flex items-center">
              <Folder className="h-5 w-5 mr-2 text-blue-500" />
              <span className="truncate">{folder.name}</span>
            </div>
            <div className="col-span-2 text-sm text-muted-foreground">Only you</div>
            <div className="col-span-2 text-sm text-muted-foreground">--</div>
            <div className="col-span-2"></div>
            <div className="col-span-1 flex justify-end"></div>
          </div>
        ))}
      
      {/* Files */}
      {dropboxFiles
        .filter(item => item[".tag"] === "file")
        .filter(item => !showFavoritesOnly || favorites.has(item.id))
        .map((file, index) => (
          <div 
            key={`file-${index}`}
            className="grid grid-cols-12 gap-4 px-4 py-3 border-b hover:bg-gray-50 items-center"
          >
            <div className="col-span-5 flex items-center">
              <FileText className="h-4 w-4 mr-2 text-gray-500" />
              <span className="truncate">{file.name}</span>
            </div>
            <div className="col-span-2 text-sm text-muted-foreground">Only you</div>
            <div className="col-span-2 text-sm text-muted-foreground">
              {file.client_modified ? new Date(file.client_modified).toLocaleDateString() : '--'}
            </div>
            <div className="col-span-2"></div>
            <div className="col-span-1 flex justify-end">
              <Button 
                variant="ghost" 
                size="icon" 
                className={`h-6 w-6 ${favorites.has(file.id) ? 'text-yellow-400' : 'text-muted-foreground hover:text-yellow-400'}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(file.id);
                }}
              >
                <Star className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        
      {/* Local Documents */}
      {documents
        .filter(doc => !showFavoritesOnly || favorites.has(doc.id))
        .filter(doc => !activeProjectFilter || doc.projects?.some(p => p.id === activeProjectFilter))
        .map((doc, index) => (
          <div 
            key={`doc-${index}`}
            className="grid grid-cols-12 gap-4 px-4 py-3 border-b hover:bg-gray-50 items-center"
          >
            <div className="col-span-5 flex items-center">
              <FileText className="h-4 w-4 mr-2 text-gray-500" />
              <div>
                <div className="truncate">{doc.name}</div>
                {doc.description && (
                  <div className="text-xs text-muted-foreground truncate">{doc.description}</div>
                )}
              </div>
            </div>
            <div className="col-span-2 text-sm text-muted-foreground">Only you</div>
            <div className="col-span-2 text-sm text-muted-foreground">
              {doc.updated_at ? new Date(doc.updated_at).toLocaleDateString() : '--'}
            </div>
            <div className="col-span-2">
              {doc.projects && doc.projects.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {doc.projects.map(project => (
                    <Badge 
                      key={project.id} 
                      className="text-xs" 
                      style={{ backgroundColor: project.color, color: 'white' }}
                    >
                      {project.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="col-span-1 flex justify-end">
              <Button 
                variant="ghost" 
                size="icon" 
                className={`h-6 w-6 ${favorites.has(doc.id) ? 'text-yellow-400' : 'text-muted-foreground hover:text-yellow-400'}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(doc.id);
                }}
              >
                <Star className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
    </div>
  );
}
