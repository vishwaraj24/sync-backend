require('dotenv').config();

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const connectDB = require('./config/db');
const Project = require('./models/Project');
const Review = require('./models/Review');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

// ---------------- ROUTES ----------------

// Test Route
app.get("/", (req, res) => {
    res.send("SYNC backend is running 🚀");
});

// Get Projects
app.get('/projects', async (req, res) => {
    try {
        const projects = await Project.find().sort({ createdAt: -1 });
        res.json(projects);
    } catch (err) {
        res.status(500).json({ error: 'Server error fetching projects' });
    }
});

// Add Project
app.post('/add-project', upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'gallery', maxCount: 4 }
]), async (req, res) => {
    try {
        const { title, password } = req.body;

        if (password !== process.env.ADMIN_PASSWORD) {
            return res.status(401).json({ error: 'Unauthorized: Invalid password' });
        }

        if (!title || !req.files['thumbnail']) {
            return res.status(400).json({ error: 'Title and Thumbnail are required' });
        }

        const thumbnailPath = '/uploads/' + req.files['thumbnail'][0].filename;

        const galleryPaths = [];
        if (req.files['gallery']) {
            for (let file of req.files['gallery']) {
                galleryPaths.push('/uploads/' + file.filename);
            }
        }

        const newProject = new Project({
            title,
            thumbnail: thumbnailPath,
            galleryImages: galleryPaths
        });

        await newProject.save();
        res.status(201).json(newProject);
    } catch (err) {
        res.status(500).json({ error: 'Server error saving project', details: err.message });
    }
});

// Get Reviews
app.get('/reviews', async (req, res) => {
    try {
        const reviews = await Review.find().sort({ createdAt: -1 });
        res.json(reviews);
    } catch (err) {
        res.status(500).json({ error: 'Server error fetching reviews' });
    }
});

// Add Review
app.post('/add-review', async (req, res) => {
    try {
        const { name, message } = req.body;

        if (!name || !message) {
            return res.status(400).json({ error: 'Name and message required' });
        }

        const newReview = new Review({ name, message });
        await newReview.save();

        res.status(201).json(newReview);
    } catch (err) {
        res.status(500).json({ error: 'Server error saving review' });
    }
});

// Fallback route (must be last)
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});