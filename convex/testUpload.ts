import { mutation } from "./_generated/server";

// Test S3 connectivity by generating an upload URL
export const testS3Connection = mutation({
  args: {},
  handler: async (ctx) => {
    try {
      const uploadUrl = await ctx.storage.generateUploadUrl();
      return { 
        success: true, 
        uploadUrl,
        message: "S3 connection successful"
      };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message,
        message: "S3 connection failed"
      };
    }
  },
});