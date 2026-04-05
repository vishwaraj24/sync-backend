app.get('/reviews', async (req, res) => {
    try {
        const reviews = await Review.find().sort({ createdAt: -1 });
        res.json(reviews);
    } catch (err) {
        res.status(500).json({ error: 'Server error fetching reviews' });
    }
});

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


// ✅ ADD THIS HERE
app.get("/", (req, res) => {
    res.send("SYNC backend is running 🚀");
});


// Fallback route
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});