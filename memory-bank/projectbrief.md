# Project Brief: Collaboration/Project Management Web App

## Project Name
CollabFlow (Placeholder - can be updated later)

## Project Overview
CollabFlow is a web application designed to streamline collaboration and project management for teams. Inspired by tools like Plane and Any.do, the platform will prioritize simplicity, ease of use, and robust functionality. The app will leverage Supabase as the backend for authentication, database management, and real-time features, alongside Next.js for a scalable and performant frontend.

## Core Features
1. **Task Management**: Create, assign, and track tasks with deadlines, priorities, and statuses.
2. **Collaboration Tools**: Enable team communication through comments and notifications.
3. **Project Boards**: Visualize tasks using Kanban-style boards or lists.
4. **User Authentication**: Secure login using Supabase Auth (email/password, OAuth).
5. **Real-Time Updates**: Reflect changes instantly across all users using Supabase's real-time capabilities.
6. **File Attachments**: Allow users to upload and attach files to tasks or projects.
7. **Search and Filters**: Quickly find tasks or projects using advanced search and filtering options.

## Target Audience
- Small to medium-sized teams looking for an intuitive project management tool.
- Freelancers managing multiple clients or projects.
- Organizations seeking a lightweight alternative to complex tools like Jira.

## Technical Stack
1. **Frontend**:
   - Framework: Next.js (leveraging SSR/ISR for performance)
   - Styling: Tailwind CSS
   - State Management: React Context API or Zustand (to keep it simple)
2. **Backend**:
   - Database: Supabase (PostgreSQL)
   - Authentication: Supabase Auth
   - Real-Time Features: Supabase Realtime
3. **Other Tools**:
   - MCP Servers:
     - `supabase-mcp` for database operations.
     - `perplexity-mcp` for documentation assistance.
     - `sequentialthinking` for structured problem-solving.
     - `firecrawl-mcp` for potential content extraction needs.

## Goals and Success Metrics
1. **MVP Delivery**: Deliver a Minimum Viable Product (MVP) with core features by June 2025.
2. **User Adoption**: Achieve at least 500 active users within the first three months of launch.
3. **Performance**: Ensure the app loads in under 2 seconds on average across all devices.
4. **Scalability**: Build a foundation that can scale to handle 10,000+ users without significant architectural changes.

## Key Constraints
1. Limited time to deliver MVP—focus on essential features first.
2. Emphasis on simplicity—avoid overengineering both code and UI/UX.
3. Use MCP server tools extensively to optimize development speed and efficiency.

## Known Risks
1. Potential complexity in integrating real-time features with Supabase.
2. Balancing simplicity with feature richness may require iterative refinement.
3. Ensuring cross-browser compatibility and responsive design across devices.

## Next Steps
1. Initialize the Memory Bank with all required files:
   - Fill out `productContext.md`, `activeContext.md`, `systemPatterns.md`, `techContext.md`, `progress.md`, and `mcpServers.md`.
2. Begin work on foundational components:
   - Set up Supabase backend (authentication, database schema).
   - Scaffold Next.js frontend structure with basic routing.
3. Define Row Level Security (RLS) policies in Supabase for secure data access.

## Notes
This project brief will evolve as the project progresses. Regular updates will be made to reflect changes in scope, goals, or priorities.

