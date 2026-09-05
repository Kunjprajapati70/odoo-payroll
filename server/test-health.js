const http = require('http');
const mongoose = require('mongoose');
const app = require('./src/app');
const connectDB = require('./src/config/db');

async function test() {
  await connectDB();
  const server = app.listen(0, async () => {
    const port = server.address().port;
    const url = `http://127.0.0.1:${port}/api/v1/health`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      console.log('GET /api/v1/health Status:', response.status);
      console.log('Response Body:', data);
      
      if (response.status === 200 && data.message === 'PeoplePay360 API is running') {
        console.log('✓ Health check test passed successfully!');
      } else {
        console.error('✗ Health check test failed!');
        process.exitCode = 1;
      }
    } catch (err) {
      console.error('Error during test:', err);
      process.exitCode = 1;
    } finally {
      server.close(async () => {
        await mongoose.disconnect();
      });
    }
  });
}

test();
