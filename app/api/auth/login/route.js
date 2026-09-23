import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import clientPromise from "../../../../src/lib/mongodb";
import { sessionCookie } from "../../../../src/lib/auth";

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const client = await clientPromise;
    const user = await client.db("my-money").collection("users").findOne({ email: normalizedEmail });
    if (!user || !(await bcrypt.compare(String(password || ""), user.passwordHash))) return Response.json({ error: "Email or password is incorrect." }, { status: 401 });

    const response = NextResponse.json({ user: { name: user.name, email: user.email } });
    response.cookies.set(sessionCookie(user.userId));
    return response;
  } catch (error) {
    console.error("Login failed:", error);
    return Response.json({ error: "Unable to log in." }, { status: 500 });
  }
}