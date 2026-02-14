"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type User = {
  name?: string | null;
  email?: string | null;
};

type GroupType = {
  _id: string;
  name: string;
};

type DashboardProps = {
  user?: User | null;
  groups: GroupType[];
};

export default function DashboardClient({
  user,
  groups,
}: DashboardProps) {
  const router = useRouter();

  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [token, setToken] = useState("");
  const [groupName, setGroupName] = useState("");
  const [joinLink, setJoinLink] = useState("");
  const [notification, setNotification] = useState("");
  const [loading, setLoading] = useState(false);

  // ---------------- CREATE GROUP ----------------

  const confirmGroupCreation = async () => {
    if (!groupName.trim()) return;

    try {
      setLoading(true);

      const res = await fetch("/api/groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ groupName }),
      });

      if (!res.ok) throw new Error("Failed to create group");

      const data = await res.json();

      setJoinLink(data.joinLink);
      setNotification("Group created successfully 🎉");

    } catch (err) {
      console.error(err);
      setNotification("Failed to create group");
      setTimeout(() => setNotification(""), 4000);
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(joinLink);
      setNotification("Invite link copied!");
      setTimeout(() => setNotification(""), 2000);
    } catch {
      console.warn("Clipboard not supported");
    }
  };

  // ---------------- JOIN GROUP ----------------

  const joinGroup = async () => {
    if (!token.trim()) return;

    try {
      setLoading(true);

      const res = await fetch("/api/groups/join-by-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (!res.ok || !data?.groupId) {
        throw new Error("Invalid token");
      }

      setJoinOpen(false);
      setToken("");

      router.push(`/group/${data.groupId}`);
    } catch (err) {
      console.error(err);
      setNotification("Invalid token or failed to join");
      setTimeout(() => setNotification(""), 4000);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading user...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/40 py-10 px-4 space-y-6">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Notification */}
        {notification && (
          <div className="bg-green-600 text-white px-6 py-3 rounded-xl shadow">
            {notification}
          </div>
        )}

        {/* Welcome Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              Welcome, {user.name ?? "User"}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {user.email ?? ""}
            </p>
          </CardHeader>
        </Card>

        {/* Groups List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Groups</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {groups.length === 0 && (
              <p className="text-muted-foreground text-sm">
                You are not part of any groups yet.
              </p>
            )}

            {groups.map((group) => (
              <div
                key={group._id}
                onClick={() => router.push(`/group/${group._id}`)}
                className="p-4 border rounded-xl cursor-pointer hover:bg-muted transition"
              >
                {group.name}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            className="flex-1"
            onClick={() => setCreateOpen(true)}
          >
            Create Group
          </Button>

          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setJoinOpen(true)}
          >
            Join Group
          </Button>
        </div>
      </div>

      {/* ---------------- CREATE GROUP DIALOG ---------------- */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Group</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              placeholder="Enter group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />

            <Button
              className="w-full"
              onClick={confirmGroupCreation}
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Group"}
            </Button>

            {joinLink && (
              <>
                <p className="text-sm text-muted-foreground">
                  Share this invite link:
                </p>

                <div className="p-3 bg-muted rounded-lg text-sm break-all">
                  {joinLink}
                </div>

                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={copyLink}
                >
                  Copy Invite Link
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ---------------- JOIN GROUP DIALOG ---------------- */}
      <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join Group</DialogTitle>
          </DialogHeader>

          <div className="flex gap-2">
            <Input
              placeholder="Enter group token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
            <Button onClick={joinGroup} disabled={loading}>
              {loading ? "Joining..." : "Join"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
