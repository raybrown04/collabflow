"use client"

import * as React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createSPASassClient } from "@/lib/supabase/client"
import SSOButtons from "@/components/SSOButtons"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogClose,
    DialogTrigger
} from "@/components/ui/dialog"

export function SignInDialog({ children, autoOpen = false }: { children?: React.ReactNode, autoOpen?: boolean }) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [showMFAPrompt, setShowMFAPrompt] = useState(false)
    const [open, setOpen] = React.useState(autoOpen)
    const router = useRouter()
    const id = React.useId()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const client = await createSPASassClient()
            const { error: signInError } = await client.loginEmail(email, password)

            if (signInError) throw signInError

            // Check if MFA is required
            const supabase = client.getSupabaseClient()
            const { data: mfaData, error: mfaError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()

            if (mfaError) throw mfaError

            if (mfaData.nextLevel === 'aal2' && mfaData.nextLevel !== mfaData.currentLevel) {
                setShowMFAPrompt(true)
                router.push('/auth/2fa')
            } else {
                router.push('/app')
                setOpen(false)
            }
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message)
            } else {
                setError('An unknown error occurred')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || (
                    <button className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50">
                        Sign In
                    </button>
                )}
            </DialogTrigger>
            <DialogContent>
                <div className="flex flex-col items-center gap-2">
                    <div
                        className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border shadow-sm transition-shadow"
                        aria-hidden="true"
                    >
                        <svg
                            className="stroke-zinc-800 dark:stroke-zinc-100"
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 32 32"
                            aria-hidden="true"
                        >
                            <circle cx="16" cy="16" r="12" fill="none" strokeWidth="8" />
                        </svg>
                    </div>
                    <DialogHeader>
                        <DialogTitle className="sm:text-center">Welcome back</DialogTitle>
                        <DialogDescription className="sm:text-center">
                            Enter your credentials to sign in to your account.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                {error && (
                    <div className="mb-4 p-4 text-sm text-red-700 bg-red-100 rounded-lg">
                        {error}
                    </div>
                )}

                <form className="space-y-5" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor={`${id}-email`} className="text-sm font-medium leading-none">
                                Email
                            </label>
                            <input
                                id={`${id}-email`}
                                placeholder="your@email.com"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="flex h-9 w-full rounded-md border border-input bg-background px-4 py-2 text-sm ring-offset-background transition-[border-color,box-shadow] file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor={`${id}-password`} className="text-sm font-medium leading-none">
                                Password
                            </label>
                            <input
                                id={`${id}-password`}
                                placeholder="Enter your password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="flex h-9 w-full rounded-md border border-input bg-background px-4 py-2 text-sm ring-offset-background transition-[border-color,box-shadow] file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Link className="text-sm text-primary underline-offset-4 transition-colors hover:underline" href="/auth/forgot-password">
                            Forgot password?
                        </Link>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex h-9 w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-xs transition-[background-color,box-shadow] hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                    >
                        {loading ? 'Signing in...' : 'Sign in'}
                    </button>
                </form>

                <div className="flex items-center gap-3 before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border">
                    <span className="text-xs text-muted-foreground">Or</span>
                </div>

                <SSOButtons onError={setError} />

                <p className="text-center text-xs text-muted-foreground">
                    Don't have an account?{" "}
                    <Link className="text-primary underline-offset-4 transition-colors hover:underline" href="/auth/register">
                        Sign up
                    </Link>
                </p>
            </DialogContent>
        </Dialog>
    )
}

export default SignInDialog
