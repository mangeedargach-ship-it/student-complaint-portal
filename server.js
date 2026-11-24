const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Walqunnamtii PostgreSQL (Local fi Cloud/Deploy lamaaniifuu)
const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      }
    : {
        user: 'postgres',
        host: 'localhost',
        database: 'complaint_db',
        password: '12345',
        port: 5432,
      }
);

// Yeroo deploy ta'u table 'complaints' yoo hin jiraanne ofumaan uuma
async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS complaints (
        id SERIAL PRIMARY KEY,
        student_name VARCHAR(100) NOT NULL,
        student_id VARCHAR(50) NOT NULL,
        department VARCHAR(100) NOT NULL,
        category VARCHAR(50) NOT NULL,
        description TEXT NOT NULL,
        status VARCHAR(30) DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Database table ready!');
  } catch (err) {
    console.error('Database initialization error:', err.message);
  }
}

initDatabase();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 2. Komii haaraa galmeessuu (Barataaf - POST)
app.post('/api/complaints', async (req, res) => {
  try {
    const { student_name, student_id, department, category, description } = req.body;

    if (!student_name || !student_id || !department || !category || !description) {
      return res.status(400).json({ error: 'Iddoowwan hundi guutamuu qabu!' });
    }

    const result = await pool.query(
      `INSERT INTO complaints (student_name, student_id, department, category, description)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [student_name, student_id, department, category, description]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Rakkoo serverii uumameera' });
  }
});

// 3. Komii hunda fiduu (Admin fi Barataaf - GET)
app.get('/api/complaints', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM complaints ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Rakkoo serverii uumameera' });
  }
});

// 4. Haala (Status) komii jijjiiruu (Admin qofaaf - PUT)
app.put('/api/complaints/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await pool.query(
      'UPDATE complaints SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Komiin kun hin argamne' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Rakkoo serverii uumameera' });
  }
});

// 5. Komii haquu (Admin qofaaf - DELETE)
app.delete('/api/complaints/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM complaints WHERE id = $1', [id]);
    res.json({ message: 'Komiin haqameera' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Rakkoo serverii uumameera' });
  }
});

// Server kaasuuf
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});