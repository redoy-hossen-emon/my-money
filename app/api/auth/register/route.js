import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import clientPromise from "../../../../src/lib/mongodb";
import { sessionCookie } from "../../../../src/lib/auth";

function getDatabaseError(error) {
  const message = String(error?.message || "");

  // Give the client a useful next step without exposing the MongoDB URI or credentials.
  if (message.includes("querySrv") || message.includes("ECONNREFUSED")) {
    return {
      error: "Database connection failed.",
      details: "The server could not resolve or reach MongoDB Atlas. Check the database connection, DNS, and network access settings.",
      code: "MONGODB_CONNECTION_ERROR",
    };
  }

  if (error?.code === 11000) {
    return {
      error: "An account with this email already exists.",
      code: "EMAIL_ALREADY_EXISTS",
    };
  }

  return {
    error: "Unable to create your account.",
    details: process.env.NODE_ENV === "development" ? message : "Please try again later.",
    code: "REGISTRATION_ERROR",
  };
}

export async function POST(request) {
  try {
    const { name, email, password } = await request.json();
    const normalizedEmail = String(email || "").trim().toLowerCase();
    if (!name?.trim() || !normalizedEmail || String(password || "").length < 6) return Response.json({ error: "Name, email, and a password of at least 6 characters are required." }, { status: 400 });

    const client = await clientPromise;
    const users = client.db("my-money").collection("users");
    if (await users.findOne({ email: normalizedEmail })) return Response.json({ error: "An account with this email already exists." }, { status: 409 });

    const userId = randomUUID();
    await users.insertOne({ userId, name: name.trim(), email: normalizedEmail, passwordHash: await bcrypt.hash(password, 12), createdAt: new Date() });
    const response = NextResponse.json({ user: { name: name.trim(), email: normalizedEmail } }, { status: 201 });
    response.cookies.set(sessionCookie(userId));
    return response;
  } catch (error) {
    console.error("Registration failed:", error);
    const databaseError = getDatabaseError(error);
    const status = databaseError.code === "MONGODB_CONNECTION_ERROR" ? 503 : 500;
    return Response.json(databaseError, { status });
  }
}