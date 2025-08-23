#!/usr/bin/env node

/**
 * Simple deployment script for self-hosted Convex backend
 */

const fs = require('fs');
const path = require('path');

async function deployToSelfHosted() {
  console.log('🚀 Deploying to self-hosted Convex backend...');
  
  const CONVEX_URL = process.env.CONVEX_SELF_HOSTED_URL || 'https://convex-api--main--convex-coder--jovermier.coder.hahomelabs.com';
  const ADMIN_KEY = process.env.CONVEX_SELF_HOSTED_ADMIN_KEY || 'convex-coder-workspace|01c1c0ba76671e5207fccb6376412485f71288a89af7c0c19c0b04ca9181471f0d8951aef83b56600d59678f71d2cb6bcd';
  
  console.log(`📡 Backend URL: ${CONVEX_URL}`);
  
  try {
    // Read the schema
    const schemaPath = path.join(__dirname, 'convex', 'schema.ts');
    const chatPath = path.join(__dirname, 'convex', 'chat.ts');
    
    if (!fs.existsSync(schemaPath)) {
      throw new Error('Schema file not found');
    }
    if (!fs.existsSync(chatPath)) {
      throw new Error('Chat functions file not found');
    }
    
    console.log('📄 Schema and functions found');
    
    // For now, just indicate that manual deployment is needed
    console.log('⚠️  Manual deployment required:');
    console.log('   The Convex CLI is having issues with the self-hosted setup.');
    console.log('   The schema and functions have been updated locally.');
    console.log('   You may need to restart the backend container or check the dashboard.');
    
    console.log('\n📋 Functions that should be available:');
    console.log('   - chat:sendMessage (updated with file support)');
    console.log('   - chat:getMessages');
    console.log('   - chat:uploadFile (new)');
    console.log('   - chat:getFileUrl (new)');
    
    console.log('\n🌐 Try accessing the dashboard at:');
    console.log('   https://convex--main--convex-coder--jovermier.coder.hahomelabs.com');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  deployToSelfHosted();
}

module.exports = { deployToSelfHosted };