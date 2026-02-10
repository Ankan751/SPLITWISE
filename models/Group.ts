// models/Group.ts
import mongoose, { Schema, Types } from "mongoose";

const GroupSchema = new Schema(
  {
    name: { type: String, required: true },
    createdBy: { type: Types.ObjectId, ref: "User", required: true },
    token: { type: String, required: true, unique: true }, // for sharing
  },
  { timestamps: true }
);

const Group = mongoose.models.Group || mongoose.model("Group", GroupSchema);
export default Group;