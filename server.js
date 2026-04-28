const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the root directory
app.use(express.static(path.join(__dirname, '/')));

// Simple API endpoint for future use (posts API)
app.get('/api/posts', (req, res) => {
  // Can serve posts from a DB or file here in the future
  res.json({ message: 'API is working. Posts endpoint ready.' });
});

// No fallback needed for static multi-page app

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
