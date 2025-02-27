# MCP Integration Guide

This document outlines how to effectively use Model Context Protocol (MCP) servers in the CollabFlow project.

## Available MCP Servers

The project currently uses the following MCP servers:

1. **memory** - For persistent knowledge storage
2. **perplexity-mcp** - For AI-powered search and documentation
3. **supabase-mcp** - For database operations
4. **sequentialthinking** - For structured problem-solving
5. **firecrawl-mcp** - For web scraping and content extraction
6. **browser-tools** - For browser debugging and testing

## Integration Patterns

### Memory Graph

The memory graph is used to store persistent knowledge about the project:

```typescript
// Store information in memory graph
await use_mcp_tool({
  server_name: 'github.com/modelcontextprotocol/servers/tree/main/src/memory',
  tool_name: 'create_entities',
  arguments: {
    entities: [
      {
        name: "EntityName",
        entityType: "EntityType",
        observations: [
          "Observation 1",
          "Observation 2"
        ]
      }
    ]
  }
});

// Retrieve information from memory graph
const result = await use_mcp_tool({
  server_name: 'github.com/modelcontextprotocol/servers/tree/main/src/memory',
  tool_name: 'search_nodes',
  arguments: {
    query: "search term"
  }
});
```

### Perplexity Search

Use perplexity-mcp for AI-powered search and documentation:

```typescript
// Search for information
const searchResults = await use_mcp_tool({
  server_name: 'perplexity-mcp',
  tool_name: 'search',
  arguments: {
    query: "Next.js App Router best practices",
    detail_level: "normal"
  }
});

// Get documentation for a specific technology
const docs = await use_mcp_tool({
  server_name: 'perplexity-mcp',
  tool_name: 'get_documentation',
  arguments: {
    query: "Supabase Row Level Security",
    context: "React application"
  }
});
```

### Supabase Database Operations

Use supabase-mcp for database operations:

```typescript
// Query the database
const queryResult = await use_mcp_tool({
  server_name: 'supabase-mcp',
  tool_name: 'query',
  arguments: {
    sql: "SELECT * FROM calendar_events WHERE user_id = auth.uid()"
  }
});

// Fetch table information
const tables = await use_mcp_tool({
  server_name: 'supabase-mcp',
  tool_name: 'fetchTables',
  arguments: {
    includeColumns: true
  }
});
```

### Sequential Thinking

Use sequentialthinking for structured problem-solving:

```typescript
// Break down a complex problem
const analysis = await use_mcp_tool({
  server_name: 'sequentialthinking',
  tool_name: 'sequentialthinking',
  arguments: {
    thought: "Initial analysis of the problem...",
    nextThoughtNeeded: true,
    thoughtNumber: 1,
    totalThoughts: 5
  }
});
```

### Web Scraping

Use firecrawl-mcp for web scraping and content extraction:

```typescript
// Scrape a webpage
const scrapedContent = await use_mcp_tool({
  server_name: 'github.com/mendableai/firecrawl-mcp-server',
  tool_name: 'firecrawl_scrape',
  arguments: {
    url: "https://example.com",
    formats: ["markdown"],
    onlyMainContent: true
  }
});

// Search the web
const searchResults = await use_mcp_tool({
  server_name: 'github.com/mendableai/firecrawl-mcp-server',
  tool_name: 'firecrawl_search',
  arguments: {
    query: "Next.js App Router",
    limit: 5
  }
});
```

### Browser Tools

Use browser-tools for browser debugging and testing:

```typescript
// Check console logs
const consoleLogs = await use_mcp_tool({
  server_name: 'browser-tools',
  tool_name: 'getConsoleLogs',
  arguments: {}
});

// Take a screenshot
const screenshot = await use_mcp_tool({
  server_name: 'browser-tools',
  tool_name: 'takeScreenshot',
  arguments: {}
});
```

## Best Practices

### Error Handling

Always implement proper error handling when using MCP tools:

```typescript
try {
  const result = await use_mcp_tool({
    server_name: 'perplexity-mcp',
    tool_name: 'search',
    arguments: {
      query: "search query"
    }
  });
  
  // Process result
} catch (error) {
  console.error("MCP tool error:", error);
  
  // Fallback behavior
}
```

### Development Mode

Implement development mode support for MCP tools:

```typescript
// Development mode detection
const isDevelopment = typeof window !== 'undefined' && window.location.hostname === 'localhost';

async function searchWithPerplexity(query) {
  // In development mode, use mock data
  if (isDevelopment) {
    console.log("Development mode: Using mock search results");
    return mockSearchResults;
  }
  
  // In production, use MCP tool
  try {
    const result = await use_mcp_tool({
      server_name: 'perplexity-mcp',
      tool_name: 'search',
      arguments: {
        query
      }
    });
    
    return result;
  } catch (error) {
    console.error("Search error:", error);
    
    // Fallback to mock data in development mode
    if (isDevelopment) {
      console.warn("Falling back to mock search results");
      return mockSearchResults;
    }
    
    throw error;
  }
}
```

### Memory Graph Usage

Follow these guidelines for using the memory graph:

1. **Store Knowledge**: Use the memory graph to store knowledge that needs to be persistent across sessions.
2. **Retrieve Knowledge**: Before searching external sources, check if the information is already in the memory graph.
3. **Update Knowledge**: Keep the memory graph up-to-date by updating entities when new information is available.
4. **Organize Knowledge**: Use entity types and relations to organize knowledge in a structured way.

### Integration with React Components

Integrate MCP tools with React components using custom hooks:

```typescript
// Custom hook for Perplexity search
function usePerplexitySearch() {
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const search = useCallback(async (query) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await use_mcp_tool({
        server_name: 'perplexity-mcp',
        tool_name: 'search',
        arguments: {
          query
        }
      });
      
      setResults(result);
      return result;
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  return { search, results, isLoading, error };
}
