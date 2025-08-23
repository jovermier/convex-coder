import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { auth } from './auth';

// List tasks
export const listTask = query({
  args: {
    limit: v.optional(v.number()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error('Not authenticated');
    
    let query = ctx.db.query("task").filter(q => q.eq(q.field("userId"), identity.subject));
    
    // Add search filter if provided
    if (args.search) {
      query = query.filter(q => 
        q.or(
          q.eq(q.field("title"), args.search)
        )
      );
    }
    
    const items = await query
      .order("desc")
      .take(args.limit ?? 50);
    
    return items;
  },
});

// Get single task
export const getTask = query({
  args: { id: v.id("task") },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error('Not authenticated');
    
    const item = await ctx.db.get(args.id);
    if (!item) return null;
    
    if (item.userId !== identity.subject) throw new Error('Unauthorized');
    
    return item;
  },
});

// Create task
export const createTask = mutation({
  args: {
    title: v.string(), description: v.optional(v.string()), priority: v.number(), isCompleted: v.boolean()
  },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error('Not authenticated');
    
    const now = Date.now();
    
    const taskId = await ctx.db.insert("task", {
      ...args,
      userId: identity.subject,
      createdAt: now,
    });
    
    return taskId;
  },
});

// Update task
export const updateTask = mutation({
  args: {
    id: v.id("task"),
    title: v.optional(v.string()), description: v.optional(v.string()), priority: v.optional(v.number()), isCompleted: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error('Not authenticated');
    
    const { id, ...updates } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Task not found");
    
    if (existing.userId !== identity.subject) throw new Error('Unauthorized');
    
    // Remove undefined values
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );
    
    if (Object.keys(cleanUpdates).length > 0) {
      cleanUpdates.updatedAt = Date.now();
      await ctx.db.patch(id, cleanUpdates);
    }
    
    return await ctx.db.get(id);
  },
});

// Delete task
export const deleteTask = mutation({
  args: { id: v.id("task") },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error('Not authenticated');
    
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Task not found");
    
    if (existing.userId !== identity.subject) throw new Error('Unauthorized');
    
    await ctx.db.delete(args.id);
    return { success: true };
  },
});
