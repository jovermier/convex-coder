import { mutation } from "./_generated/server";

// Simple file upload URL generation function
export const getUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});