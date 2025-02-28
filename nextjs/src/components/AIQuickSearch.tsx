"use client"

import { useState, useRef, useEffect } from "react"
import { Search, X, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

// Interface for search results
export interface SearchResult {
    title: string
    content: string
    url?: string
    imageUrl?: string
}

// Mock search results for development mode
const mockSearchResults: SearchResult[] = [
    {
        title: "Introduction to Next.js",
        content: "Next.js is a React framework that enables server-side rendering, static site generation, and more. It provides a great developer experience with features like file-system routing, API routes, and built-in CSS support.",
        url: "https://nextjs.org/docs"
    },
    {
        title: "Supabase Authentication",
        content: "Supabase provides a complete authentication system with Row Level Security (RLS) policies. You can easily implement email/password, social logins, and multi-factor authentication.",
        url: "https://supabase.com/docs/guides/auth"
    },
    {
        title: "Tailwind CSS Fundamentals",
        content: "Tailwind CSS is a utility-first CSS framework that allows you to build custom designs without leaving your HTML. It provides low-level utility classes that let you build completely custom designs.",
        url: "https://tailwindcss.com/docs"
    }
]

// Development mode detection
const isDevelopment = typeof window !== 'undefined' && window.location.hostname === 'localhost'

/**
 * Mock function to search with Perplexity in development mode
 */
async function mockSearchWithPerplexity(query: string): Promise<SearchResult[]> {
    console.log("Development mode: Using mock search results for query:", query)

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500))

    return mockSearchResults
}

/**
 * Real function to search with Perplexity via MCP server
 */
async function searchWithPerplexity(query: string): Promise<SearchResult[]> {
    try {
        // This would use the MCP tool in production
        // For now we'll use the mock function in both cases

        if (isDevelopment) {
            return mockSearchWithPerplexity(query)
        }

        // In production, this would call the Perplexity API via MCP
        console.log("Searching with Perplexity:", query)

        // Placeholder for actual MCP call
        /* 
        const result = await window.mcp.perplexity.search({
          query: query,
          detail_level: "normal"
        })
        
        // Transform the result to our SearchResult format
        return result.results.map(item => ({
          title: item.title,
          content: item.content,
          url: item.url,
          imageUrl: item.imageUrl
        }))
        */

        // For now, return mock results
        return mockSearchWithPerplexity(query)
    } catch (error) {
        console.error("Error using Perplexity API:", error)
        throw error
    }
}

/**
 * Search result card component
 */
function SearchResultCard({ result }: { result: SearchResult }) {
    return (
        <Card className="overflow-hidden">
            <CardHeader className="p-4 pb-2">
                <CardTitle className="text-base font-semibold leading-tight">
                    {result.title}
                </CardTitle>
                {result.url && (
                    <CardDescription className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span className="truncate">{result.url}</span>
                    </CardDescription>
                )}
            </CardHeader>
            <CardContent className="p-4 pt-2">
                <p className="text-sm text-muted-foreground">
                    {result.content}
                </p>
            </CardContent>
            {result.url && (
                <CardFooter className="p-4 pt-0 flex justify-end">
                    <Button variant="ghost" size="sm" asChild>
                        <a href={result.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs">
                            <span>Open link</span>
                            <ExternalLink className="h-3 w-3" />
                        </a>
                    </Button>
                </CardFooter>
            )}
        </Card>
    )
}

interface AIQuickSearchProps {
    placeholder?: string
    expandable?: boolean
}

/**
 * AIQuickSearch component
 * A search widget that uses the Perplexity API to provide instant answers to user queries.
 * It expands when engaged and collapses when not in use to save space.
 */
export function AIQuickSearch({
    placeholder = "Ask anything...",
    expandable = true
}: AIQuickSearchProps) {
    const [expanded, setExpanded] = useState(false)
    const [query, setQuery] = useState("")
    const [results, setResults] = useState<SearchResult[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const searchRef = useRef<HTMLDivElement>(null)

    // Handle outside click to collapse
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setExpanded(false)
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [])

    // Handle search submission
    async function handleSearch(e: React.FormEvent) {
        e.preventDefault()

        if (!query.trim()) return

        setIsLoading(true)
        try {
            // Use Perplexity API to search
            const searchResults = await searchWithPerplexity(query)
            setResults(searchResults)
        } catch (error) {
            console.error("Search error:", error)
            setResults([{
                title: "Error",
                content: "An error occurred while searching. Please try again."
            }])
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div
            ref={searchRef}
            className={cn(
                "rounded-lg border bg-card transition-all duration-200",
                expanded ? "h-[400px]" : "h-16",
                expandable ? "cursor-pointer" : ""
            )}
            onClick={() => expandable && !expanded && setExpanded(true)}
        >
            <div className="p-4">
                <form onSubmit={handleSearch} className="flex items-center gap-2">
                    <Search className="h-5 w-5 text-foreground" />
                    <input
                        type="text"
                        placeholder={placeholder}
                        className="flex-1 bg-transparent outline-none text-foreground placeholder:text-foreground"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => expandable && setExpanded(true)}
                    />
                    {query && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation()
                                setQuery("")
                            }}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                    {query && (
                        <Button type="submit" size="sm" variant="ghost">
                            Search
                        </Button>
                    )}
                </form>
            </div>

            {expanded && (
                <div className="mt-2 h-[calc(100%-72px)] overflow-y-auto p-4 pt-0">
                    {isLoading ? (
                        <div className="flex h-full items-center justify-center">
                            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        </div>
                    ) : results.length > 0 ? (
                        <div className="space-y-4">
                            {results.map((result, index) => (
                                <SearchResultCard key={index} result={result} />
                            ))}
                        </div>
                    ) : (
                        <div className="flex h-full flex-col items-center justify-center text-center text-foreground">
                            <Search className="mb-2 h-10 w-10 text-foreground" />
                            <p className="text-foreground">Search for anything using natural language</p>
                            <p className="text-sm text-foreground">Examples: "Latest AI news", "JavaScript array methods", "Climate change data"</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default AIQuickSearch
