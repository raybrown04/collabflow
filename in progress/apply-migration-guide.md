# Guide: Applying Development Mode Fixes to Other Projects

This guide explains how to apply the development mode fixes we implemented for the calendar events feature to other projects that use Supabase authentication.

## Problem

When developing locally, you may encounter issues with Supabase authentication, such as:

1. Cookie parsing errors: `Failed to parse cookie string: SyntaxError: Unexpected token 'b', "base64-eyJ"... is not valid JSON`
2. Authentication failures due to missing or invalid tokens
3. Difficulty testing features that require authentication

## Solution Overview

The solution involves creating a robust development mode that:

1. Detects when the application is running in development mode
2. Uses mock data instead of fetching from the API
3. Implements mock versions of API operations (create, update, delete)
4. Bypasses authentication requirements in development mode

## Step-by-Step Implementation

### 1. Detect Development Mode

Add a utility function or constant to detect when the application is running in development mode:

```typescript
// Check if we're in development mode
const isDevelopment = typeof window !== 'undefined' && window.location.hostname === 'localhost';
```

This approach is more reliable than using `process.env.NODE_ENV` because it works at runtime in the browser.

### 2. Create Mock Data

Define mock data that will be used in development mode:

```typescript
// Temporary test data for development mode
const today = new Date()
const testData = [
    {
        id: "dev-1", // Use a prefix to avoid conflicts with real IDs
        title: "Example Item 1",
        // ... other properties
        created_at: new Date().toISOString()
    },
    {
        id: "dev-2",
        title: "Example Item 2",
        // ... other properties
        created_at: new Date().toISOString()
    }
    // Add more test items as needed
]
```

### 3. Modify API Functions

Update your API functions to use mock data in development mode:

```typescript
async function fetchData(): Promise<DataType[]> {
    // In development mode, return test data
    if (isDevelopment) {
        console.log("Development mode: Using test data")
        return testData
    }

    try {
        // Real API call logic
        const { data, error } = await supabase
            .from('your_table')
            .select('*')
            // ... other query parameters
        
        if (error) throw error
        return data || []
    } catch (err) {
        console.error('Error fetching data:', err)

        // Fallback to test data in development mode if there's an error
        if (isDevelopment) {
            console.warn("Falling back to test data after error")
            return testData
        }
        
        throw err
    }
}
```

### 4. Implement Mock Create/Update/Delete Operations

```typescript
async function createItem(item: Omit<DataType, 'id' | 'created_at'>): Promise<DataType> {
    // In development mode, create a mock item
    if (isDevelopment) {
        console.log("Development mode: Creating mock item", item)
        const mockItem: DataType = {
            id: Math.random().toString(36).substring(2, 15),
            created_at: new Date().toISOString(),
            ...item
        }
        
        // Add to test data for display
        testData.push(mockItem)
        
        return mockItem
    }
    
    // Real API call logic
    // ...
}

async function updateItem(item: Partial<DataType> & { id: string }): Promise<DataType> {
    // In development mode, update a mock item
    if (isDevelopment) {
        console.log("Development mode: Updating mock item", item)

        // Find the item in test data
        const index = testData.findIndex(i => i.id === item.id)
        if (index !== -1) {
            // Update the item
            const updatedItem = { ...testData[index], ...item }
            testData[index] = updatedItem
            return updatedItem
        }
        
        throw new Error('Item not found')
    }
    
    // Real API call logic
    // ...
}

async function deleteItem(id: string): Promise<void> {
    // In development mode, delete a mock item
    if (isDevelopment) {
        console.log("Development mode: Deleting mock item", id)

        // Remove the item from test data
        const index = testData.findIndex(i => i.id === id)
        if (index !== -1) {
            testData.splice(index, 1)
            return
        }
        
        throw new Error('Item not found')
    }
    
    // Real API call logic
    // ...
}
```

### 5. Handle User Authentication

For components that need user information:

```typescript
// In your component
useEffect(() => {
    const checkUser = async () => {
        // In development mode, use a mock user
        if (isDevelopment) {
            setCurrentUser({
                id: "dev-user-id",
                email: "dev@example.com",
                // ... other user properties
            })
            return
        }
        
        // Real authentication logic
        // ...
    }
    
    checkUser()
}, [])
```

For components that need to select users (e.g., admin features):

```typescript
// In your component
useEffect(() => {
    const fetchUsers = async () => {
        // In development mode, use mock users
        if (isDevelopment) {
            setUsers([
                {
                    id: "dev-user-id-1",
                    email: "dev1@example.com"
                },
                {
                    id: "dev-user-id-2",
                    email: "dev2@example.com"
                }
            ])
            return
        }
        
        // Real user fetching logic
        // ...
    }
    
    fetchUsers()
}, [])
```

### 6. Update React Query Hooks (if applicable)

If you're using React Query, update your hooks to work with the development mode:

```typescript
export function useData() {
    return useQuery({
        queryKey: ['data'],
        queryFn: fetchData,
        // Other options...
    })
}

export function useCreateItem() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: createItem,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['data'] })
        },
        // Other options...
    })
}
```

## Testing Your Implementation

1. Run your application in development mode
2. Check the console for "Development mode" log messages
3. Verify that you can view, create, update, and delete items without authentication errors
4. Check that the application falls back to mock data if there are API errors

## Considerations

1. **Security**: This approach is for development only. Ensure your production code properly enforces authentication and authorization.
2. **Data Consistency**: Be aware that mock data will be reset when the page refreshes. Consider using localStorage if you need persistence across page reloads.
3. **Feature Parity**: Ensure your mock implementations match the behavior of the real API as closely as possible.
4. **Error Handling**: Continue to implement proper error handling even in development mode to catch issues early.

## Example: Converting an Existing Component

Here's an example of converting an existing component to support development mode:

### Before:

```typescript
function UserList() {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const { data, error } = await supabase.from('users').select('*')
                if (error) throw error
                setUsers(data || [])
            } catch (err) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }
        
        fetchUsers()
    }, [])
    
    // Render logic...
}
```

### After:

```typescript
// Mock data
const mockUsers = [
    { id: "dev-1", name: "John Doe", email: "john@example.com" },
    { id: "dev-2", name: "Jane Smith", email: "jane@example.com" }
]

// Development mode detection
const isDevelopment = typeof window !== 'undefined' && window.location.hostname === 'localhost'

function UserList() {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    
    useEffect(() => {
        const fetchUsers = async () => {
            // In development mode, use mock users
            if (isDevelopment) {
                console.log("Development mode: Using mock users")
                setUsers(mockUsers)
                setLoading(false)
                return
            }
            
            try {
                const { data, error } = await supabase.from('users').select('*')
                if (error) throw error
                setUsers(data || [])
            } catch (err) {
                setError(err.message)
                
                // Fallback to mock users in development mode
                if (isDevelopment) {
                    console.warn("Falling back to mock users after error")
                    setUsers(mockUsers)
                    setError(null) // Clear the error since we're using fallback data
                }
            } finally {
                setLoading(false)
            }
        }
        
        fetchUsers()
    }, [])
    
    // Render logic remains the same...
}
```

By following this pattern, you can make your application work seamlessly in development mode without requiring authentication or a connection to Supabase.
