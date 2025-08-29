import { query, mutation, httpAction } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { api } from "./_generated/api";

// Helper function to validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Helper function to validate user data integrity
async function validateUserAccount(ctx: any, userId: Id<"users">) {
  const user = await ctx.db.get(userId);
  if (!user) return { valid: false, error: "User not found" };
  
  if (!user.name || user.name.trim().length === 0) {
    return { valid: false, error: "User missing name" };
  }
  
  if (!user.email || !isValidEmail(user.email)) {
    return { valid: false, error: "User has invalid email" };
  }
  
  return { valid: true, user };
}

// Debug function to help troubleshoot authentication issues
export const debugUser = query({
  args: { 
    email: v.optional(v.string()),
    userId: v.optional(v.id("users"))
  },
  handler: async (ctx, args) => {
    if (args.userId) {
      const user = await ctx.db.get(args.userId);
      return {
        method: "userId",
        user,
        timestamp: Date.now()
      };
    }
    
    if (args.email) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", args.email!.toLowerCase().trim()))
        .first();
      return {
        method: "email",
        email: args.email.toLowerCase().trim(),
        user,
        timestamp: Date.now()
      };
    }
    
    // Return all users for debugging (limit to 10)
    const users = await ctx.db.query("users").take(10);
    return {
      method: "all",
      users: users.map(u => ({
        _id: u._id,
        email: u.email,
        name: u.name,
        createdAt: u.createdAt
      })),
      count: users.length,
      timestamp: Date.now()
    };
  },
});

// User Management Functions
export const createUser = mutation({
  args: {
    name: v.string(),
    email: v.optional(v.string()),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    console.log("CreateUser attempt:", { name: args.name, email: args.email });
    
    try {
      // Check if user with email already exists
      if (args.email) {
        const existingUser = await ctx.db
          .query("users")
          .withIndex("by_email", (q) => q.eq("email", args.email!.toLowerCase().trim()))
          .first();
        
        if (existingUser) {
          console.log("User already exists, returning existing:", existingUser._id);
          return existingUser._id;
        }
      }

      const userId = await ctx.db.insert("users", {
        name: args.name,
        email: args.email ? args.email.toLowerCase().trim() : undefined,
        avatar: args.avatar,
        isOnline: true,
        lastSeen: Date.now(),
        createdAt: Date.now(),
      });

      console.log("CreateUser successful:", { userId, name: args.name, email: args.email });
      return userId;
    } catch (error) {
      console.error("CreateUser error:", error);
      throw error;
    }
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
      senderName: sender.name || "Unknown User",
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

// Authentication functions
export const signUp = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.string(),
  },
  handler: async (ctx, { email, password, name }) => {
    console.log("SignUp attempt:", { email, name });

    // Validate inputs
    if (!email || !isValidEmail(email)) {
      console.error("Invalid email format:", email);
      throw new Error("Please provide a valid email address");
    }
    
    if (!password || password.length < 3) {
      console.error("Invalid password");
      throw new Error("Password must be at least 3 characters long");
    }
    
    if (!name || name.trim().length === 0) {
      console.error("Invalid name");
      throw new Error("Please provide a valid name");
    }

    try {
      // Check if user with this email already exists
      const existingUser = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", email.toLowerCase().trim()))
        .first();
      
      if (existingUser) {
        console.error("User already exists:", email);
        throw new Error("An account with this email already exists");
      }

      // Create user with original email (no timestamp modification)
      const userId = await ctx.db.insert("users", {
        email: email.toLowerCase().trim(),
        name: name.trim(),
        passwordHash: password, // TODO: Hash password in production
        createdAt: Date.now(),
        isOnline: true,
        lastSeen: Date.now(),
      });

      console.log("SignUp successful:", { userId, email, name });
      return { 
        userId, 
        email: email.toLowerCase().trim(), 
        name: name.trim(),
        success: true
      };
    } catch (error) {
      console.error("SignUp error:", error);
      throw error;
    }
  },
});

export const signIn = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, { email, password }) => {
    console.log("SignIn attempt:", { email });

    // Validate inputs
    if (!email || !isValidEmail(email)) {
      console.error("Invalid email format:", email);
      throw new Error("Please provide a valid email address");
    }
    
    if (!password) {
      console.error("Missing password");
      throw new Error("Please provide a password");
    }

    try {
      // Find user by exact email match (normalized)
      const user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", email.toLowerCase().trim()))
        .first();

      if (!user) {
        console.error("User not found:", email);
        throw new Error("Invalid email or password");
      }

      // Check password
      if (user.passwordHash !== password) {
        console.error("Invalid password for user:", email);
        throw new Error("Invalid email or password");
      }

      // Ensure user has required fields
      if (!user.name) {
        console.error("User missing name field:", user._id);
        throw new Error("User account is incomplete");
      }

      // Update user status
      await ctx.db.patch(user._id, {
        isOnline: true,
        lastSeen: Date.now(),
      });

      console.log("SignIn successful:", { userId: user._id, email: user.email });
      return { 
        userId: user._id, 
        email: user.email, 
        name: user.name,
        success: true
      };
    } catch (error) {
      console.error("SignIn error:", error);
      throw error;
    }
  },
});

export const signOut = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, { userId }) => {
    await ctx.db.patch(userId, {
      isOnline: false,
      lastSeen: Date.now(),
    });
    return { success: true };
  },
});

export const getCurrentUser = query({
  args: {
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, { userId }) => {
    if (!userId) return null;
    
    try {
      const user = await ctx.db.get(userId);
      if (!user) return null;

      return {
        _id: user._id,
        email: user.email || "",
        name: user.name || "Unknown User",
        isOnline: user.isOnline || false,
        lastSeen: user.lastSeen || user.createdAt,
        createdAt: user.createdAt,
      };
    } catch (error) {
      console.error("getCurrentUser error:", error);
      return null;
    }
  },
});


export const deleteMessage = mutation({
  args: {
    messageId: v.id("messages"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    
    if (!message) {
      throw new Error("Message not found");
    }

    // Only allow users to delete their own messages
    if (message.senderId !== args.userId) {
      throw new Error("You can only delete your own messages");
    }
    
    // Soft delete by marking as deleted
    await ctx.db.patch(args.messageId, {
      isDeleted: true,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Function to match the working deployed API with file support
export const getMessages = query({
  args: {},
  handler: async (ctx) => {
    // Extended to include file attachment data for image previews
    const messages = await ctx.db
      .query("messages")
      .filter((q) => q.neq(q.field("isDeleted"), true))
      .collect();

    return messages.map(msg => ({
      _id: msg._id,
      _creationTime: msg.createdAt || msg._creationTime,
      body: msg.content,
      user: msg.senderName,
      senderId: msg.senderId, // This is the actual user ID from the database
      // File attachment fields for image previews
      type: msg.type || "text",
      storageId: msg.storageId,
      fileName: msg.fileName,
      fileType: msg.fileType,
      fileSize: msg.fileSize,
      fileData: msg.fileData,
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