#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function removeGzFiles(dir) {
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

const buildDir = path.join(__dirname, '../build');
const androidAssetsDir = path.join(__dirname, '../android/app/src/main/assets/public');

if (fs.existsSync(buildDir)) {
  console.log('Cleaning .gz files from build directory...');
  removeGzFiles(buildDir);
}

if (fs.existsSync(androidAssetsDir)) {
  console.log('Cleaning .gz files from Android assets...');
  removeGzFiles(androidAssetsDir);
}

console.log('Build cleanup completed!');