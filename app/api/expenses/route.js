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
    const { amount, spentFor, account, date, note } = body;

    if (!isValidAmount(amount) || !spentFor || !account || !date) {
      return Response.json({ error: "Amount, spent for, money type, and date are required." }, { status: 400 });
    }

    const expense = {
      amount: Decimal128.fromString(amount),
      spentFor: String(spentFor).trim(),
      account: String(account).trim(),
      date: String(date),
      note: String(note || "").trim(),
      type: "expense",
      userId: session.userId,
      createdAt: new Date(),
    };

    const client = await clientPromise;
    const result = await client.db("my-money").collection("expenses").insertOne(expense);

    return Response.json({ id: result.insertedId.toString(), message: "Expense saved." }, { status: 201 });
  } catch (error) {
    console.error("Expense insert failed:", error);
    return Response.json({ error: "Unable to save expense." }, { status: 500 });
  }
}