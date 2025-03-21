# MCP Servers Documentation

*Last Updated: March 20, 2025*

CollabFlow leverages several Model Context Protocol (MCP) servers to enhance development workflow and provide additional functionality. This document describes the available MCP servers, their capabilities, and how to use them.

## Available MCP Servers

### 1. UI Style Guardian MCP Server

The UI Style Guardian MCP server ensures consistent styling across the application by validating components against established style guidelines and providing recommendations.

#### Tools

- **`validate_component`**: Validates a component's code against the style guidelines
  - Parameters:
    - `code` (required): The component code to validate
    - `componentName` (optional): The name of the component being validated
  - Returns: Validation results including issues, suggestions, and fixed code

- **`get_style_rules`**: Retrieves style rules for a specific component type
  - Parameters:
    - `componentType` (required): The type of component to get rules for (e.g., 'buttons', 'inputs')
  - Returns: Style rules and recommended CSS classes for the component type

#### Resources

- `style-guide://general`: Full UI style guide with color palette, typography, spacing, and component recommendations
- `style-guide://form-elements`: Styling guidelines for form elements
- `style-guide://component-patterns`: Recommended patterns for common UI components

#### Usage Examples

```typescript
// Validating a component
const validation = await useMcp('ui-style-guardian-mcp', 'validate_component', {
  code: componentCode,
  componentName: 'MyComponent'
});

if (!validation.passed) {
  console.log('Style issues found:', validation.suggestions);
  if (validation.fixedCode) {
    console.log('Suggested fixed code:', validation.fixedCode);
  }
}

// Getting style rules for buttons
const buttonRules = await useMcp('ui-style-guardian-mcp', 'get_style_rules', {
  componentType: 'buttons'
});
console.log('Primary button class:', buttonRules.rules.primary);
```

### 2. Perplexity MCP Server

Provides access to the Perplexity API for AI-powered search and documentation.

#### Tools

- `chat_perplexity`: Maintains ongoing conversations with Perplexity AI
- `search`: Performs general search queries to get information on any topic
- `get_documentation`: Gets documentation for a specific technology, library, or API
- `find_apis`: Finds and evaluates APIs that could be integrated into a project
- `check_deprecated_code`: Checks if code or dependencies might be using deprecated features

### 3. Firecrawl MCP Server

Provides web scraping and content extraction capabilities.

#### Tools

- `firecrawl_scrape`: Scrapes a single webpage with advanced options
- `firecrawl_map`: Discovers URLs from a starting point
- `firecrawl_crawl`: Starts an asynchronous crawl of multiple pages
- `firecrawl_batch_scrape`: Scrapes multiple URLs in batch mode
- `firecrawl_search`: Searches and retrieves content from web pages
- `firecrawl_extract`: Extracts structured information from web pages using LLM

### 4. Browser Tools MCP Server

Provides browser debugging and testing capabilities.

#### Tools

- `getConsoleLogs`: Checks browser logs
- `getConsoleErrors`: Checks browser console errors
- `getNetworkErrors`: Checks network ERROR logs
- `getNetworkLogs`: Checks ALL network logs
- `takeScreenshot`: Takes a screenshot of the current browser tab
- Various audit tools: `runAccessibilityAudit`, `runPerformanceAudit`, `runSEOAudit`, etc.

### 5. Memory MCP Server

Provides persistent knowledge storage capabilities.

#### Tools

- `create_entities`: Creates multiple new entities in the knowledge graph
- `create_relations`: Creates multiple new relations between entities
- `add_observations`: Adds new observations to existing entities
- `delete_entities`: Deletes multiple entities and their associated relations
- `delete_observations`: Deletes specific observations from entities
- `delete_relations`: Deletes multiple relations from the knowledge graph
- `read_graph`: Reads the entire knowledge graph
- `search_nodes`: Searches for nodes in the knowledge graph based on a query
- `open_nodes`: Opens specific nodes in the knowledge graph by their names

### 6. 21st Dev Magic MCP Server

Provides UI component generation capabilities.

#### Tools

- `21st_magic_component_builder`: Generates UI components based on user requests
- `logo_search`: Searches and returns logos in specified format
- `21st_magic_component_inspiration`: Fetches component inspiration from 21st.dev

### 7. Filesystem MCP Server

Provides filesystem access capabilities scoped to the project directory.

#### Tools

- `read_file`: Reads the contents of a file
- `write_to_file`: Creates a new file or overwrites an existing file
- `replace_in_file`: Replaces content in an existing file
- `list_files`: Lists files and directories
- `search_files`: Searches for files matching a pattern
- Various other filesystem operations

## Integration Examples

### Style Validation in CI/CD Pipeline

```javascript
// Example: Pre-commit hook for style validation
const validateComponent = async (filePath) => {
  const code = await fs.readFile(filePath, 'utf8');
  const componentName = path.basename(filePath, path.extname(filePath));
  
  const validation = await useMcp('ui-style-guardian-mcp', 'validate_component', {
    code,
    componentName
  });
  
  if (!validation.passed) {
    console.error(`Style issues found in ${filePath}:`);
    validation.suggestions.forEach(suggestion => console.error(`- ${suggestion}`));
    return false;
  }
  
  return true;
};
```

### AI-Powered Documentation Enhancement

```javascript
// Example: Enhancing documentation with AI insights
const enhanceDocumentation = async (docPath) => {
  const content = await fs.readFile(docPath, 'utf8');
  
  // Extract technical terms using Firecrawl
  const extraction = await useMcp('firecrawl-mcp-server', 'firecrawl_extract', {
    urls: [docPath],
    prompt: "Extract all technical terms and their definitions",
    schema: {
      type: "object",
      properties: {
        terms: {
          type: "array",
          items: {
            type: "object",
            properties: {
              term: { type: "string" },
              definition: { type: "string" }
            }
          }
        }
      }
    }
  });
  
  // Get expanded documentation for each term
  const enhancedTerms = await Promise.all(
    extraction.terms.map(async (term) => {
      const docs = await useMcp('perplexity-mcp', 'get_documentation', {
        query: term.term,
        context: "In the context of our project"
      });
      
      return {
        ...term,
        enhancedDefinition: docs.answer
      };
    })
  );
  
  // Store in memory graph for future reference
  await useMcp('mcp-memory', 'create_entities', {
    entities: enhancedTerms.map(term => ({
      name: term.term,
      entityType: "TechnicalTerm",
      observations: [term.enhancedDefinition]
    }))
  });
  
  return enhancedTerms;
};
```

## Best Practices

1. **Validate components early**: Use the UI Style Guardian before committing new components
2. **Leverage memory for context**: Store important project knowledge in the memory graph
3. **Use browser tools for debugging**: When encountering UI issues, use browser tools to diagnose
4. **Combine MCP servers for complex tasks**: Chain multiple MCP servers for sophisticated workflows
5. **Document MCP usage**: Keep this documentation updated with new MCP servers and usage patterns
