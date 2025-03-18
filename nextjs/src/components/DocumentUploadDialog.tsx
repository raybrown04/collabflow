"use client"

import { useState, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Loader2, File } from "lucide-react";
import { useProjects, Project } from "@/hooks/useProjects";
import { useDocuments } from "@/hooks/useDocuments";
import { useMcpMemory } from "@/hooks/useMcpMemory";

interface DocumentUploadDialogProps {
  projectId?: string;
  onSuccess?: () => void;
}

export function DocumentUploadDialog({ projectId, onSuccess }: DocumentUploadDialogProps) {
  const { toast } = useToast();
  const { projects = [] } = useProjects();
  const { fetchDocuments } = useDocuments();
  const { createEntities, createRelations } = useMcpMemory();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState(projectId || "");
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };
  
  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }
    
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      
      if (description) {
        formData.append("description", description);
      }
      
      if (selectedProjectId) {
        formData.append("projectId", selectedProjectId);
      }
      
      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload document");
      }
      
      const data = await response.json();
      
      // Update MCP memory graph
      try {
        await createEntities([
          {
            name: `Document: ${selectedFile.name}`,
            entityType: "Document",
            observations: [
              `Uploaded on ${new Date().toLocaleString()}`,
              `Size: ${Math.round(selectedFile.size / 1024)} KB`,
              `Type: ${selectedFile.type}`,
              selectedProjectId ? `Associated with project: ${selectedProjectId}` : "Not associated with any project",
              description ? `Description: ${description}` : "No description provided"
            ]
          }
        ]);
        
        // If project is selected, create relation
        if (selectedProjectId) {
          const project = projects.find((p: Project) => p.id === selectedProjectId);
          if (project) {
            await createRelations([
              {
                from: `Document: ${selectedFile.name}`,
                to: `Project: ${project.name}`,
                relationType: "belongs_to"
              }
            ]);
          }
        }
      } catch (err) {
        console.warn("Failed to update MCP memory graph:", err);
      }
      
      toast({
        title: "Upload successful",
        description: "Your document has been uploaded successfully",
      });
      
      // Reset form
      setSelectedFile(null);
      setDescription("");
      if (!projectId) {
        setSelectedProjectId("");
      }
      
      // Close dialog
      setIsOpen(false);
      
      // Refresh documents list
      fetchDocuments();
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (error) {
      console.error("Error uploading document:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload document",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  const resetForm = () => {
    setSelectedFile(null);
    setDescription("");
    if (!projectId) {
      setSelectedProjectId("");
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) {
        resetForm();
      }
    }}>
      <DialogTrigger asChild>
        <Button className="gap-1">
          <Upload className="h-4 w-4" />
          Upload Document
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Upload a document to your workspace or project
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* File upload */}
          <div className="space-y-2">
            <Label htmlFor="file">File</Label>
            <div className="grid w-full gap-2">
              <Input
                id="file"
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="cursor-pointer"
              />
              {selectedFile && (
                <div className="flex items-center gap-2 text-sm">
                  <File className="h-4 w-4" />
                  <span>{selectedFile.name}</span>
                  <span className="text-muted-foreground">
                    ({Math.round(selectedFile.size / 1024)} KB)
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Enter a description for this document"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          
          {/* Project selection (if not already in a project context) */}
          {!projectId && (
            <div className="space-y-2">
              <Label htmlFor="project">Project (optional)</Label>
              <Select
                value={selectedProjectId}
                onValueChange={setSelectedProjectId}
              >
                <SelectTrigger id="project">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No project</SelectItem>
                  {projects.map((project: Project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={!selectedFile || isUploading}>
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
