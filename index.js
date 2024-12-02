const express = require('express');
const app = express();
const PORT = 3000;
const { Pool } = require('pg');
require('dotenv').config();

// PostgreSQL connection
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  });
  module.exports = pool;

app.use(express.json());

async function createTable() {
    try {
        await pool.query(
            `CREATE TABLE IF NOT EXISTS tasks (
            id SERIAL PRIMARY KEY,
            description TEXT NOT NULL,
            status TEXT NOT NULL
            );`
        );
        console.log("Table Created Successfully");
    } catch (error) {
        console.error("Table Couldn't Be Created", error)
    }
}
createTable();

// GET /tasks - Get all tasks
app.get('/tasks', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM tasks');
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// POST /tasks - Add a new task
app.post('/tasks', async (req, res) => {
    try {
        const { description, status } = req.body;
        if (!description || !status) {
            return res.status(400).json({ error: 'All Fields (Description, Status) Are Required'});
        }
        const result = await pool.query(
            'INSERT INTO tasks (description, status) VALUES ($1, $2) RETURNING *',
            [description, status]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// PUT /tasks/:id - Update a task's status
app.put('/tasks/:id', async (req, res) => {
    try {
        const taskId = parseInt(req.params.id, 10);
        const { status } = req.body;

        const result = await pool.query(
            'UPDATE tasks SET status = $1 WHERE id = $2 RETURNING *',
            [status, taskId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Task Not Found '});
        }
        res.json({ message: 'Task Updated Successfully', task: result.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// DELETE /tasks/:id - Delete a task
app.delete('/tasks/:id', async (req, res) => {
    try {
        const taskId = parseInt(req.params.id, 10);
        const result = await pool.query(
            'DELETE FROM tasks WHERE id = $1 RETURNING *',
            [taskId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Task Not Found'});
        }
        res.json({ message: 'Task Deleted Successfully'});
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
