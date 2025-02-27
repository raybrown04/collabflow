"use client";

/**
 * AIProjectAssistant component
 * 
 * A personal assistant that has access to all user data and can help with calendar, tasks, 
 * documents, and any project information. It provides a chat interface in the right sidebar.
 * 
 * Features:
 * - Chat interface with message history
 * - Suggested prompts for common queries
 * - Integration with user data (calendar, tasks, etc.)
 * - Persistent conversation history using Supabase
 * 
 * Changes:
 * - Connected to Supabase for message persistence using useAIConversation hook
 * - Added support for different assistant types
 * - Improved error handling and loading states
 */

import { useState, useRef, useEffect } from "react";
import { Bot, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { format } from "date-fns";
import { useAIConversation, AIMessage } from "@/hooks/useAIMessages";

// Suggested prompt component
function SuggestedPrompt({
    children,
    onClick,
    disabled = false
}: {
    children: React.ReactNode;
    onClick: () => void;
    disabled?: boolean;
}) {
    return (
        <Button
            variant="outline"
            size="sm"
            className="justify-start text-left text-sm"
            onClick={onClick}
            disabled={disabled}
        >
            {children}
        </Button>
    );
}

// Chat message component
function ChatMessageItem({ message }: { message: AIMessage }) {
    return (
        <div className={`flex ${message.is_user ? 'justify-end' : 'justify-start'}`}>
            <div
                className={`max-w-[80%] rounded-lg p-3 ${message.is_user
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                    }`}
            >
                <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                <div className={`mt-1 text-xs ${message.is_user ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                    {format(new Date(message.created_at), 'h:mm a')}
                </div>
            </div>
        </div>
    );
}

interface AIProjectAssistantProps {
    title?: string;
    placeholder?: string;
    assistantType?: string;
}

export function AIProjectAssistant({
    title = "AI Project Assistant",
    placeholder = "Type your message...",
    assistantType = "personal"
}: AIProjectAssistantProps) {
    const [input, setInput] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { user } = useAuth();

    // Use the AI conversation hook
    const {
        messages,
        isLoading,
        error,
        addUserMessage,
        addAIMessage,
        clearConversation,
        isAddingMessage
    } = useAIConversation(assistantType);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Process user input and get AI response
    async function processMessage(userMessage: string) {
        if (!userMessage.trim()) return;

        // Add user message to conversation
        await addUserMessage(userMessage);
        setInput("");

        try {
            // Process the message and generate a response
            // This would normally call an LLM API in production
            let aiResponse = "";

            // Generate a response based on the message content
            const lowerMessage = userMessage.toLowerCase();

            if (lowerMessage.includes('task') || lowerMessage.includes('todo')) {
                aiResponse = "You have several tasks on your list. The most urgent ones are:\n\n1. Complete project proposal (Due: Tomorrow)\n2. Review quarterly budget (Due: Thursday)\n3. Prepare client presentation (Due: Friday)";
            } else if (lowerMessage.includes('calendar') || lowerMessage.includes('event') || lowerMessage.includes('meeting')) {
                aiResponse = "You have 3 upcoming meetings this week:\n\n1. Team standup (Tomorrow, 9:00 AM)\n2. Client review (Thursday, 2:00 PM)\n3. Project planning (Friday, 11:00 AM)";
            } else if (lowerMessage.includes('email') || lowerMessage.includes('message')) {
                aiResponse = "You have 2 unread important emails:\n\n1. Client meeting confirmation from John Smith (Received: Today at 9:30 AM)\n2. Project timeline update request from Team Lead (Received: Yesterday at 4:45 PM)";
            } else if (lowerMessage.includes('project') || lowerMessage.includes('status')) {
                aiResponse = "Your current project is on track with 75% of tasks completed. The next milestone is due in 5 days. There are 3 open issues that need attention, and the team has scheduled a review meeting for tomorrow at 2:00 PM.";
            } else {
                aiResponse = `I'm here to help with your tasks, calendar, documents, and project information. What specific information would you like me to provide?`;
            }

            // Add AI response to conversation
            await addAIMessage(aiResponse);
        } catch (error) {
            console.error("Error processing message:", error);

            // Add error message to conversation
            await addAIMessage("I'm sorry, I encountered an error processing your request. Please try again.");
        }
    }

    return (
        <div className="flex h-full flex-col rounded-lg border">
            <div className="border-b p-3 flex justify-between items-center">
                <h3 className="font-semibold">{title}</h3>
                {messages.length > 0 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearConversation}
                        disabled={isAddingMessage}
                        title="Clear conversation"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                {error ? (
                    <div className="flex h-full flex-col items-center justify-center text-center text-red-500">
                        <p>Error loading messages: {error instanceof Error ? error.message : 'Unknown error'}</p>
                        <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => window.location.reload()}
                        >
                            Reload
                        </Button>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
                        <Bot className="mb-2 h-12 w-12" />
                        <p>I'm your AI Project Assistant</p>
                        <p className="mt-1 text-sm">Ask me about your tasks, calendar, documents, or anything else related to your projects.</p>
                        <div className="mt-4 grid gap-2">
                            <SuggestedPrompt
                                onClick={() => processMessage("What are my critical tasks due this week?")}
                                disabled={isAddingMessage}
                            >
                                What are my critical tasks due this week?
                            </SuggestedPrompt>
                            <SuggestedPrompt
                                onClick={() => processMessage("Are there any time sensitive emails I need to respond to?")}
                                disabled={isAddingMessage}
                            >
                                Are there any time sensitive emails I need to respond to?
                            </SuggestedPrompt>
                            <SuggestedPrompt
                                onClick={() => processMessage("Summarize my current project status")}
                                disabled={isAddingMessage}
                            >
                                Summarize my current project status
                            </SuggestedPrompt>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {messages.map(message => (
                            <ChatMessageItem key={message.id} message={message} />
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            <div className="border-t p-3">
                <form
                    onSubmit={e => {
                        e.preventDefault();
                        processMessage(input);
                    }}
                    className="flex items-center gap-2"
                >
                    <Input
                        placeholder={placeholder}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        disabled={isLoading || isAddingMessage}
                    />
                    <Button
                        type="submit"
                        size="icon"
                        disabled={isLoading || isAddingMessage || !input.trim()}
                    >
                        {isLoading || isAddingMessage ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                    </Button>
                </form>
            </div>
        </div>
    );
}

export default AIProjectAssistant;
