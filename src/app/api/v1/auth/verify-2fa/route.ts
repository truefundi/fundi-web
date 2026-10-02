import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { challengeToken, code } = await request.json();

  if (challengeToken !== "mock-challenge-token") {
    return NextResponse.json(
      { message: "Session expired, please sign in again" },
      { status: 400 },
    );
  }

  if (code !== "123456") {
    return NextResponse.json(
      { message: "Invalid verification code" },
      { status: 400 },
    );
  }

  return NextResponse.json({
    accessToken: "mock-access-token",
    user: {
      id: "1",
      name: "Yvan ahishakiye",
      email: "yvanahishakiye6@gmail.com",
    },
  });
}
