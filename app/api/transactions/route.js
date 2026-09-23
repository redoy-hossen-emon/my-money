import { Decimal128 } from "mongodb";
import clientPromise from "../../../src/lib/mongodb";
import { getRequestSession } from "../../../src/lib/auth";

function isValidAmount(value) {
  return typeof value === "string" && /^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value) && Number(value) > 0;
}

export async function POST(request) {
  try {
    const session = getRequestSession(request);
    if (!session?.userId) return Response.json({ error: "Please log in." }, { status: 401 });
    const body = await request.json();
    const { amount, source, account, date, note } = body;

    if (!isValidAmount(amount) || !source || !account || !date) {
      return Response.json({ error: "Amount, source, account, and date are required." }, { status: 400 });
    }

    const transaction = {
      amount: Decimal128.fromString(amount),
      source: String(source).trim(),
      account: String(account).trim(),
      date: String(date),
      note: String(note || "").trim(),
      type: "income",
      userId: session.userId,
      createdAt: new Date(),
    };

    const client = await clientPromise;
    const result = await client.db("my-money").collection("income").insertOne(transaction);

    return Response.json({ id: result.insertedId.toString(), message: "Transaction saved." }, { status: 201 });
  } catch (error) {
    console.error("Transaction insert failed:", error);
    return Response.json({ error: "Unable to save transaction." }, { status: 500 });
  }
}