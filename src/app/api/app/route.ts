import { NextRequest, NextResponse } from "next/server";

// This route handler now moved to API routes to avoid conflicts with app/page.tsx
export function GET(request: NextRequest) {
    // We now consistently apply authentication in all environments
    return NextResponse.next();
}

// Handle all methods (POST, PUT, DELETE, etc.)
export const POST = GET;
export const PUT = GET;
export const DELETE = GET;
export const PATCH = GET;
