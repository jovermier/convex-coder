import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  messages: defineTable({
    user: v.string(),
    body: v.string(),
    fileData: v.optional(v.string()),
    fileName: v.optional(v.string()),
    fileType: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    createdAt: v.optional(v.number()),
  }),
});
