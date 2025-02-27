"use client";

/**
 * useAIMessages hook
 * 
 * A React Query hook for fetching, creating, and managing AI message history from Supabase.
 * Supports different assistant types and handles authentication.
 * Provides development mode support with mock data.
 */

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth, supabase } from "@/lib/auth";

// AI Message interface
export interface AIMessage {
    id: string;
    content: string;
    is_user: boolean;
    assistant_type: string;
    created_at: string;
    user_id: string;
}

// Mock messages for development mode
const mockMessages: Record<string, AIMessage[]> = {
    personal: [
        {
            id: "dev-1",
            content: "Hello! I'm your AI Project Assistant. How can I help you today?",
            is_user: false,
            assistant_type: "personal",
            created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
            user_id: "dev-user"
        }
    ],
    research: [
        {
            id: "dev-2",
            content: "Hello! I'm your Research Assistant. I can help you find and analyze information.",
            is_user: false,
            assistant_type: "research",
            created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
            user_id: "dev-user"
        }
    ],
    legal: [
        {
            id: "dev-3",
            content: "Hello! I'm your Legal Assistant. I can help with legal documents and questions.",
            is_user: false,
            assistant_type: "legal",
            created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
            user_id: "dev-user"
        }
    ],
    finance: [
        {
            id: "dev-4",
            content: "Hello! I'm your Finance Assistant. I can help with financial analysis and planning.",
            is_user: false,
            assistant_type: "finance",
            created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
            user_id: "dev-user"
        }
    ]
};

// Development mode detection
const isDevelopment = typeof window !== 'undefined' && window.location.hostname === 'localhost';

/**
 * Fetch AI messages from Supabase
 */
async function fetchAIMessages(assistantType: string = 'personal', limit: number = 50): Promise<AIMessage[]> {
    if (isDevelopment) {
        console.log("Development mode: Using mock AI messages data");

        // Return mock messages for the specified assistant type
        return mockMessages[assistantType] || [];
    }

    // In production, fetch from Supabase
    const { data, error } = await supabase
        .from('ai_messages')
        .select('*')
        .eq('assistant_type', assistantType)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error("Error fetching AI messages:", error);
        throw error;
    }

    // Return messages in chronological order
    return (data as AIMessage[]).reverse();
}

/**
 * Create a new AI message in Supabase
 */
async function createAIMessage(message: Omit<AIMessage, 'id' | 'created_at' | 'user_id'>): Promise<AIMessage> {
    if (isDevelopment) {
        console.log("Development mode: Creating mock AI message", message);

        // Create a mock message
        const newMessage: AIMessage = {
            id: `dev-${Math.random().toString(36).substring(2, 9)}`,
            ...message,
            created_at: new Date().toISOString(),
            user_id: "dev-user"
        };

        // Add to mock messages
        if (!mockMessages[message.assistant_type]) {
            mockMessages[message.assistant_type] = [];
        }

        mockMessages[message.assistant_type].push(newMessage);

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 300));

        return newMessage;
    }

    // In production, create in Supabase
    const { data, error } = await supabase
        .from('ai_messages')
        .insert([message])
        .select()
        .single();

    if (error) {
        console.error("Error creating AI message:", error);
        throw error;
    }

    return data as AIMessage;
}

/**
 * Delete AI messages from Supabase
 */
async function deleteAIMessages(assistantType: string = 'personal'): Promise<void> {
    if (isDevelopment) {
        console.log("Development mode: Deleting mock AI messages for", assistantType);

        // Clear mock messages for the specified assistant type
        mockMessages[assistantType] = [];

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 300));

        return;
    }

    // In production, delete from Supabase
    const { error } = await supabase
        .from('ai_messages')
        .delete()
        .eq('assistant_type', assistantType);

    if (error) {
        console.error("Error deleting AI messages:", error);
        throw error;
    }
}

/**
 * Hook for fetching AI messages
 */
export function useAIMessages(assistantType: string = 'personal', limit: number = 50) {
    const { user } = useAuth();
    const [messages, setMessages] = useState<AIMessage[]>([]);

    // Fetch messages with React Query
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['ai_messages', assistantType, user?.id],
        queryFn: () => fetchAIMessages(assistantType, limit),
        enabled: isDevelopment || !!user,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    // Update messages when data changes
    useEffect(() => {
        if (data) {
            setMessages(data);
        }
    }, [data]);

    return {
        messages,
        isLoading,
        error,
        refetch
    };
}

/**
 * Hook for creating an AI message
 */
export function useCreateAIMessage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createAIMessage,
        onSuccess: (data) => {
            queryClient.invalidateQueries({
                queryKey: ['ai_messages', data.assistant_type]
            });
        }
    });
}

/**
 * Hook for clearing AI message history
 */
export function useClearAIMessages() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteAIMessages,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: ['ai_messages', variables]
            });
        }
    });
}

/**
 * Hook for managing a conversation with an AI assistant
 */
export function useAIConversation(assistantType: string = 'personal') {
    const { messages, isLoading, error, refetch } = useAIMessages(assistantType);
    const createMessage = useCreateAIMessage();
    const clearMessages = useClearAIMessages();

    // Add a user message to the conversation
    const addUserMessage = async (content: string) => {
        return createMessage.mutate({
            content,
            is_user: true,
            assistant_type: assistantType
        });
    };

    // Add an AI message to the conversation
    const addAIMessage = async (content: string) => {
        return createMessage.mutate({
            content,
            is_user: false,
            assistant_type: assistantType
        });
    };

    // Clear the conversation history
    const clearConversation = async () => {
        return clearMessages.mutate(assistantType);
    };

    return {
        messages,
        isLoading,
        error,
        addUserMessage,
        addAIMessage,
        clearConversation,
        isAddingMessage: createMessage.isPending,
        isClearing: clearMessages.isPending
    };
}

export default useAIMessages;
