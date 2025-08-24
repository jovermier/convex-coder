import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Simplified file upload function for testing deployment
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});