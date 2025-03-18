"use client"

import { useState } from "react";
import { use_mcp_tool } from "@/lib/mcp";

interface Entity {
  name: string;
  entityType: string;
  observations: string[];
}

interface Relation {
  from: string;
  to: string;
  relationType: string;
}

interface Observation {
  entityName: string;
  contents: string[];
}

/**
 * Hook for interacting with the MCP memory graph
 * Provides functions for creating entities, relations, and observations
 */
export function useMcpMemory() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Create entities in the MCP memory graph
   * @param entities Array of entities to create
   */
  const createEntities = async (entities: Entity[]) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // First try to use the MCP memory server directly
      try {
        await use_mcp_tool("mcp-memory", "create_entities", {
          entities
        });
        return true;
      } catch (mcpError) {
        console.warn("Failed to use MCP memory server directly:", mcpError);
        // Fall back to API route
      }
      
      // Fall back to API route
      const response = await fetch("/api/mcp/memory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "create_entities",
          entities
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create entities");
      }
      
      return true;
    } catch (err) {
      console.error("Error creating entities:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Create relations in the MCP memory graph
   * @param relations Array of relations to create
   */
  const createRelations = async (relations: Relation[]) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // First try to use the MCP memory server directly
      try {
        await use_mcp_tool("mcp-memory", "create_relations", {
          relations
        });
        return true;
      } catch (mcpError) {
        console.warn("Failed to use MCP memory server directly:", mcpError);
        // Fall back to API route
      }
      
      // Fall back to API route
      const response = await fetch("/api/mcp/memory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "create_relations",
          relations
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create relations");
      }
      
      return true;
    } catch (err) {
      console.error("Error creating relations:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Add observations to entities in the MCP memory graph
   * @param observations Array of observations to add
   */
  const addObservations = async (observations: Observation[]) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // First try to use the MCP memory server directly
      try {
        await use_mcp_tool("mcp-memory", "add_observations", {
          observations
        });
        return true;
      } catch (mcpError) {
        console.warn("Failed to use MCP memory server directly:", mcpError);
        // Fall back to API route
      }
      
      // Fall back to API route
      const response = await fetch("/api/mcp/memory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "add_observations",
          observations
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add observations");
      }
      
      return true;
    } catch (err) {
      console.error("Error adding observations:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Delete entities from the MCP memory graph
   * @param entityNames Array of entity names to delete
   */
  const deleteEntities = async (entityNames: string[]) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // First try to use the MCP memory server directly
      try {
        await use_mcp_tool("mcp-memory", "delete_entities", {
          entityNames
        });
        return true;
      } catch (mcpError) {
        console.warn("Failed to use MCP memory server directly:", mcpError);
        // Fall back to API route
      }
      
      // Fall back to API route
      const response = await fetch("/api/mcp/memory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "delete_entities",
          entityNames
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete entities");
      }
      
      return true;
    } catch (err) {
      console.error("Error deleting entities:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createEntities,
    createRelations,
    addObservations,
    deleteEntities,
    isLoading,
    error
  };
}
