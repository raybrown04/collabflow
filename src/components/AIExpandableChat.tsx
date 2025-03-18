"use client";

/**
 * AIExpandableChat.tsx
 * Created: 3/4/2025
 * 
 * This component provides an expandable chat interface for the AI assistant.
 * It uses the ExpandableChat component and integrates with the useAIConversation hook
 * for message management.
 * 
 * Features:
 * - Expandable chat interface that can be toggled from the header
 * - Chat history with user and AI messages
 * - Suggested prompts for common queries
 * - Persistent conversation history using Supabase
 */

import { useState, useRef, useEffect } from "react";
import { Bot, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { format } from "date-fns";
import { useAIConversation, AIMessage } from "@/hooks/useAIMessages";
import {
    ExpandableChat,
    ExpandableChatHeader,
    ExpandableChatBody,
    ExpandableChatFooter,
} from "@/components/ui/expandable-chat";

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
        <div
            className={`flex ${message.is_user ? "justify-end" : "justify-start"}`}
        >
            <div
                className={`max-w-[80%] rounded-lg px-4 py-2 shadow-xs ${message.is_user
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                    }`}
            >
                <div className="flex flex-col">
                    <span className="text-sm whitespace-pre-wrap">{message.content}</span>
                    <span className={`text-xs mt-1 self-end ${message.is_user ? "text-primary-foreground/70" : "text-muted-foreground"
                        }`}>
                        {format(new Date(message.created_at), "h:mm a")}
                    </span>
                </div>
            </div>
        </div>
    );
}

interface AIExpandableChatProps {
    position?: "bottom-right" | "bottom-left" | "header";
    size?: "sm" | "md" | "lg" | "xl" | "full";
    title?: string;
    placeholder?: string;
    assistantType?: string;
    className?: string;
}

export function AIExpandableChat({
    position = "header",
    size = "md",
    title = "AI Assistant",
    placeholder = "Type your message...",
    assistantType = "personal",
    className
}: AIExpandableChatProps) {
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
        <ExpandableChat
            position={position}
            size={size}
            icon={<Bot className="h-5 w-5" />}
            className={className}
        >
            <ExpandableChatHeader>
                <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mr-2">
                        <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <h3 className="font-semibold text-sm">{title}</h3>
                </div>
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
            </ExpandableChatHeader>

            <ExpandableChatBody className="p-4 space-y-4">
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
                        <p>I'm your AI Assistant</p>
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
                        {isAddingMessage && (
                            <div className="flex justify-start">
                                <div className="max-w-[80%] rounded-lg px-4 py-2 bg-muted shadow-xs">
                                    <div className="flex space-x-2">
                                        <div className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce"></div>
                                        <div className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                                        <div className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </ExpandableChatBody>

            <ExpandableChatFooter>
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
                        className="flex-1"
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                if (input.trim()) {
                                    processMessage(input);
                                }
                            }
                        }}
                    />
                    <Button
                        type="submit"
                        size="icon"
                        disabled={isLoading || isAddingMessage || !input.trim()}
                    >
                        {(isLoading || isAddingMessage) ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                    </Button>
                </form>
            </ExpandableChatFooter>
        </ExpandableChat>
    );
}

export default AIExpandableChat;
