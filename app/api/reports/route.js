import { Decimal128, ObjectId } from "mongodb";
import clientPromise from "../../../src/lib/mongodb";
import { getRequestSession } from "../../../src/lib/auth";

function serializeTransaction(transaction) {
  return {
    id: transaction._id.toString(),
    amount: Number(transaction.amount.toString()),
    type: transaction.type === "expense" ? "expense" : "income",
    date: String(transaction.date),
    source: transaction.source || "",
    spentFor: transaction.spentFor || "",
    account: transaction.account || "account",
    note: transaction.note || "",
  };
}

export async function GET(request) {
  try {
    const session = getRequestSession(request);
    if (!session?.userId) return Response.json({ error: "Please log in." }, { status: 401 });
    const client = await clientPromise;
    const [income, expenses] = await Promise.all([
      client.db("my-money").collection("income").find({ userId: session.userId }).toArray(),
      client.db("my-money").collection("expenses").find({ userId: session.userId }).toArray(),
    ]);
    const transactions = [...income, ...expenses].sort((first, second) => String(second.date).localeCompare(String(first.date)) || new Date(second.createdAt) - new Date(first.createdAt));

    return Response.json({ transactions: transactions.map(serializeTransaction) });
  } catch (error) {
    console.error("Reports query failed:", error);
    return Response.json({ error: "Unable to load reports." }, { status: 500 });
  }
}

function isValidAmount(value) {
  return typeof value === "string" && /^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value) && Number(value) > 0;
}

export async function PATCH(request) {
  try {
    const session = getRequestSession(request);
    if (!session?.userId) return Response.json({ error: "Please log in." }, { status: 401 });

    const { id, type, amount, date, account, note, source, spentFor } = await request.json();
    if (!ObjectId.isValid(id) || !["income", "expense"].includes(type) || !isValidAmount(amount) || !date || !account) {
      return Response.json({ error: "Invalid transaction details." }, { status: 400 });
    }

    const collection = type === "income" ? "income" : "expenses";
    const label = type === "income" ? String(source || "").trim() : String(spentFor || "").trim();
    if (!label) return Response.json({ error: "A description is required." }, { status: 400 });

    const client = await clientPromise;
    const result = await client.db("my-money").collection(collection).updateOne(
      { _id: new ObjectId(id), userId: session.userId },
      {
        $set: {
          amount: Decimal128.fromString(amount),
          date: String(date),
          account: String(account),
          note: String(note || "").trim(),
          ...(type === "income" ? { source: label } : { spentFor: label }),
          updatedAt: new Date(),
        },
      },
    );

    if (!result.matchedCount) return Response.json({ error: "Transaction not found." }, { status: 404 });
    return Response.json({ message: "Transaction updated." });
  } catch (error) {
    console.error("Transaction update failed:", error);
    return Response.json({ error: "Unable to update transaction." }, { status: 500 });
  }
}