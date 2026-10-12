import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const { challengeToken } = await request.json().catch(() => ({ challengeToken: null }));

    if (challengeToken !== 'mock-challenge-token') {
        return NextResponse.json(
            { message: 'Session expired, please sign in again' },
            { status: 400 },
        );
    }

    return NextResponse.json(
        { message: 'Verification code resent successfully' },
        { status: 200 },
    );
}