#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function removeGzFiles(dir) {
  if (!fs.existsSync(dir)) return;
  
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      removeGzFiles(filePath);
    } else if (file.endsWith('.gz')) {
      console.log(`Removing: ${filePath}`);
      fs.unlinkSync(filePath);
    }
  });
}

console.log('Building for Android (without compression)...');
// Set environment variable and build
process.env.ANDROID_BUILD = 'true';
execSync('npm run build:original', { stdio: 'inherit' });

console.log('Removing .gz files from build...');
removeGzFiles('./build');

console.log('Syncing with Capacitor...');
execSync('npx cap sync android', { stdio: 'inherit' });

console.log('Removing .gz files from Android assets...');
removeGzFiles('./android/app/src/main/assets/public');

console.log('Android build and sync completed successfully!');