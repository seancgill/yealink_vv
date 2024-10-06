const express = require('express');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const session = require('express-session');
const crypto = require('crypto');

const app = express();

// Create a write stream (in append mode)
const logStream = fs.createWriteStream(path.join(__dirname, 'logs', 'app.log'), { flags: 'a' });

// Setup the logger to write to app.log
app.use(morgan('combined', { stream: logStream }));

// Generate a secret key for session
const secretKey = crypto.randomBytes(64).toString('hex');

// Initialize session middleware
app.use(session({
  secret: secretKey,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }  // Change to true when using HTTPS
}));

// Import the voicemail route and mount it
const voicemailRoute = require('./app/routes/voicemail');  // Adjust the path if necessary
app.use('/', voicemailRoute);  // This mounts the route at the root level

// Start the server
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Yealink middleware app listening at http://localhost:${port}`);
});
