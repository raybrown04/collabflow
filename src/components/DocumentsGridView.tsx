import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Folder, FileText, Star, Users, Upload } from "lucide-react";
import { DropboxFile, Document } from "@/types/document";
import { useToast } from "./ui/use-toast";
import { Skeleton } from "./ui/skeleton";

interface DocumentsGridViewProps {
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

export function DocumentsGridView({
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
  createFolder,
}: DocumentsGridViewProps) {
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
      <div className="col-span-3 py-12 text-center">
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Folders */}
      {dropboxFiles
        .filter(item => item[".tag"] === "folder")
        .map((folder, index) => (
          <Card 
            key={`folder-${index}`} 
            className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow" 
            onClick={() => navigateToFolder(folder)}
          >
            <CardHeader className="p-4 pb-2 bg-blue-50">
              <CardTitle className="text-base flex items-center">
                <Folder className="h-5 w-5 mr-2 text-blue-500" />
                {folder.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <p className="text-xs text-muted-foreground mt-2">Folder</p>
            </CardContent>
          </Card>
        ))}
      
      {/* Files */}
      {dropboxFiles
        .filter(item => item[".tag"] === "file")
        .filter(item => !showFavoritesOnly || favorites.has(item.id))
        .map((file, index) => (
          <Card key={`file-${index}`} className="overflow-hidden">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-base flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                {file.name}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={`h-6 w-6 ml-auto ${favorites.has(file.id) ? 'text-yellow-400' : 'text-muted-foreground hover:text-yellow-400'}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(file.id);
                  }}
                >
                  <Star className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 pb-2">
              <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>Only you</span>
                </div>
                <div>
                  {file.client_modified ? new Date(file.client_modified).toLocaleDateString() : '--'}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
      {/* Local Documents */}
      {documents
        .filter(doc => !showFavoritesOnly || favorites.has(doc.id))
        .filter(doc => !activeProjectFilter || doc.projects?.some(p => p.id === activeProjectFilter))
        .map((doc, index) => (
          <Card key={`doc-${index}`} className="overflow-hidden">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-base flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                {doc.name}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={`h-6 w-6 ml-auto ${favorites.has(doc.id) ? 'text-yellow-400' : 'text-muted-foreground hover:text-yellow-400'}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(doc.id);
                  }}
                >
                  <Star className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 pb-2">
              {doc.description && (
                <CardDescription className="mt-1">{doc.description}</CardDescription>
              )}
              
              <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>Only you</span>
                </div>
                <div>
                  {doc.updated_at ? new Date(doc.updated_at).toLocaleDateString() : '--'}
                </div>
              </div>
              
              {/* Project tags */}
              {doc.projects && doc.projects.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
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
            </CardContent>
          </Card>
        ))}
    </div>
  );
}
