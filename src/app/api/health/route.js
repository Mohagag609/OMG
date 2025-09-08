/**
 * API endpoint بسيط لاختبار الاتصال
 * Simple Health Check API Endpoint
 */

import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        success: true,
        message: 'API يعمل بشكل صحيح',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
}