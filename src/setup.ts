#!/usr/bin/env node
import { ConfigManager } from './config/setup.js';

async function main() {
  try {
    const configManager = new ConfigManager();
    await configManager.runSetup();
  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}