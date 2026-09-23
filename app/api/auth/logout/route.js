import { clearSessionCookie } from "../../../../src/lib/auth";

export async function POST() {
  const response = Response.json({ loggedOut: true });
  response.cookies.set(clearSessionCookie());
  return response;
}