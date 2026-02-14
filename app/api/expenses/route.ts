import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/db";
import Expense from "@/models/Expense";
import ExpenseSplit from "@/models/ExpenseSplit";
import LedgerEntry from "@/models/LedgerEntry";
import User from "@/models/User";
import { Types } from "mongoose";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return new Response("Unauthorized", { status: 401 });
  }

  const {
    groupId,
    amount,
    description,
    splitType,
    involvedMembers,
    exactAmounts,
  } = await request.json();

  await connectToDatabase();

  const user = await User.findOne({ email: session.user.email });

  const objectGroupId = new Types.ObjectId(groupId);

  const expense = await Expense.create({
    groupId: objectGroupId,
    paidBy: user._id,
    amount,
    description,
    splitType,
  });

  const splits: Record<string, number> = {};

  if (splitType === "equal") {
    const splitAmount = Math.floor(amount / involvedMembers.length);

    involvedMembers.forEach((userId: string) => {
      splits[userId] = splitAmount;
    });
  } else if (splitType === "exact") {
    let total = 0;

    involvedMembers.forEach((userId: string) => {
      const val = Number(exactAmounts[userId] || 0) * 100;
      splits[userId] = val;
      total += val;
    });

    if (total !== amount) {
      return new Response("Exact amounts do not match total", { status: 400 });
    }
  }

  // Create splits + ledger
  for (const userId of involvedMembers) {
    await ExpenseSplit.create({
      expenseId: expense._id,
      userId,
      amount: splits[userId],
    });

    const delta =
      userId === user._id.toString()
        ? -amount + splits[userId]
        : splits[userId];

    await LedgerEntry.create({
      groupId: objectGroupId,
      userId,
      delta,
      sourceType: "expense",
      sourceId: expense._id,
    });
  }

  return Response.json({ success: true });
}
