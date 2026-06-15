const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Ensure required directories exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 2. Database Connection
const mongoURI = 'mongodb://127.0.0.1:27017/feedbackDB';
mongoose.connect(mongoURI)
  .then(() => console.log('Successfully connected to MongoDB.'))
  .catch((err) => console.error('MongoDB connection error:', err));

// 3. Mongoose Schema & Model Definition
const feedbackSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  filePath: {
    type: String,
    default: null
  }
}, {
  timestamps: true // Automatically handles createdAt and updatedAt timestamps
});

const Feedback = mongoose.model('Feedback', feedbackSchema);

// 4. Middleware Setup
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically (optional, but good for rendering/verification)
app.use('/uploads', express.static(uploadsDir));

// 5. Multer File Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Sanitize filename and prepend unique timestamp to prevent collisions
    const timestamp = Date.now();
    const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${timestamp}-${sanitizedOriginalName}`);
  }
});

// Configure upload limits and allowed file types
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB file size limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, and PDF files are allowed.'));
    }
  }
});

// 6. Security Helpers (XSS Sanitization)
function escapeHtml(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// 7. Rate Limiter (Limit to 5 requests per 15 minutes per IP for /feedback endpoint)
const feedbackLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // maximum 5 requests
  message: {
    error: 'Too many feedback submissions from this IP. Please try again after 15 minutes.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false // Disable the `X-RateLimit-*` headers
});

// 8. API Endpoint: POST /feedback
app.post('/feedback', feedbackLimiter, (req, res, next) => {
  // Use multer upload middleware
  upload.single('attachment')(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      // Multer-specific error (like file size limits)
      return res.status(400).json({ error: `Upload error: ${err.message}` });
    } else if (err) {
      // Other errors (like file type validation failures)
      return res.status(400).json({ error: err.message });
    }

    try {
      const { name, email, message } = req.body;

      // Server-side validation: Check for missing or empty fields
      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Name field is required and cannot be blank.' });
      }
      if (!email || !email.trim()) {
        return res.status(400).json({ error: 'Email field is required and cannot be blank.' });
      }
      if (!message || !message.trim()) {
        return res.status(400).json({ error: 'Message field is required and cannot be blank.' });
      }

      // Email Format Check using Regex
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return res.status(400).json({ error: 'Please enter a valid email address layout.' });
      }

      // Security Check: Sanitize inputs to prevent XSS (HTML injection)
      const sanitizedName = escapeHtml(name.trim());
      const sanitizedEmail = escapeHtml(email.trim());
      const sanitizedMessage = escapeHtml(message.trim());

      // Get relative file path if file is uploaded
      let relativeFilePath = null;
      if (req.file) {
        relativeFilePath = `uploads/${req.file.filename}`;
      }

      // Database Storage: Save to MongoDB
      const newFeedback = new Feedback({
        name: sanitizedName,
        email: sanitizedEmail,
        message: sanitizedMessage,
        filePath: relativeFilePath
      });

      const savedFeedback = await newFeedback.save();
      
      // Console log database entry to track in terminal
      console.log('--- Feedback Saved to MongoDB ---');
      console.log(savedFeedback);
      console.log('---------------------------------');

      // Send 201 Created Response
      return res.status(201).json({
        message: 'Feedback submitted successfully! Thank you for your feedback.',
        data: savedFeedback
      });

    } catch (dbError) {
      console.error('Error saving feedback to MongoDB:', dbError);
      return res.status(500).json({ error: 'Internal server database storage error.' });
    }
  });
});

// GET /feedback - Retrieve all submitted feedbacks (for admin review)
app.get('/feedback', async (req, res) => {
  try {
    const feedbacks = await Feedback.find().sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (err) {
    console.error('Error fetching feedbacks:', err);
    res.status(500).json({ error: 'Failed to retrieve feedback submissions.' });
  }
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error stack:', err.stack);
  res.status(500).json({ error: 'An unexpected internal server error occurred.' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running and listening on http://localhost:${PORT}`);
});
