const express = require('express');
const mysql = require('mysql');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'Usuarios'
});

db.connect(error => {
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  console.log('✅ Conectado a la base de datos MySQL');
});

// --- OPERACIONES CRUD PARA LA TABLA 'usuario' ---

// 1. OBTENER TODOS LOS USUARIOS (GET)
app.get('/api/usuarios/obtener', (req, res) => {
  // Nota: En producción, evita enviar el 'password' en un GET general
  const sql = 'SELECT id, nombre, email FROM usuario'; 
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// 2. CREAR UN USUARIO (POST)
app.post('/api/usuarios/insertar', (req, res) => {
  const { nombre, email, password } = req.body;
  const sql = 'INSERT INTO usuario (nombre, email, password) VALUES (?, ?, ?)';
  
  db.query(sql, [nombre, email, password], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ 
      mensaje: 'Usuario registrado con éxito', 
      id: result.insertId 
    });
  });
});

// 3. ACTUALIZAR UN USUARIO (PUT)
app.put('/api/usuarios/actualizar/:id', (req, res) => {
  const { id } = req.params;
  const { nombre, email, password } = req.body;
  const sql = 'UPDATE usuario SET nombre = ?, email = ?, password = ? WHERE id = ?';

  db.query(sql, [nombre, email, password, id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    res.json({ mensaje: 'Datos del usuario actualizados' });
  });
});

// 4. ELIMINAR UN USUARIO (DELETE)
app.delete('/api/usuarios/eliminar/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM usuario WHERE id = ?';

  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ mensaje: `Usuario con ID ${id} eliminado correctamente` });
  });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});