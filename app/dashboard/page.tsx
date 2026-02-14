import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/db";
import GroupMember from "@/models/GroupMember";
import User from "@/models/User";
import DashboardClient from "./DashboardClient";

export default async function Dashboard() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/api/auth/signin");
  }

  await connectToDatabase();

  const user = await User.findOne({
    email: session.user.email,
  }).lean();

  if (!user) {
    redirect("/api/auth/signin");
  }

  const memberships = await GroupMember.find({
    userId: user._id,
  })
    .populate("groupId", "name")
    .lean();

  // 🔥 Convert to plain safe objects
  const groups = memberships.map((m: any) => ({
    _id: m.groupId._id.toString(),
    name: m.groupId.name,
  }));

  return (
    <DashboardClient
      user={{
        name: session.user.name,
        email: session.user.email,
      }}
      groups={groups}
    />
  );
}
