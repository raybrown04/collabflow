# Guide to Update Next.js Components for Role-Based Access Control

This guide provides instructions for updating your Next.js components to use the new role-based access control system.

## Overview

With the new role-based access control system, you can now show or hide features based on the user's role. The `useAuth` hook has been updated to include an `isAdmin` flag, and a new `isCurrentUserAdmin` function has been added to check if the current user is an admin.

## Completed Component Updates

The following components have already been updated to use the new role-based access control system:

1. **Sidebar Component** (`nextjs/src/components/sidebar-left.tsx`)
   - Added admin-only links that are only visible to admin users

2. **Events List Component** (`nextjs/src/components/events-list.tsx`)
   - Updated to show events from other users for admin users
   - Added visual indicators for events owned by other users
   - Disabled editing and deleting of events owned by other users

3. **Event Form Component** (`nextjs/src/components/EventForm.tsx`)
   - Updated to allow admins to create events for other users
   - Added a user dropdown for admins to select the user for whom to create the event

4. **Calendar Events Hook** (`nextjs/src/hooks/useCalendarEvents.ts`)
   - Updated to fetch all events for admin users
   - Regular users still only see their own events

## Using the Updated Auth Hooks

### 1. Using the `useAuth` Hook

The `useAuth` hook now includes an `isAdmin` flag that you can use to conditionally render admin-only features:

```tsx
import { useAuth } from '@/lib/auth';

function MyComponent() {
  const { user, loading, error, isAdmin } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!user) return <div>Please log in</div>;

  return (
    <div>
      <h1>Welcome, {user.email}</h1>
      
      {/* Show admin-only features */}
      {isAdmin && (
        <div className="admin-panel">
          <h2>Admin Panel</h2>
          {/* Admin-only content here */}
        </div>
      )}
      
      {/* Content for all users */}
      <div className="user-content">
        {/* User content here */}
      </div>
    </div>
  );
}
```

### 2. Using the `isCurrentUserAdmin` Function

For server components or when you need to check admin status outside of a component, you can use the `isCurrentUserAdmin` function:

```tsx
import { isCurrentUserAdmin } from '@/lib/auth';

async function AdminAction() {
  const isAdmin = await isCurrentUserAdmin();
  
  if (!isAdmin) {
    return <div>You do not have permission to access this feature.</div>;
  }
  
  // Admin-only code here
  return <div>Admin action performed</div>;
}
```

## Example: Sidebar Component

The sidebar component has been updated to show admin-only links:

```tsx
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Sidebar } from "@/components/ui/sidebar";
import { useAuth } from "@/lib/auth";

export function SidebarLeft() {
    const { user, isAdmin } = useAuth();

    return (
        <Sidebar>
            <div className="flex flex-col gap-4 p-4">
                <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold">Dashboard</span>
                </div>
                <nav className="grid gap-1">
                    <Link
                        href="#"
                        className={cn(
                            buttonVariants({ variant: "ghost" }),
                            "justify-start"
                        )}
                    >
                        Overview
                    </Link>
                    <Link
                        href="#"
                        className={cn(
                            buttonVariants({ variant: "ghost" }),
                            "justify-start"
                        )}
                    >
                        Projects
                    </Link>
                    <Link
                        href="#"
                        className={cn(
                            buttonVariants({ variant: "ghost" }),
                            "justify-start"
                        )}
                    >
                        Tasks
                    </Link>
                    <Link
                        href="#"
                        className={cn(
                            buttonVariants({ variant: "ghost" }),
                            "justify-start"
                        )}
                    >
                        Reports
                    </Link>

                    {/* Admin-only links */}
                    {isAdmin && (
                        <>
                            <div className="mt-4 mb-2 px-2">
                                <span className="text-sm font-semibold text-muted-foreground">Admin</span>
                            </div>
                            <Link
                                href="#"
                                className={cn(
                                    buttonVariants({ variant: "ghost" }),
                                    "justify-start"
                                )}
                            >
                                User Management
                            </Link>
                            <Link
                                href="#"
                                className={cn(
                                    buttonVariants({ variant: "ghost" }),
                                    "justify-start"
                                )}
                            >
                                System Settings
                            </Link>
                            <Link
                                href="#"
                                className={cn(
                                    buttonVariants({ variant: "ghost" }),
                                    "justify-start"
                                )}
                            >
                                Activity Logs
                            </Link>
                        </>
                    )}
                </nav>
            </div>
        </Sidebar>
    );
}
```

## Example: Protecting API Routes

For API routes, you can check if the user is an admin before allowing certain operations:

```tsx
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/lib/database.types';

export async function POST(request: NextRequest) {
  const cookieStore = cookies();
  
  // Create a Supabase client
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.delete({ name, ...options });
        },
      },
    }
  );
  
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Check if the user is an admin
  const { data, error } = await supabase
    .from('auth.users')
    .select('app_role')
    .eq('id', user.id)
    .single();
  
  if (error || data?.app_role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  // Admin-only code here
  // ...
  
  return NextResponse.json({ success: true });
}
```

## Example: Calendar Events Hook

The calendar events hook has been updated to fetch all events for admin users:

```typescript
async function fetchEventsForMonth(date: Date): Promise<CalendarEvent[]> {
    try {
        const start = startOfMonth(date)
        const end = endOfMonth(date)

        // Get the current user ID
        const userId = await getCurrentUserId()

        // Check if user is admin
        const isAdmin = await isCurrentUserAdmin()

        // Build query
        let query = supabase
            .from('calendar_events')
            .select('*')
            .gte('date', start.toISOString())
            .lte('date', end.toISOString())
            .order('date', { ascending: true })

        // If not admin, filter by user_id
        if (!isAdmin) {
            query = query.eq('user_id', userId)
        }

        const { data, error } = await query

        if (error) {
            console.error('Error fetching events:', error)
            throw new Error(`Failed to fetch events: ${error.message}`)
        }

        return data || []
    } catch (err) {
        console.error('Error in fetchEventsForMonth:', err)
        throw err
    }
}
```

## Example: Events List Component

The events list component has been updated to show visual indicators for events owned by other users:

```tsx
function EventCard({ event, onClick, isOwnedByCurrentUser }: EventCardProps) {
    const colors = typeColors[event.type]
    const eventDate = parseISO(event.date)

    return (
        <div
            className="relative rounded-lg border p-4 shadow-sm transition-all hover:shadow-md cursor-pointer"
            onClick={() => onClick(event)}
        >
            <div className="flex items-center gap-3">
                <div className={`h-4 w-4 rounded-full ${colors.dot}`} />
                <div className="flex-1">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                            <h4 className="font-medium">{event.title}</h4>
                            {!isOwnedByCurrentUser && (
                                <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                                    Other User
                                </span>
                            )}
                        </div>
                        <time className="text-sm text-muted-foreground">
                            {format(eventDate, "h:mm a")}
                        </time>
                    </div>
                    {event.description && (
                        <p className="mt-1 text-sm text-muted-foreground">
                            {event.description}
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}
```

## Example: Event Form Component

The event form component has been updated to allow admins to create events for other users:

```tsx
export function EventForm({ selectedDate, onEventAdded }: EventFormProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [type, setType] = useState<"meeting" | "task" | "reminder">("meeting")
    const [time, setTime] = useState("12:00")
    const [selectedUserId, setSelectedUserId] = useState<string>("")
    const [users, setUsers] = useState<{ id: string, email: string }[]>([])
    const [isAdmin, setIsAdmin] = useState(false)

    const { user } = useAuth()
    const createEvent = useCreateEvent()

    // Check if current user is admin
    useEffect(() => {
        const checkAdmin = async () => {
            const admin = await isCurrentUserAdmin()
            setIsAdmin(admin)

            // Set default selected user to current user
            const userId = await getCurrentUserId()
            setSelectedUserId(userId)

            // If admin, fetch users list
            if (admin) {
                try {
                    const { data, error } = await supabase
                        .from('profiles')
                        .select('id, email')

                    if (error) {
                        console.error("Error fetching users:", error)
                    } else if (data) {
                        setUsers(data)
                    }
                } catch (error) {
                    console.error("Error in fetchUsers:", error)
                }
            }
        }

        checkAdmin()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            // Create date with selected time
            const [hours, minutes] = time.split(":").map(Number)
            const eventDate = new Date(selectedDate)
            eventDate.setHours(hours, minutes, 0, 0)

            // Get the user ID for the event
            const userId = isAdmin && selectedUserId ? selectedUserId : await getCurrentUserId()

            // Create the event data
            const eventData = {
                title,
                description: description || null,
                date: eventDate.toISOString(),
                type,
                user_id: userId
            }

            // Call the create event mutation
            createEvent.mutate(eventData, {
                onSuccess: (newEvent) => {
                    console.log("Event created successfully:", newEvent)

                    // Reset form and close
                    setTitle("")
                    setDescription("")
                    setType("meeting")
                    setTime("12:00")
                    setIsOpen(false)

                    // Notify parent component with the new event
                    onEventAdded(newEvent)
                },
                onError: (error) => {
                    console.error("Error creating event:", error)
                    alert(`Failed to create event: ${error instanceof Error ? error.message : 'Unknown error'}`)
                }
            })
        } catch (error) {
            console.error("Error in event creation:", error)
            alert("An error occurred. Please try again.")
        }
    }

    // Form rendering code...
}
```

## Testing

After updating your components, you should test that:

1. Regular users can only see and access their own data
2. Admin users can see and access all data
3. Admin-only features are hidden from regular users
4. Admin users can access all features

## Conclusion

By following this guide, you can update your Next.js components to use the new role-based access control system. This will allow you to create a more secure and user-friendly application with different features for different user roles.
