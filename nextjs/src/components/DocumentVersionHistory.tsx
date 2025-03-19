"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { History, Download, Clock } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface DocumentVersionHistoryProps {
  documentId: string;
}

interface Version {
  id: string;
  version_number: number;
  created_at: string;
  size: number | null;
  user_id: string;
}

export function DocumentVersionHistory({ documentId }: DocumentVersionHistoryProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [versions, setVersions] = useState<Version[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const fetchVersions = async () => {
    if (!isOpen) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/documents/versions?documentId=${documentId}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch document versions");
      }
      
      const data = await response.json();
      setVersions(data.versions || []);
    } catch (error) {
      console.error("Error fetching document versions:", error);
      toast({
        title: "Error",
        description: "Failed to fetch document versions",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const downloadVersion = async (versionId: string, versionNumber: number) => {
    try {
      window.open(`/api/documents/version?id=${versionId}`, "_blank");
    } catch (error) {
      console.error("Error downloading document version:", error);
      toast({
        title: "Error",
        description: "Failed to download document version",
        variant: "destructive",
      });
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (open) {
        fetchVersions();
      }
    }}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <History className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Version History</DialogTitle>
          <DialogDescription>
            View and download previous versions of this document
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : versions.length > 0 ? (
            <div className="space-y-2">
              {versions.map((version) => (
                <div 
                  key={version.id} 
                  className="flex items-center justify-between p-3 rounded-md border"
                >
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Version {version.version_number}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(version.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1"
                    onClick={() => downloadVersion(version.id, version.version_number)}
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <p>No previous versions found</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
