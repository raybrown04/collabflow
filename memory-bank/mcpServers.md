# MCP Servers Integration

## Overview
This document outlines the integration of Model Context Protocol (MCP) servers into the CollabFlow project. MCP servers provide additional tools and resources to enhance development efficiency and streamline various tasks.

## Available MCP Servers

### 1. supabase-mcp
- **Description**: Provides tools for interacting with the Supabase database, including schema management, data manipulation, and backup/restore operations.
- **Usage**:
    - Use `supabase-mcp` to create and manage database tables, define RLS policies, and perform data migrations.
    - Example: Use the `query` tool to execute SQL queries directly against the Supabase database.
    ```
    <use_mcp_tool>
      <server_name>supabase-mcp</server_name>
      <tool_name>query</tool_name>
      <arguments>
        {
          "sql": "SELECT * FROM tasks WHERE project_id = 'your-project-id'"
        }
      </arguments>
    </use_mcp_tool>
- **Tools**:
    - `query`: Execute SQL queries.
    - `fetchTables`: List all tables.
    - `createTable`: Create a new table.
    - `updateTable`: Alter an existing table.
    - `deleteTable`: Drop a table.
    - `fetchRecords`: Retrieve rows from a table.
    - `createRecord`: Insert a new record into a table.
    - `updateRecord`: Update records in a table.
    - `deleteRecord`: Delete records from a table.

### 2. perplexity-mcp
- **Description**: Provides AI-powered search, documentation assistance, and code analysis capabilities.
- **Usage**:
    - Use `perplexity-mcp` to quickly find documentation for specific technologies or APIs.
    - Example: Use the `get_documentation` tool to retrieve documentation for Next.js server components.
    ```
    <use_mcp_tool>
      <server_name>perplexity-mcp</server_name>
      <tool_name>get_documentation</tool_name>
      <arguments>
        {
          "query": "Next.js server components"
        }
      </arguments>
    </use_mcp_tool>
- **Tools**:
    - `chat_perplexity`: Maintains ongoing conversations with Perplexity AI.
    - `search`: Perform a general search query.
    - `get_documentation`: Get documentation for a specific technology.
    - `find_apis`: Find and evaluate APIs.
    - `check_deprecated_code`: Check if code uses deprecated features.

### 3. sequentialthinking
- **Description**: A tool for breaking down complex processes into logical sequential steps.
- **Usage**:
    - Use `sequentialthinking` to plan and execute complex tasks, such as implementing a new feature or debugging a difficult problem.
    - Example: Use the `sequentialthinking` tool to create a step-by-step plan for implementing user authentication.
    ```
    <use_mcp_tool>
      <server_name>sequentialthinking</server_name>
      <tool_name>sequentialthinking</tool_name>
      <arguments>
        {
          "thought": "Implement user authentication with Supabase Auth",
          "nextThoughtNeeded": true,
          "thoughtNumber": 1,
          "totalThoughts": 5
        }
      </arguments>
    </use_mcp_tool>
- **Tools**:
    - `sequentialthinking`: A detailed tool for dynamic and reflective problem-solving.

### 4. firecrawl-mcp
- **Description**: Provides tools for web scraping and content extraction.
- **Usage**:
    - Use `firecrawl-mcp` to extract data from websites, such as competitor pricing or product information.
    - Example: Use the `firecrawl_scrape` tool to extract the main content from a specific URL.
    ```
    <use_mcp_tool>
      <server_name>firecrawl-mcp</server_name>
      <tool_name>firecrawl_scrape</tool_name>
      <arguments>
        {
          "url": "https://example.com",
          "formats": ["markdown"]
        }
      </arguments>
    </use_mcp_tool>
- **Tools**:
    - `firecrawl_scrape`: Scrape a single webpage.
    - `firecrawl_map`: Discover URLs from a starting point.
    - `firecrawl_crawl`: Start an asynchronous crawl of multiple pages.
    - `firecrawl_batch_scrape`: Scrape multiple URLs in batch mode.
    - `firecrawl_check_batch_status`: Check the status of a batch scraping job.
    - `firecrawl_check_crawl_status`: Check the status of a crawl job.
    - `firecrawl_search`: Search and retrieve content from web pages.
    - `firecrawl_extract`: Extract structured information from web pages using LLM.

### 5. filesystem
- **Description**: Provides tools for interacting with the file system, including reading, writing, and listing files and directories.
- **Usage**:
    - Use `filesystem` to read and write files, list directory contents, and search for files.
    - **CRITICAL**: All filesystem MCP operations require absolute paths starting with `"C:\\\\Users\\\\rsb3\\\\CascadeProjects\\\\RBIIILV\\\\"`.
    - Example: Use the `read_file` tool to read the contents of a file.
    ```
    <use_mcp_tool>
      <server_name>filesystem</server_name>
      <tool_name>read_file</tool_name>
      <arguments>
        {
          "path": "C:\\Users\\rsb3\\CascadeProjects\\RBIIILV\\README.md"
        }
      </arguments>
    </use_mcp_tool>
- **Tools**:
    - `read_file`: Read the contents of a file.
    - `read_multiple_files`: Read the contents of multiple files.
    - `write_file`: Write content to a file.
    - `edit_file`: Edit a file.
    - `create_directory`: Create a directory.
    - `list_directory`: List the contents of a directory.
    - `directory_tree`: Get a tree view of a directory.
    - `move_file`: Move a file.
    - `search_files`: Search for files matching a pattern.
    - `get_file_info`: Get information about a file.
