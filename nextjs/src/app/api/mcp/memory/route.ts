import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Database } from "@/lib/database.types";

/**
 * API route for interacting with the MCP memory server
 * This route provides a proxy to the MCP memory server for client-side components
 */
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name) => cookieStore.get(name)?.value,
          set: (name, value, options) => {
            cookieStore.set(name, value, options);
          },
          remove: (name, options) => {
            cookieStore.set(name, '', { ...options, maxAge: 0 });
          }
        }
      }
    );
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Parse request body
    const body = await req.json();
    const { action, ...payload } = body;
    
    if (!action) {
      return NextResponse.json(
        { error: "Action is required" },
        { status: 400 }
      );
    }
    
    // Handle different actions
    switch (action) {
      case "create_entities": {
        const { entities } = payload;
        if (!entities || !Array.isArray(entities)) {
          return NextResponse.json(
            { error: "Entities array is required" },
            { status: 400 }
          );
        }
        
        // In a real implementation, this would call the MCP memory server
        // For now, we'll just log the entities and return success
        console.log("Creating entities:", entities);
        
        // Store in database for future retrieval
        for (const entity of entities) {
          const { name, entityType, observations } = entity;
          
          // Check if entity already exists
          const { data: existingEntity, error: queryError } = await supabase
            .from("mcp_entities")
            .select("id")
            .eq("name", name)
            .eq("entity_type", entityType)
            .single();
          
          if (queryError && queryError.code !== "PGSQL_ERROR_NO_ROWS") {
            console.error("Error checking for existing entity:", queryError);
            continue;
          }
          
          if (existingEntity) {
            // Update existing entity
            const { error: updateError } = await supabase
              .from("mcp_entities")
              .update({
                observations: observations,
                updated_at: new Date().toISOString()
              })
              .eq("id", existingEntity.id);
            
            if (updateError) {
              console.error("Error updating entity:", updateError);
            }
          } else {
            // Create new entity
            const { error: insertError } = await supabase
              .from("mcp_entities")
              .insert({
                name: name,
                entity_type: entityType,
                observations: observations,
                user_id: session.user.id
              });
            
            if (insertError) {
              console.error("Error creating entity:", insertError);
            }
          }
        }
        
        return NextResponse.json({ success: true });
      }
      
      case "create_relations": {
        const { relations } = payload;
        if (!relations || !Array.isArray(relations)) {
          return NextResponse.json(
            { error: "Relations array is required" },
            { status: 400 }
          );
        }
        
        // In a real implementation, this would call the MCP memory server
        // For now, we'll just log the relations and return success
        console.log("Creating relations:", relations);
        
        // Store in database for future retrieval
        for (const relation of relations) {
          const { from, to, relationType } = relation;
          
          // Check if relation already exists
          const { data: existingRelation, error: queryError } = await supabase
            .from("mcp_relations")
            .select("id")
            .eq("from_entity", from)
            .eq("to_entity", to)
            .eq("relation_type", relationType)
            .single();
          
          if (queryError && queryError.code !== "PGSQL_ERROR_NO_ROWS") {
            console.error("Error checking for existing relation:", queryError);
            continue;
          }
          
          if (existingRelation) {
            // Update existing relation
            const { error: updateError } = await supabase
              .from("mcp_relations")
              .update({
                updated_at: new Date().toISOString()
              })
              .eq("id", existingRelation.id);
            
            if (updateError) {
              console.error("Error updating relation:", updateError);
            }
          } else {
            // Create new relation
            const { error: insertError } = await supabase
              .from("mcp_relations")
              .insert({
                from_entity: from,
                to_entity: to,
                relation_type: relationType,
                user_id: session.user.id
              });
            
            if (insertError) {
              console.error("Error creating relation:", insertError);
            }
          }
        }
        
        return NextResponse.json({ success: true });
      }
      
      case "add_observations": {
        const { observations } = payload;
        if (!observations || !Array.isArray(observations)) {
          return NextResponse.json(
            { error: "Observations array is required" },
            { status: 400 }
          );
        }
        
        // In a real implementation, this would call the MCP memory server
        // For now, we'll just log the observations and return success
        console.log("Adding observations:", observations);
        
        // Store in database for future retrieval
        for (const observation of observations) {
          const { entityName, contents } = observation;
          
          // Get entity
          const { data: entity, error: queryError } = await supabase
            .from("mcp_entities")
            .select("id, observations")
            .eq("name", entityName)
            .single();
          
          if (queryError) {
            console.error("Error getting entity:", queryError);
            continue;
          }
          
          if (entity) {
            // Update entity with new observations
            const updatedObservations = [
              ...(entity.observations || []),
              ...contents
            ];
            
            const { error: updateError } = await supabase
              .from("mcp_entities")
              .update({
                observations: updatedObservations,
                updated_at: new Date().toISOString()
              })
              .eq("id", entity.id);
            
            if (updateError) {
              console.error("Error updating entity observations:", updateError);
            }
          }
        }
        
        return NextResponse.json({ success: true });
      }
      
      case "delete_entities": {
        const { entityNames } = payload;
        if (!entityNames || !Array.isArray(entityNames)) {
          return NextResponse.json(
            { error: "Entity names array is required" },
            { status: 400 }
          );
        }
        
        // In a real implementation, this would call the MCP memory server
        // For now, we'll just log the entity names and return success
        console.log("Deleting entities:", entityNames);
        
        // Delete from database
        for (const entityName of entityNames) {
          // Get entity
          const { data: entity, error: queryError } = await supabase
            .from("mcp_entities")
            .select("id")
            .eq("name", entityName)
            .single();
          
          if (queryError) {
            console.error("Error getting entity:", queryError);
            continue;
          }
          
          if (entity) {
            // Delete relations involving this entity
            const { error: deleteRelationsError } = await supabase
              .from("mcp_relations")
              .delete()
              .or(`from_entity.eq.${entityName},to_entity.eq.${entityName}`);
            
            if (deleteRelationsError) {
              console.error("Error deleting relations:", deleteRelationsError);
            }
            
            // Delete entity
            const { error: deleteError } = await supabase
              .from("mcp_entities")
              .delete()
              .eq("id", entity.id);
            
            if (deleteError) {
              console.error("Error deleting entity:", deleteError);
            }
          }
        }
        
        return NextResponse.json({ success: true });
      }
      
      default:
        return NextResponse.json(
          { error: `Unsupported action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error in MCP memory API route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
