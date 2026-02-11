// Load environment variables from .env.local for Jest tests
const fs = require('fs');
const path = require('path');

const envLocalPath = path.resolve(__dirname, '.env.local');

if (fs.existsSync(envLocalPath)) {
  const envConfig = fs.readFileSync(envLocalPath, 'utf-8');
  const envLines = envConfig.split('\n');
  
  envLines.forEach((line) => {
    const trimmedLine = line.trim();
    // Skip empty lines and comments
    if (!trimmedLine || trimmedLine.startsWith('#')) {
      return;
    }
    
    // Parse KEY=VALUE format
    const match = trimmedLine.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      
      // Remove surrounding quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      
      // Only set if not already defined (env vars take precedence)
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
  
  console.log('✓ Loaded environment variables from .env.local');
} else {
  console.log('⚠ No .env.local file found');
}

// Log if API logging is enabled
if (process.env.ENABLE_API_LOGGING === 'true') {
  console.log('📝 API request/response logging is ENABLED');
}
