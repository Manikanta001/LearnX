require('dotenv').config();
const app = require('./app');
const { initializeScheduler } = require('./utils/scheduler');

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Initialize daily reminder scheduler
  initializeScheduler();
});
