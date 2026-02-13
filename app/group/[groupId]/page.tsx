import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/db";
import Group from "@/models/Group";
import GroupMember from "@/models/GroupMember";
import User from "@/models/User";
import mongoose from "mongoose";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";

interface UserRecord {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  image?: string;
}

interface GroupRecord {
  _id: mongoose.Types.ObjectId;
  name: string;
  token: string;
  createdBy: mongoose.Types.ObjectId;
}

type MemberRole = "admin" | "member";

interface GroupMemberRecord {
  _id: mongoose.Types.ObjectId;
  groupId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: MemberRole;
  joinedAt: Date;
}

interface GroupMemberWithUserRecord {
  _id: mongoose.Types.ObjectId;
  groupId: mongoose.Types.ObjectId;
  userId: Pick<UserRecord, "name" | "email" | "image"> | null;
  role: MemberRole;
  joinedAt: Date;
}

export default async function GroupPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;

  if (!groupId || !mongoose.Types.ObjectId.isValid(groupId)) {
    return notFound();
  }

  const session = await auth();

  if (!session?.user?.email) {
    redirect("/api/auth/signin");
  }

  await connectToDatabase();

  const [dbUser, group] = await Promise.all([
    User.findOne({ email: session.user.email }).lean<UserRecord | null>(),
    Group.findById(groupId).lean<GroupRecord | null>(),
  ]);

  if (!dbUser) return notFound();
  if (!group) return notFound();

  const membership = await GroupMember.findOne({
    groupId,
    userId: dbUser._id,
  }).lean<GroupMemberRecord | null>();

  if (!membership) {
    return notFound();
  }

  const members = await GroupMember.find({
    groupId,
  })
    .populate<{ userId: GroupMemberWithUserRecord["userId"] }>(
      "userId",
      "name email image"
    )
    .lean<GroupMemberWithUserRecord[]>();

  return (
    <div className="min-h-screen bg-gray-100 p-10">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="rounded-2xl shadow-lg">
          <CardContent className="p-6">
            <h1 className="text-3xl font-bold">{group.name}</h1>

            <p className="text-gray-500 mt-2">
              Invite Token:
              <span className="ml-2 font-mono bg-gray-200 px-2 py-1 rounded">
                {group.token}
              </span>
            </p>

            <p className="text-sm text-gray-400 mt-2">
              Your role:
              <span className="ml-2 font-semibold text-black">
                {membership.role}
              </span>
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-lg">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">
              Members ({members.length})
            </h2>

            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member._id.toString()}
                  className="flex items-center justify-between bg-gray-50 p-4 rounded-lg "
                >
                  <div>
                    <p className="font-medium text-lg">
                      {member.userId?.name ?? "Unnamed User"}
                    </p>
                    <p className="text-sm text-gray-500">{member.userId?.email}</p>
                  </div>

                  <span className="text-sm bg-black text-white px-3 py-1 rounded-full">
                    {member.role}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
