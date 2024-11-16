require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Database connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Connected to the database');
});

// Multer configuration for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// User registration
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], (err, result) => {
    if (err) {
      res.status(500).json({ error: 'Error registering user' });
    } else {
      res.status(201).json({ message: 'User registered successfully' });
    }
  });
});

// User login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
    if (err) {
      res.status(500).json({ error: 'Error logging in' });
    } else if (results.length > 0) {
      const match = await bcrypt.compare(password, results[0].password);
      if (match) {
        const token = jwt.sign({ id: results[0].id, username: results[0].username }, process.env.JWT_SECRET);
        res.json({ token });
      } else {
        res.status(401).json({ error: 'Invalid credentials' });
      }
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  });
});

// Create a car
app.post('/api/cars', authenticateToken, upload.array('images', 10), (req, res) => {
  const { title, description, car_type, company, dealer } = req.body;
  const userId = req.user.id;
  const images = req.files.map(file => file.filename);

  db.query(
    'INSERT INTO cars (user_id, title, description, car_type, company, dealer, images) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [userId, title, description, car_type, company, dealer, JSON.stringify(images)],
    (err, result) => {
      if (err) {
        res.status(500).json({ error: 'Error creating car' });
      } else {
        res.status(201).json({ message: 'Car created successfully', id: result.insertId });
      }
    }
  );
});

// Get all cars for a user
app.get('/api/cars', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const searchTerm = req.query.search || '';

  db.query(
    'SELECT * FROM cars WHERE user_id = ? AND (title LIKE ? OR description LIKE ? OR car_type LIKE ? OR company LIKE ? OR dealer LIKE ?)',
    [userId, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`],
    (err, results) => {
      if (err) {
        res.status(500).json({ error: 'Error fetching cars' });
      } else {
        res.json(results);
      }
    }
  );
});

// Get a specific car
app.get('/api/cars/:id', authenticateToken, (req, res) => {
  const carId = req.params.id;
  const userId = req.user.id;

  db.query('SELECT * FROM cars WHERE id = ? AND user_id = ?', [carId, userId], (err, results) => {
    if (err) {
      res.status(500).json({ error: 'Error fetching car' });
    } else if (results.length > 0) {
      res.json(results[0]);
    } else {
      res.status(404).json({ error: 'Car not found' });
    }
  });
});

// Update a car
app.put('/api/cars/:id', authenticateToken, upload.array('images', 10), (req, res) => {
  const carId = req.params.id;
  const userId = req.user.id;
  const { title, description, car_type, company, dealer } = req.body;
  const newImages = req.files.map(file => file.filename);

  db.query('SELECT images FROM cars WHERE id = ? AND user_id = ?', [carId, userId], (err, results) => {
    if (err) {
      res.status(500).json({ error: 'Error updating car' });
    } else if (results.length > 0) {
      const existingImages = JSON.parse(results[0].images);
      const updatedImages = [...existingImages, ...newImages].slice(0, 10);

      db.query(
        'UPDATE cars SET title = ?, description = ?, car_type = ?, company = ?, dealer = ?, images = ? WHERE id = ? AND user_id = ?',
        [title, description, car_type, company, dealer, JSON.stringify(updatedImages), carId, userId],
        (err, result) => {
          if (err) {
            res.status(500).json({ error: 'Error updating car' });
          } else {
            res.json({ message: 'Car updated successfully' });
          }
        }
      );
    } else {
      res.status(404).json({ error: 'Car not found' });
    }
  });
});

// Delete a car
app.delete('/api/cars/:id', authenticateToken, (req, res) => {
  const carId = req.params.id;
  const userId = req.user.id;

  db.query('DELETE FROM cars WHERE id = ? AND user_id = ?', [carId, userId], (err, result) => {
    if (err) {
      res.status(500).json({ error: 'Error deleting car' });
    } else if (result.affectedRows > 0) {
      res.json({ message: 'Car deleted successfully' });
    } else {
      res.status(404).json({ error: 'Car not found' });
    }
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});