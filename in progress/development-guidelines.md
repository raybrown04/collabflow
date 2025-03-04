# Development Guidelines

This document provides detailed explanations of the development guidelines established in the .clinerules file.

## Table of Contents
- [General Guidelines](#general-guidelines)
- [Framework Best Practices](#framework-best-practices)
- [Quality Attributes](#quality-attributes)
- [Testing & Deployment](#testing--deployment)
- [Documentation & Diagrams](#documentation--diagrams)
- [Tooling & Automation](#tooling--automation)

---

## General Guidelines

- **Clean Coding Principles**
  - Write modular, DRY, and well-documented code
  - Break down into smaller components
  - Create a hooks directory for all custom hooks
  - Keep React components under 300 lines
  - Use a component approach for all designs

- **Git Workflow**
  - Use clear commit messages
  - Implement systematic branching
  - Follow multi-environment strategies (local → staging → production)

- **Documentation**
  - Add a comment at the top of new files with the changes made
  - Update comments when making changes to existing files
  - Document component props and functions

---

## Framework Best Practices

### Supabase

- **Authentication**
  - Utilize Supabase Auth for secure user authentication
  - Support email/password, OAuth, and MFA

- **Data Security**
  - Implement Row Level Security (RLS) on all tables
  - Restrict data access based on user roles

- **Schema Management**
  - Use migration tools for schema changes
  - Ensure consistency across environments

- **Performance**
  - Create proper indexes for frequently queried columns
  - Write efficient queries
  - Implement caching strategies where applicable

### Next.js

- **Routing & Rendering**
  - Use the Next.js App Router for all new pages
  - Implement server-side rendering (SSR) for critical pages
  - Follow Next.js routing and colocation guidelines

- **Performance Optimization**
  - Leverage dynamic imports and code splitting
  - Use next/dynamic for lazy-loaded components
  - Optimize images with the Next.js Image component

- **Authentication & Middleware**
  - Utilize middleware for app-wide authentication checks
  - Implement proper session management

---

## Quality Attributes

### Security & Compliance

- **Access Control**
  - Enforce the principle of least privilege for user roles
  - Restrict database access appropriately

- **Communication Security**
  - Use HTTPS for all communications
  - Configure CORS properly

- **Session Management**
  - Implement HTTP-only cookies with secure and SameSite attributes
  - Regularly audit dependencies, credentials, and secrets

### Performance & User Experience

- **Rendering Strategy**
  - Use SSR for fast initial loads
  - Implement static generation (SSG) or incremental static regeneration (ISR) when appropriate

- **Asset Optimization**
  - Implement lazy loading for components and images
  - Use code splitting to reduce bundle sizes

- **User Feedback**
  - Provide clear loading spinners
  - Implement toast notifications
  - Add error boundaries for graceful error handling

---

## Testing & Deployment

### Testing Approach

- **Test Types**
  - Write unit tests for individual functions
  - Create integration tests for API endpoints
  - Implement E2E tests for critical user flows

- **Test Design**
  - Keep tests simple with clear purpose
  - Minimize test setup complexity

- **Debugging Workflow**
  - For persistent test failures:
    1. Check memory graph for similar errors using `memory/retrieve`
    2. Use `sequentialthinking/analyze` to break down the problem
    3. Search for solutions with `perplexity/search`
    4. Store the resolution in memory graph for future reference

### Continuous Integration

- **Monitoring**
  - Set up continuous monitoring with logging and error tracking
  - Perform regular performance audits

- **Deployment**
  - Use CI/CD pipelines for automated testing and deployments
  - Maintain consistent environment variable management
  - Document deployment processes and rollback strategies

---

## Documentation & Diagrams

- **Mermaid Diagrams**
  - Use Mermaid syntax for system workflows and architecture diagrams
  - Store complex diagrams in the memory graph for easy retrieval
  - Keep diagrams simple and focused on key concepts

- **Code Documentation**
  - Write clear inline comments for complex logic
  - Add block comments to explain the purpose of functions/modules
  - Document props and return values for all components and functions

- **Maintenance**
  - Keep documentation up-to-date with code changes
  - Periodically review and refine documentation

---

## Tooling & Automation

### MCP Tool Integration

- **Memory Graph Usage**
  - Store common error patterns and solutions
  - Save optimized code snippets and design patterns
  - Track successful test configurations

- **Specialized Tools**
  - Use filesystem tools for configuration and log management
  - Use perplexity for research and documentation
  - Use sequentialthinking for structured debugging
  - Use supabase tools for database operations
  - Use browser-tools for testing and debugging

### UI Component Generation

- **21st.dev Integration**
  - Use 21st-dev-magic-mcp for rapid UI component development
  - Trigger component generation with "/ui", "/21", or "/21st" commands
  - Follow Tailwind and Radix UI patterns for consistency

- **Brand Integration**
  - Use logo_search for brand logo integration
  - Customize generated components to match the project's design system
  - Store frequently used component patterns in memory graph
