// netlify-deploy.js
const { execSync } = require('child_process');
const fs = require('fs');

// Check if .env.production exists, otherwise use .env
const envFile = fs.existsSync('.env.production') ? '.env.production' : '.env';
console.log(`Using environment file: ${envFile}`);

// Load environment variables for production build
process.env.NODE_ENV = 'production';

// Run the build
console.log('Building the Angular application for production...');
try {
  // Set environment variables from the selected .env file
  const envConfig = require('dotenv').config({ path: envFile }).parsed;
  
  // Pass environment variables to the build process
  Object.keys(envConfig).forEach(key => {
    process.env[key] = envConfig[key];
  });
  
  // Run the build script
  execSync('npm run config && ng build --configuration production', { stdio: 'inherit' });
  
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}
