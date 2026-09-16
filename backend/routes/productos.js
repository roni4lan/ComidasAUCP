const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../db');

// Configurar multer para uploads de imágenes
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes'));
    }
  },
});

// GET /api/productos - Listar todos los productos activos
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM productos WHERE activo = TRUE ORDER BY nombre ASC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/productos/all - Listar todos incluyendo inactivos (para admin)
router.get('/all', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM productos ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/productos/:id - Obtener un producto
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM productos WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/productos - Crear producto
router.post('/', upload.single('imagen'), async (req, res) => {
  try {
    const { nombre, imagen_url, precio_media, precio_docena } = req.body;
    let finalImageUrl = imagen_url || null;

    if (req.file) {
      finalImageUrl = `/uploads/${req.file.filename}`;
    }

    if (!nombre || !precio_media || !precio_docena) {
      return res.status(400).json({ error: 'Nombre, precio media y precio docena son requeridos' });
    }

    const { rows } = await pool.query(
      `INSERT INTO productos (nombre, imagen_url, precio_media, precio_docena) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [nombre, finalImageUrl, parseFloat(precio_media), parseFloat(precio_docena)]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/productos/:id - Actualizar producto
router.put('/:id', upload.single('imagen'), async (req, res) => {
  try {
    const { nombre, imagen_url, precio_media, precio_docena, activo } = req.body;
    
    // Obtener producto actual
    const current = await pool.query('SELECT * FROM productos WHERE id = $1', [req.params.id]);
    if (!current.rows.length) return res.status(404).json({ error: 'Producto no encontrado' });
    
    let finalImageUrl = imagen_url !== undefined ? imagen_url : current.rows[0].imagen_url;
    if (req.file) {
      finalImageUrl = `/uploads/${req.file.filename}`;
    }

    const { rows } = await pool.query(
      `UPDATE productos SET 
        nombre = COALESCE($1, nombre),
        imagen_url = $2,
        precio_media = COALESCE($3, precio_media),
        precio_docena = COALESCE($4, precio_docena),
        activo = COALESCE($5, activo)
       WHERE id = $6 RETURNING *`,
      [
        nombre || null,
        finalImageUrl,
        precio_media ? parseFloat(precio_media) : null,
        precio_docena ? parseFloat(precio_docena) : null,
        activo !== undefined ? (activo === 'true' || activo === true) : null,
        req.params.id,
      ]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/productos/:id - Eliminar (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'UPDATE productos SET activo = FALSE WHERE id = $1 RETURNING *',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ message: 'Producto eliminado correctamente', producto: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/productos/:id/hard - Eliminar permanente
router.delete('/:id/hard', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'DELETE FROM productos WHERE id = $1 RETURNING *',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ message: 'Producto eliminado permanentemente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
