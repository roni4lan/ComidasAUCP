const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/pedidos - Listar pedidos (con filtros opcionales)
router.get('/', async (req, res) => {
  try {
    const { estado } = req.query;
    let query = `
      SELECT 
        p.*,
        json_agg(
          json_build_object(
            'id', pi.id,
            'producto_id', pi.producto_id,
            'producto_nombre', pr.nombre,
            'producto_imagen', pr.imagen_url,
            'cantidad_tipo', pi.cantidad_tipo,
            'precio_unitario', pi.precio_unitario,
            'cantidad', pi.cantidad
          ) ORDER BY pi.id
        ) as items
      FROM pedidos p
      LEFT JOIN pedido_items pi ON pi.pedido_id = p.id
      LEFT JOIN productos pr ON pr.id = pi.producto_id
    `;

    const params = [];
    if (estado) {
      query += ` WHERE p.estado = $1`;
      params.push(estado);
    }

    query += ` GROUP BY p.id ORDER BY p.created_at DESC`;

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/pedidos/monitor - Solo pendientes y en preparación
router.get('/monitor', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        p.*,
        json_agg(
          json_build_object(
            'id', pi.id,
            'producto_nombre', pr.nombre,
            'cantidad_tipo', pi.cantidad_tipo,
            'precio_unitario', pi.precio_unitario,
            'cantidad', pi.cantidad
          ) ORDER BY pi.id
        ) as items
      FROM pedidos p
      LEFT JOIN pedido_items pi ON pi.pedido_id = p.id
      LEFT JOIN productos pr ON pr.id = pi.producto_id
      WHERE p.estado IN ('pendiente', 'en_preparacion')
      GROUP BY p.id
      ORDER BY p.created_at ASC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/pedidos/:id - Obtener un pedido
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        p.*,
        json_agg(
          json_build_object(
            'id', pi.id,
            'producto_id', pi.producto_id,
            'producto_nombre', pr.nombre,
            'cantidad_tipo', pi.cantidad_tipo,
            'precio_unitario', pi.precio_unitario,
            'cantidad', pi.cantidad
          )
        ) as items
      FROM pedidos p
      LEFT JOIN pedido_items pi ON pi.pedido_id = p.id
      LEFT JOIN productos pr ON pr.id = pi.producto_id
      WHERE p.id = $1
      GROUP BY p.id
    `, [req.params.id]);

    if (!rows.length) return res.status(404).json({ error: 'Pedido no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/pedidos - Crear nuevo pedido
router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { nombre_cliente, items } = req.body;

    if (!nombre_cliente || !items || !items.length) {
      return res.status(400).json({ error: 'Nombre del cliente e items son requeridos' });
    }

    // Calcular total
    let total = 0;
    const itemsConPrecios = [];

    for (const item of items) {
      const { rows: prodRows } = await client.query(
        'SELECT * FROM productos WHERE id = $1 AND activo = TRUE',
        [item.producto_id]
      );

      if (!prodRows.length) {
        throw new Error(`Producto ${item.producto_id} no encontrado o inactivo`);
      }

      const prod = prodRows[0];
      const precio = item.cantidad_tipo === 'media' ? prod.precio_media : prod.precio_docena;
      const subtotal = precio * (item.cantidad || 1);
      total += subtotal;

      itemsConPrecios.push({
        producto_id: item.producto_id,
        cantidad_tipo: item.cantidad_tipo,
        precio_unitario: precio,
        cantidad: item.cantidad || 1,
      });
    }

    // Crear pedido
    const { rows: pedidoRows } = await client.query(
      `INSERT INTO pedidos (nombre_cliente, total, estado) VALUES ($1, $2, 'pendiente') RETURNING *`,
      [nombre_cliente.trim(), total]
    );

    const pedido = pedidoRows[0];

    // Insertar items
    for (const item of itemsConPrecios) {
      await client.query(
        `INSERT INTO pedido_items (pedido_id, producto_id, cantidad_tipo, precio_unitario, cantidad)
         VALUES ($1, $2, $3, $4, $5)`,
        [pedido.id, item.producto_id, item.cantidad_tipo, item.precio_unitario, item.cantidad]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ ...pedido, items: itemsConPrecios });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// PATCH /api/pedidos/:id/estado - Actualizar estado
router.patch('/:id/estado', async (req, res) => {
  try {
    const { estado } = req.body;
    const estadosValidos = ['pendiente', 'en_preparacion', 'entregado', 'retirado'];

    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ error: 'Estado inválido. Use: pendiente, en_preparacion, entregado, retirado' });
    }

    const { rows } = await pool.query(
      'UPDATE pedidos SET estado = $1 WHERE id = $2 RETURNING *',
      [estado, req.params.id]
    );

    if (!rows.length) return res.status(404).json({ error: 'Pedido no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/pedidos/:id - Eliminar pedido
router.delete('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'DELETE FROM pedidos WHERE id = $1 RETURNING *',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Pedido no encontrado' });
    res.json({ message: 'Pedido eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
