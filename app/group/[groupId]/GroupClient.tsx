"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type Member = {
  _id: string;
  role: string;
  name: string;
  email: string;
  userId: string;
  balance: number;
};

type Props = {
  group: {
    _id: string;
    name: string;
  };
  currentUserId: string;
  members: Member[];
};

export default function GroupClient({
  group,
  currentUserId,
  members,
}: Props) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [splitType, setSplitType] = useState<"equal" | "exact">("equal");

  const [selectedMembers, setSelectedMembers] = useState<string[]>(
    members.map((m) => m.userId)
  );

  const [exactAmounts, setExactAmounts] = useState<Record<string, string>>({});

  const toggleMember = (userId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleCreateExpense = async () => {
    if (!amount || selectedMembers.length === 0) return;

    try {
      setLoading(true);

      await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId: group._id,
          amount: Number(amount) * 100,
          description,
          splitType,
          involvedMembers: selectedMembers,
          exactAmounts,
        }),
      });

      setOpen(false);
      setAmount("");
      setDescription("");
      setExactAmounts({});
      router.refresh();

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/40 py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-6">

        <Card>
          <CardHeader className="flex justify-between items-center">
            <CardTitle>{group.name}</CardTitle>
            <Button onClick={() => setOpen(true)}>Create Expense</Button>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Members</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {members.map((member) => (
              <div key={member._id} className="flex justify-between">
                <div>
                  {member.name}
                  {member.userId === currentUserId && " (You)"}
                </div>
                <div>
                  ₹ {(member.balance / 100).toFixed(2)}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Expense Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Expense</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">

            <Input
              placeholder="Total Amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />

            <Input
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            {/* Split Type */}
            <div className="flex gap-4">
              <Button
                variant={splitType === "equal" ? "default" : "outline"}
                onClick={() => setSplitType("equal")}
              >
                Equal
              </Button>

              <Button
                variant={splitType === "exact" ? "default" : "outline"}
                onClick={() => setSplitType("exact")}
              >
                Exact
              </Button>
            </div>

            {/* Members */}
            <div className="space-y-2">
              {members.map((member) => (
                <div key={member.userId} className="flex items-center justify-between">

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(member.userId)}
                      onChange={() => toggleMember(member.userId)}
                    />
                    {member.name}
                  </label>

                  {splitType === "exact" &&
                    selectedMembers.includes(member.userId) && (
                      <Input
                        type="number"
                        placeholder="Amount"
                        value={exactAmounts[member.userId] || ""}
                        onChange={(e) =>
                          setExactAmounts((prev) => ({
                            ...prev,
                            [member.userId]: e.target.value,
                          }))
                        }
                        className="w-28"
                      />
                    )}
                </div>
              ))}
            </div>

            <Button
              className="w-full"
              onClick={handleCreateExpense}
              disabled={loading}
            >
              {loading ? "Creating..." : "Add Expense"}
            </Button>

          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
