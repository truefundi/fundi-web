import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const auth = request.headers.get('authorization');

  if (auth !== 'Bearer mock-access-token') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    id: '1',
    name: 'Yvan ahishakiye',
    email: 'yvanahishakiye6@gmail.com',
  });
}