import bcrypt from "bcryptjs";
import clientPromise from "../../../../src/lib/mongodb";
import { getRequestSession } from "../../../../src/lib/auth";

function unauthorized() {
  return Response.json({ error: "Please log in." }, { status: 401 });
}

export async function GET(request) {
  const session = getRequestSession(request);
  if (!session?.userId) return unauthorized();

  try {
    const client = await clientPromise;
    const user = await client.db("my-money").collection("users").findOne(
      { userId: session.userId },
      { projection: { _id: 0, name: 1, email: 1 } },
    );
    if (!user) return unauthorized();
    return Response.json({ user });
  } catch (error) {
    console.error("Profile lookup failed:", error);
    return Response.json({ error: "Unable to load your profile." }, { status: 500 });
  }
}

export async function PATCH(request) {
  const session = getRequestSession(request);
  if (!session?.userId) return unauthorized();

  try {
    const body = await request.json();
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const client = await clientPromise;
    const users = client.db("my-money").collection("users");
    const user = await users.findOne({ userId: session.userId });

    if (!user) return unauthorized();
    if (!name || !email) return Response.json({ error: "Name and email are required." }, { status: 400 });

    const existing = await users.findOne({ email, userId: { $ne: session.userId } });
    if (existing) return Response.json({ error: "That email is already in use." }, { status: 409 });

    const update = { name, email };
    const currentPassword = String(body.currentPassword || "");
    const newPassword = String(body.newPassword || "");
    if (newPassword) {
      if (newPassword.length < 6) return Response.json({ error: "New password must be at least 6 characters." }, { status: 400 });
      if (!currentPassword || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
        return Response.json({ error: "Current password is incorrect." }, { status: 401 });
      }
      update.passwordHash = await bcrypt.hash(newPassword, 12);
    }

    await users.updateOne({ userId: session.userId }, { $set: update });
    return Response.json({ user: { name, email } });
  } catch (error) {
    console.error("Profile update failed:", error);
    return Response.json({ error: "Unable to update your profile." }, { status: 500 });
  }
}