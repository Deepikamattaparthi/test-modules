const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/auth');
const config = require('./config');


const app = express();

// Connect to MongoDB
mongoose.connect(config.mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Error connecting to MongoDB', err));

app.use(bodyParser.json());


// Import the authMiddleware
const authMiddleware = require('./middleware/auth');

// Protected Route
app.get('/api/protected', authMiddleware, (req, res) => {
  // This route is protected and can only be accessed with a valid JWT token
  res.json({ message: 'This is a protected route!', userId: req.userId });
});


// Routes
app.use('/api/auth', authRoutes);



const PORT = process.env.PORT || 3000;
app.listen(3000, () => {
  console.log(`Server is running on port ${3000}`);
});
