# Development Guidelines

This document outlines the key development guidelines for the CollabFlow project, based on the .clinerules file.

## Table of Contents
- [General Guidelines](#general-guidelines)
- [Supabase Best Practices](#supabase-best-practices)
- [Next.js Best Practices](#nextjs-best-practices)
- [Security & Compliance](#security--compliance)
- [Performance & User Experience](#performance--user-experience)
- [Testing & Maintenance](#testing--maintenance)
- [MCP Server Tools Integration](#mcp-server-tools-integration)

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

## Supabase Best Practices

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

---

## Next.js Best Practices

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

## Security & Compliance

- **Access Control**
  - Enforce the principle of least privilege for user roles
  - Restrict database access appropriately

- **Communication Security**
  - Use HTTPS for all communications
  - Configure CORS properly

- **Session Management**
  - Implement HTTP-only cookies with secure and SameSite attributes
  - Regularly audit dependencies, credentials, and secrets

---

## Performance & User Experience

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

## Testing & Maintenance

- **Test Types**
  - Write unit tests for individual functions
  - Create integration tests for API endpoints
  - Implement E2E tests for critical user flows

- **Test Design**
  - Keep tests simple with clear purpose
  - Minimize test setup complexity

- **Error Handling Process**
  - For persistent test failures:
    1. Check memory graph for similar errors using `memory/retrieve`
    2. Use `sequentialthinking/analyze` to break down the problem
    3. Search for solutions with `perplexity/search`
    4. Store the resolution in memory graph using `memory/store`

- **Monitoring & Deployment**
  - Set up continuous monitoring with logging
  - Use CI/CD pipelines for automated testing and deployments

---

## MCP Server Tools Integration

- **Memory Graph Usage**
  - Store common error patterns and solutions
  - Save optimized code snippets and design patterns
  - Track successful test configurations

- **Tool Integration**
  - Use `perplexity/search` for researching coding problems
  - Use `sequentialthinking/analyze` for structured debugging
  - Use `supabase/query` for database interactions
  - Use `firecrawl/crawl` for external data gathering
  - Use `browser-tools/automate` for browser testing

- **Documentation**
  - Store documentation templates in memory graph
  - Use `memory/retrieve` to access existing templates
  - Keep documentation up-to-date with project changes
