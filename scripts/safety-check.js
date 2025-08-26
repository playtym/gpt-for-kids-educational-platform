#!/usr/bin/env node

import { spawn } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';

console.log('🔍 Running safety and quality checks...');

// Check for API keys in code
console.log('📋 Checking for exposed API keys...');
const checkApiKeys = spawn('grep', ['-r', '--exclude-dir=node_modules', '--exclude-dir=dist', '--exclude-dir=.git', 
  '-i', 'api[_-]?key.*=.*[a-z0-9]{20,}', '.'], {
  stdio: 'pipe'
});

let hasApiKeyIssues = false;
checkApiKeys.stdout.on('data', (data) => {
  hasApiKeyIssues = true;
  console.log('⚠️  Potential API key exposed:', data.toString());
});

checkApiKeys.on('close', (code) => {
  if (!hasApiKeyIssues) {
    console.log('✅ No exposed API keys found');
  }

  // Check for TODO/FIXME comments
  console.log('📋 Checking for TODO/FIXME items...');
  const checkTodos = spawn('grep', ['-r', '--exclude-dir=node_modules', '--exclude-dir=dist', '--exclude-dir=.git',
    '-n', '-i', 'todo\\|fixme\\|hack\\|xxx', '.'], {
    stdio: 'pipe'
  });

  let todoCount = 0;
  checkTodos.stdout.on('data', (data) => {
    todoCount++;
    if (todoCount <= 10) { // Limit output
      console.log('📝', data.toString().trim());
    }
  });

  checkTodos.on('close', () => {
    if (todoCount > 0) {
      console.log(`⚠️  Found ${todoCount} TODO/FIXME items`);
    } else {
      console.log('✅ No TODO/FIXME items found');
    }

    // Run tests
    console.log('🧪 Running tests...');
    const runTests = spawn('npm', ['test'], { stdio: 'inherit' });
    
    runTests.on('close', (testCode) => {
      if (testCode === 0) {
        console.log('✅ All tests passed');
      } else {
        console.log('❌ Some tests failed');
      }

      // Final summary
      console.log('\n🎯 Safety Check Summary:');
      console.log(`API Keys: ${hasApiKeyIssues ? '❌ Issues found' : '✅ Clean'}`);
      console.log(`TODOs: ${todoCount > 0 ? `⚠️  ${todoCount} items` : '✅ Clean'}`);
      console.log(`Tests: ${testCode === 0 ? '✅ Passing' : '❌ Failing'}`);

      if (hasApiKeyIssues || testCode !== 0) {
        console.log('\n⚠️  Please address issues before production deployment');
        process.exit(1);
      } else {
        console.log('\n✅ Ready for production deployment!');
        process.exit(0);
      }
    });
  });
});
