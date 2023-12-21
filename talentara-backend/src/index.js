const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = 8080;

app.use(cors());
app.use(bodyParser.json());

const db = mysql.createConnection({
  host: process.env.DB_HOSTNAME ,
  user: process.env.DB_USERNAME ,
  password: process.env.DB_PASSWORD ,
  database: process.env.DB_NAME ,
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to database:', err);
    return;
  }
  console.log('Connected to database');
});


app.post('/signup', (req, res) => {
  const { name, email, password,role } = req.body;

  db.query(
    'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
    [name, email, password, role],
    (err, results) => {
      if (err) {
        console.log(err)
        return res.status(500).json({ error: 'Internal Server Error' });
      }
      res.status(201).json({ message: 'User registered successfully' });
    }
  );
});

// Route untuk signin
app.put('/signin', (req, res) => {
  const { email, password } = req.body;

  db.query(
    'SELECT * FROM users WHERE email = ? AND password = ?',
    [email, password],
    (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Internal Server Error' });
      }

      if (results.length > 0) {
        // Mengambil ID dari hasil query
        const userId = results[0].id;

        // Buat token JWT dengan menyertakan ID
        const token = jwt.sign({ id: userId, email: email, role: results[0].role }, 'your_secret_key', { expiresIn: '1h' });

        res.json({ token: token });
      } else {
        res.status(401).json({ error: 'Invalid credentials' });
      }
    }
  );
});

// Middleware untuk memverifikasi token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    console.log('Token is missing');
    return res.status(403).json({ error: 'Unauthorized: Token is missing' });
  }

  // Extract the expiration time from the token
  const tokenBody = jwt.decode(token.split(' ')[1]);

  // Check if the token has expired
  if (tokenBody.exp < Date.now() / 1000) {
    console.error('Error verifying token:', 'TokenExpiredError: jwt expired');
    return res.status(403).json({ error: 'Unauthorized: Token has expired' });
  }

  // Verify the token
  jwt.verify(token.split(' ')[1], 'your_secret_key', (err, decoded) => {
    if (err) {
      console.error('Error verifying token:', err);
      return res.status(403).json({ error: 'Unauthorized: Failed to verify token' });
    }
    console.log('Token verified successfully:', decoded);
    req.user = decoded;
    next();
  });
};


// Route untuk profile_detail
app.get('/profile_detail', verifyToken, (req, res) => {
  // Dapatkan data user dari token
  const { email, role } = req.user;

  db.query(
    'SELECT name, email, role FROM users WHERE email = ? AND role = ?',
    [email, role],
    (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Internal Server Error' });
      }
      res.json(results[0]);
    }
  );
});

// Route untuk profile_detail
app.put('/profile_detail', verifyToken, (req, res) => {
  const { name, email, role, bahasa_program, linkedin_link, github_link } = req.body;

  const updateUserQuery = 'UPDATE users SET name = ?, role = ? WHERE email = ?';
  db.query(updateUserQuery, [name, role, email], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    res.json({ message: 'Profile updated successfully' });
  });
});

// Route untuk menambahkan proyek baru
app.post('/project', verifyToken, (req, res) => {
  const {
    name,
    description,
    duration,
    deadline,
    price,
    role,
    amount_per_role,
    SKPL_doc,
    Kontrak_doc,
    github_link,
    contract_doc,
    status
  } = req.body;

  // Ambil user_id dari decoded token
  const user_id = req.user.id;

  const insertProjectQuery = `
    INSERT INTO projects (name, description, duration, deadline, price, role, amount_per_role, SKPL_doc, Kontrak_doc, github_link, contract_doc, status, user_id) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  // Log before the database query
  console.log('Executing database query to insert project...');

  db.query(
    insertProjectQuery,
    [
      name,
      description,
      duration,
      deadline,
      price,
      role,
      amount_per_role,
      SKPL_doc,
      Kontrak_doc,
      github_link,
      contract_doc,
      status,
      user_id
    ],
    (err, results) => {
      // Log after the database query
      console.log('Database query executed.');

      if (err) {
        console.error('Error inserting project:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
      console.log('Project inserted successfully:', results);
      res.status(201).json({ message: 'Project added successfully' });
    }
  );
});


// Route untuk melihat detail proyek
app.get('/project', verifyToken, (req, res) => {
  // Dapatkan data user dari token
  const { id } = req.user; // Extract user ID from the token payload

  // Query to select projects for the authenticated user
  const selectProjectQuery = `SELECT * FROM projects WHERE user_id = ?`;

  db.query(selectProjectQuery, [id], (err, results) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    res.json(results);
  });
});


// Route untuk mengubah status proyek menjadi "On going" atau "Done"
app.put('/project/:id', verifyToken, (req, res) => {
  const projectId = req.params.id;
  const { status } = req.body;

  // Validasi status, hanya menerima "On going" atau "Done"
  if (status !== 'On going' && status !== 'Done') {
    return res.status(400).json({ error: 'Invalid status value. Please use "On going" or "Done".' });
  }

  // Periksa apakah project dengan ID tertentu ada di database
  const checkProjectQuery = 'SELECT * FROM projects WHERE id = ?';
  db.query(checkProjectQuery, [projectId], (checkErr, checkResults) => {
    if (checkErr) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    // Jika project dengan ID tertentu tidak ditemukan, kirim pesan error
    if (checkResults.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Jika project dengan ID tertentu ditemukan, lanjutkan dengan mengupdate status
    const updateProjectQuery = 'UPDATE projects SET status = ? WHERE id = ?';
    db.query(updateProjectQuery, [status, projectId], (updateErr, updateResults) => {
      if (updateErr) {
        return res.status(500).json({ error: 'Internal Server Error' });
      }
      res.json({ message: 'Project status updated successfully' });
    });
  });
});

// Jalankan server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`); 
});
