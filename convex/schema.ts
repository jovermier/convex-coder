import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    passwordHash: v.optional(v.string()),
    avatar: v.optional(v.string()),
    isOnline: v.optional(v.boolean()),
    lastSeen: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_created_at", ["createdAt"]),

  messages: defineTable({
    senderId: v.id("users"),
    senderName: v.string(),
    content: v.string(),
    type: v.union(v.literal("text"), v.literal("image"), v.literal("file")),
    storageId: v.optional(v.id("_storage")),
    fileName: v.optional(v.string()),
    fileType: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    fileData: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    isDeleted: v.optional(v.boolean()),
  }).index("by_created_at", ["createdAt"]),

  files: defineTable({
    name: v.string(),
    type: v.string(),
    size: v.number(),
    storageId: v.id("_storage"),
    uploaderId: v.id("users"),
    isPublic: v.boolean(),
    uploadedAt: v.number(),
  }).index("by_uploader", ["uploaderId", "uploadedAt"]),
});
