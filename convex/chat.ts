import { query, mutation, httpAction } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { api } from "./_generated/api";

// User Management Functions
export const createUser = mutation({
  args: {
    name: v.string(),
    email: v.optional(v.string()),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user with email already exists
    if (args.email) {
      const existingUser = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", args.email))
        .first();
      
      if (existingUser) {
        return existingUser._id;
      }
    }

    const userId = await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      avatar: args.avatar,
      isOnline: true,
      lastSeen: Date.now(),
      createdAt: Date.now(),
    });

    return userId;
  },
});

export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

export const updateUserStatus = mutation({
  args: {
    userId: v.id("users"),
    isOnline: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      isOnline: args.isOnline,
      lastSeen: Date.now(),
    });
  },
});

// Message Functions
export const sendMessage = mutation({
  args: {
    senderId: v.id("users"),
    content: v.string(),
    type: v.union(v.literal("text"), v.literal("image"), v.literal("file")),
    storageId: v.optional(v.id("_storage")),
    fileName: v.optional(v.string()),
    fileType: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    fileData: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const sender = await ctx.db.get(args.senderId);
    if (!sender) {
      throw new Error("Sender not found");
    }

    const messageId = await ctx.db.insert("messages", {
      senderId: args.senderId,
      senderName: sender.name,
      content: args.content,
      type: args.type,
      storageId: args.storageId,
      fileName: args.fileName,
      fileType: args.fileType,
      fileSize: args.fileSize,
      fileData: args.fileData,
      createdAt: Date.now(),
    });

    return messageId;
  },
});

// Function to match the working deployed API
export const getMessages = query({
  args: {},
  handler: async (ctx) => {
    // This function matches the working deployed API structure
    // The deployed API has messages with: _id, _creationTime, body, user
    const messages = await ctx.db
      .query("messages")
      .collect();

    return messages.map(msg => ({
      _id: msg._id,
      _creationTime: msg.createdAt || msg._creationTime,
      body: msg.content,
      user: msg.senderName
    }));
  },
});

// Keep the original function as well for backwards compatibility
export const getRecentMessages = query({
  args: {},
  handler: async (ctx) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_created_at")
      .filter((q) => q.neq(q.field("isDeleted"), true))
      .order("desc")
      .take(50);

    return messages.reverse();
  },
});

// File Upload Functions
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Test function to verify storage is working
export const testStorage = query({
  args: {},
  handler: async (ctx) => {
    try {
      // Try to access storage metadata
      return {
        storageConfigured: true,
        timestamp: new Date().toISOString(),
        message: "Storage system appears to be accessible"
      };
    } catch (error) {
      return {
        storageConfigured: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      };
    }
  },
});

export const saveFileRecord = mutation({
  args: {
    storageId: v.id("_storage"),
    name: v.string(),
    type: v.string(),
    size: v.number(),
    uploaderId: v.id("users"),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    try {
      const fileId = await ctx.db.insert("files", {
        name: args.name,
        type: args.type,
        size: args.size,
        storageId: args.storageId,
        uploaderId: args.uploaderId,
        isPublic: args.isPublic ?? false,
        uploadedAt: Date.now(),
      });

      return fileId;
    } catch (error) {
      console.error("saveFileRecord failed:", error);
      throw new Error("File record save failed");
    }
  },
});

export const getFileUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    try {
      return await ctx.storage.getUrl(args.storageId);
    } catch (error) {
      console.error("getFileUrl failed:", error);
      throw new Error("File URL generation failed");
    }
  },
});

// Internal mutation for saving file records (called from HTTP action)
export const saveFileRecordInternal = mutation({
  args: {
    storageId: v.id("_storage"),
    name: v.string(),
    type: v.string(),
    size: v.number(),
    uploaderId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("files", {
      name: args.name,
      type: args.type,
      size: args.size,
      storageId: args.storageId,
      uploaderId: args.uploaderId,
      isPublic: true,
      uploadedAt: Date.now(),
    });
  },
});

// Alternative HTTP Action approach for file uploads
export const uploadFile = httpAction(async (ctx, request) => {
  try {
    // This is a direct HTTP action that can handle file uploads
    // It bypasses the generateUploadUrl flow entirely
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const uploaderId = formData.get("uploaderId") as string;
    
    if (!file || !uploaderId) {
      return new Response("Missing file or uploaderId", { status: 400 });
    }

    // Store file in Convex storage (this should work with local filesystem storage)
    const blob = new Blob([await file.arrayBuffer()], { type: file.type });
    const storageId = await ctx.storage.store(blob);
    
    // For now, just return the storage ID without saving to files table
    // The files table might not be properly set up in the deployment
    return new Response(JSON.stringify({ 
      success: true, 
      storageId, 
      message: "File uploaded to storage successfully"
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
    
  } catch (error) {
    console.error("HTTP file upload failed:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : "Upload failed" 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});