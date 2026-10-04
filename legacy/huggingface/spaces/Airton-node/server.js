// server.js (Node.js backend)

const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 3000;
const secretKey = 'your-secret-key'; // Replace with a strong, randomly generated secret key
const usersFilePath = 'users.json'; // File to store user data

// --- Middleware ---
app.use(cors({
    origin: 'http://localhost:8080' // Replace with your frontend's origin (e.g., your domain)
})); // Enable CORS for your frontend origin
app.use(express.json());
app.use(express.static('public'));

// --- File Upload Configuration ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = 'uploads/';
        fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

const upload = multer({ storage: storage });

// --- Load Users from File (Database Simulation) ---
let users = [];
function loadUsers() {
    try {
        const data = fs.readFileSync(usersFilePath, 'utf8');
        users = JSON.parse(data);
    } catch (error) {
        console.log('No existing users file found or error loading users. Starting with an empty user list.');
        users = []; // Start with an empty array if the file doesn't exist or has an error
    }
}

function saveUsers() {
    try {
        fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2), 'utf8'); // Pretty print the JSON
        console.log('Users saved to file.');
    } catch (error) {
        console.error('Error saving users to file:', error);
    }
}

loadUsers(); // Load users when the server starts

// --- Helper Functions ---

function generateToken(user) {
    const payload = {
        userId: user.id,
        email: user.email,
        name: user.name
    };
    const options = {
        expiresIn: '1h'
    };
    return jwt.sign(payload, secretKey, options);
}

// --- API Endpoints ---

// 1. Registration
app.post('/register', async (req, res) => {
    try {
        const { name, email, password, age, medicalHistory } = req.body;

        // Input validation (enhanced)
        if (!name || name.length < 2) {
            return res.status(400).json({ message: 'Name must be at least 2 characters long.' });
        }
        if (!email || !email.includes('@')) {
            return res.status(400).json({ message: 'Invalid email format.' });
        }
        if (!password || password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
        }

        // Check if the email is already registered
        if (users.find(user => user.email === email)) {
            return res.status(400).json({ message: 'Email already exists.' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user object
        const newUser = {
            id: users.length > 0 ? users[users.length - 1].id + 1 : 1, // Simple ID generation
            name,
            email,
            password: hashedPassword,
            age,
            medicalHistory,
            analysisHistory: [] // Initialize analysis history
        };

        // Add the new user to the users array
        users.push(newUser);
        saveUsers(); // Save the updated user list to the file

        res.status(201).json({ message: 'User registered successfully.' });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Registration failed. Please try again later.' });
    }
});

// 2. Login
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find the user by email
        const user = users.find(user => user.email === email);

        // Check if the user exists
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        // Compare the provided password with the hashed password
        const passwordMatch = await bcrypt.compare(password, user.password);

        // Check if the passwords match
        if (!passwordMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        // Generate a JWT
        const token = generateToken(user);

        // Respond with the token
        res.status(200).json({ token: token, message: 'Login successful' });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Login failed.' });
    }
});

// 3. Authentication Middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized: No token provided.' });
    }

    jwt.verify(token, secretKey, (err, user) => {
        if (err) {
            console.error('Token verification error:', err);
            return res.status(403).json({ message: 'Forbidden: Invalid token.' });
        }
        req.user = user;
        next();
    });
}

// 4. Get User Data (Protected Route)
app.get('/user', authenticateToken, (req, res) => {
    try {
        const userId = req.user.userId;
        const user = users.find(user => user.id === userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Return user data (excluding the password)
        const userData = {
            name: user.name,
            email: user.email,
            age: user.age,
            medicalHistory: user.medicalHistory,
            analysisHistory: user.analysisHistory || [] // Get analysis history
        };

        res.status(200).json(userData);

    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).json({ message: 'Failed to fetch user data.' });
    }
});

// 5. Image Analysis
app.post('/analyze', authenticateToken, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No image uploaded.' });
        }

        const imagePath = req.file.path;
        const userId = req.user.userId;

        // --- Placeholder for Model Prediction ---
        const glaucomaProbability = Math.random();
        const otherDiseases = {
            'Diabetic Retinopathy': Math.random(),
            'Macular Degeneration': Math.random()
        };

        const analysisDescription = glaucomaProbability > 0.7 ? 'Possible signs of glaucoma detected. Consult an ophthalmologist.' : 'No significant signs of glaucoma detected.';

        // --- Store Analysis History ---
        const userIndex = users.findIndex(user => user.id === userId);
        if (userIndex !== -1) {
            users[userIndex].analysisHistory.push({
                date: new Date(),
                imagePath: imagePath,
                glaucoma_probability: glaucomaProbability,
                analysis_description: analysisDescription,
                other_diseases: otherDiseases
            });
            saveUsers(); // Save the updated user list to the file
        } else {
            console.warn(`User with ID ${userId} not found for analysis history update.`);
        }

        // --- Respond with the analysis results ---
        res.status(200).json({
            glaucoma_probability: glaucomaProbability,
            analysis_description: analysisDescription,
            other_diseases: otherDiseases,
            image_path: imagePath // Send the image path back to the client
        });

    } catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({ message: 'Image analysis failed. Please try again later.' });
    }
});

// 6. Contact Form (Placeholder)
app.post('/contact', (req, res) => {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    console.log('Contact form submission:', { name, email, message });
    res.status(200).json({ message: 'Your message has been sent (simulated).' });
});

// --- Start the Server ---
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});