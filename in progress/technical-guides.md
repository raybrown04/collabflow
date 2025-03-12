# Technical Guides

{/* Updated to reflect current project state (sidebar, calendar, events list completed) - 3/4/2025 */}

This document consolidates technical guidelines for the CollabFlow project, covering styling, component development, and database integration.

## Table of Contents
- [RBIIILV Design System](#rbiiilv-design-system)
- [Next.js Component Development](#nextjs-component-development)
- [Supabase Integration](#supabase-integration)

---

## RBIIILV Design System

### Core Principles
1. **Professional Minimalism**: Clean lines, purposeful whitespace
2. **Functional Hierarchy**: Clear visual weight distribution
3. **Consistent Interaction Patterns**: Predictable component behaviors
4. **Accessibility First**: AA compliance minimum

### Color Schema
- Primary: `#0a0a0a` (Rich Black)
- Secondary: `#2f3c98` (Dynamic Blue)
- Background: `#ffffff` (Pure White)
- Surface: `#b6b8c1` (Grey)
- Error: `#dc2626` (Crimson)
- Success: `#16a34a` (Emerald)

### Typography
- Primary Font: Inter (System Stack)
- Code Font: JetBrains Mono
- Base Size: 16px
- Scale: 1.125 Major Third

### Layout Components

#### Sidebar System
```tsx
interface SidebarConfig {
  collapsedWidth: number;
  expandedWidth: number;
  breakpoint: 'md' | 'lg';
  persistentGroups: string[];
  collapsibleGroups: string[];
}
```

#### Task List
The task list uses a fixed height and displays tasks grouped by timeframe (Today, Tomorrow, etc.):

```tsx
// TaskList.tsx
<div
    ref={containerRef}
    className="h-[500px] overflow-y-auto" /* Fixed height instead of max-height */
    onScroll={handleScroll}
>
```

The task items now display the associated project or list instead of the due date:

```tsx
// TaskItem.tsx
<div className="flex items-center mt-2 text-xs text-foreground">
    <Tag className="h-3 w-3 mr-1" />
    <span className={cn(
        "font-medium",
        task.completed && "line-through"
    )}>
        {task.list_id && taskLists.find(list => list.id === task.list_id)
            ? taskLists.find(list => list.id === task.list_id)?.name
            : "Personal"}
    </span>
</div>
```

#### Expandable Menu Items
The sidebar uses CSS grid-based transitions for smooth expanding/collapsing menu items:

```css
/* Base styles for expandable content */
.menu-item > div {
  display: grid;
  grid-template-rows: 1fr;
  transition: grid-template-rows 0.3s;
  overflow: hidden;
}

/* Collapsed state */
.menu-item > div[inert] {
  grid-template-rows: 0fr;
}

/* Inner content container needs min-height: 0 to work properly */
.menu-item > div > div {
  min-height: 0;
}
```

### Animation & Transitions

#### Standard Durations
- Fast: 0.15s (150ms) - For small UI elements like buttons, toggles
- Medium: 0.3s (300ms) - For expanding/collapsing sections, modals
- Slow: 0.5s (500ms) - For page transitions, complex animations

#### Easing Functions
- Default: `ease` - General purpose
- Emphasis: `cubic-bezier(0.175, 0.885, 0.32, 1.275)` - For attention-grabbing animations
- Smooth: `cubic-bezier(0.4, 0.0, 0.2, 1)` - For natural-feeling transitions

---

## Next.js Component Development

### Form Field Accessibility
For better accessibility, ensure all form fields have proper `id` and `name` attributes that match their labels:

```typescript
// Before
<input
    type="text"
    value={title}
    onChange={(e) => setTitle(e.target.value)}
    className="w-full rounded-md border px-3 py-2"
    required
/>

// After
<input
    type="text"
    id="event-title"
    name="event-title"
    value={title}
    onChange={(e) => setTitle(e.target.value)}
    className="w-full rounded-md border px-3 py-2"
    required
/>
```

### Type Compatibility
When working with nullable fields, ensure proper type handling:

```typescript
// Error: Type 'string | null' is not assignable to type 'string | undefined'
const eventData = {
  title,
  description: description || null,
  location: location || null, // Error here
}

// Fix by using undefined instead of null
const eventData = {
  title,
  description: description || null, // This can stay null if the API expects it
  location: location || undefined, // Changed to undefined
}
```

---

## Supabase Integration

### Database Migration Guide
When applying migrations to your Supabase database:

1. **Local Development**:
   ```bash
   supabase migration new migration_name
   ```

2. **Edit the migration file** in `supabase/migrations/[timestamp]_migration_name.sql`

3. **Apply the migration locally**:
   ```bash
   supabase db reset
   ```

4. **Push to production**:
   ```bash
   supabase db push
   ```

5. **Verify the migration** in the Supabase dashboard

### Row Level Security (RLS) Policies
Always implement proper RLS policies for all tables:

```sql
-- Example RLS policies for a table
alter table your_table enable row level security;

-- User can only see their own data
create policy "Users can view their own data"
  on your_table for select
  using (auth.uid() = user_id);

-- User can only insert their own data
create policy "Users can insert their own data"
  on your_table for insert
  with check (auth.uid() = user_id);

-- Admin can see all data
create policy "Admins can view all data"
  on your_table for select
  using (auth.jwt() ? 'app_role' && auth.jwt()->>'app_role' = 'admin');
