import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const { email, password } = await request.json();

    const normalizedEmail = String(email || '').trim().toLowerCase();
    const validEmails = ['admin@fundi.rw', 'yvanahishakiye6@gmail.com'];

    if (validEmails.includes(normalizedEmail) && password === 'admin@123') {
        return NextResponse.json({
            require2FA: true,
            challengeToken: 'mock-challenge-token',
        });
    }

    return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 },
    );
}