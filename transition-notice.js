#!/usr/bin/env node

// Transition script for deprecated talktomedeara package
console.warn(`
🚨 ================================ IMPORTANT ================================ 🚨

⚠️  THIS PACKAGE HAS BEEN RENAMED!

❌ OLD: talktomedeara  
✅ NEW: talktomedearai

📦 TO UPDATE:
   npm uninstall -g talktomedeara
   npm install -g talktomedearai

🔧 COMMAND CHANGE:
   OLD: talktomedeara setup
   NEW: talktomedearai setup

📖 MORE INFO: https://github.com/bramato/talkToMeDearAi

This transition package will be removed in future versions.
Please update to 'talktomedearai' as soon as possible.

===============================================================================
`);

// For now, try to proxy to the new package if available
try {
  const newPackage = require('talktomedearai');
  console.log('✅ Automatically using new package...\n');
  module.exports = newPackage;
} catch (error) {
  console.error('❌ New package not found. Please install: npm install -g talktomedearai\n');
  process.exit(1);
}