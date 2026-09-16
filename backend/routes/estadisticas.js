const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/estadisticas - Estadísticas completas
router.get('/', async (req, res) => {
  try {
    const { periodo } = req.query; // 'dia' o 'historico'
    const esDia = periodo !== 'historico';

    const fechaFiltro = esDia
      ? `AND DATE(p.created_at) = CURRENT_DATE`
      : '';

    // Total recaudado
    const { rows: totalRows } = await pool.query(`
      SELECT COALESCE(SUM(total), 0) as total_recaudado
      FROM pedidos p
      WHERE estado IN ('entregado', 'retirado') ${fechaFiltro}
    `);

    // Cantidad de pedidos entregados
    const { rows: pedidosRows } = await pool.query(`
      SELECT COUNT(*) as pedidos_entregados
      FROM pedidos p
      WHERE estado IN ('entregado', 'retirado') ${fechaFiltro}
    `);

    // Ticket promedio
    const { rows: ticketRows } = await pool.query(`
      SELECT COALESCE(AVG(total), 0) as ticket_promedio
      FROM pedidos p
      WHERE estado IN ('entregado', 'retirado') ${fechaFiltro}
    `);

    // Ranking de productos más vendidos (por cantidad de unidades)
    const { rows: rankingRows } = await pool.query(`
      SELECT 
        pr.id,
        pr.nombre,
        pr.imagen_url,
        COUNT(pi.id) as veces_pedido,
        SUM(
          CASE 
            WHEN pi.cantidad_tipo = 'media' THEN 6 * pi.cantidad
            WHEN pi.cantidad_tipo = 'docena' THEN 12 * pi.cantidad
            ELSE pi.cantidad
          END
        ) as unidades_vendidas,
        SUM(pi.precio_unitario * pi.cantidad) as total_generado
      FROM productos pr
      JOIN pedido_items pi ON pi.producto_id = pr.id
      JOIN pedidos p ON p.id = pi.pedido_id
      WHERE p.estado IN ('entregado', 'retirado') ${fechaFiltro}
      GROUP BY pr.id, pr.nombre, pr.imagen_url
      ORDER BY total_generado DESC
    `);

    // Pedidos por estado (hoy)
    const { rows: estadoRows } = await pool.query(`
      SELECT estado, COUNT(*) as cantidad
      FROM pedidos
      WHERE DATE(created_at) = CURRENT_DATE
      GROUP BY estado
    `);

    // Pedidos pendientes actuales
    const { rows: pendientesRows } = await pool.query(`
      SELECT COUNT(*) as pendientes_actuales
      FROM pedidos
      WHERE estado IN ('pendiente', 'en_preparacion')
    `);

    // Evolución de pedidos por hora (hoy)
    const { rows: evolucionRows } = await pool.query(`
      SELECT 
        EXTRACT(HOUR FROM created_at) as hora,
        COUNT(*) as cantidad,
        SUM(total) as total
      FROM pedidos
      WHERE DATE(created_at) = CURRENT_DATE AND estado IN ('entregado', 'retirado')
      GROUP BY hora
      ORDER BY hora ASC
    `);

    res.json({
      periodo: esDia ? 'dia' : 'historico',
      total_recaudado: parseFloat(totalRows[0].total_recaudado),
      pedidos_entregados: parseInt(pedidosRows[0].pedidos_entregados),
      ticket_promedio: parseFloat(ticketRows[0].ticket_promedio),
      pendientes_actuales: parseInt(pendientesRows[0].pendientes_actuales),
      ranking_productos: rankingRows.map((r) => ({
        ...r,
        total_generado: parseFloat(r.total_generado),
        unidades_vendidas: parseInt(r.unidades_vendidas),
        veces_pedido: parseInt(r.veces_pedido),
      })),
      pedidos_por_estado: estadoRows,
      evolucion_por_hora: evolucionRows.map((r) => ({
        hora: parseInt(r.hora),
        cantidad: parseInt(r.cantidad),
        total: parseFloat(r.total),
      })),
      producto_mas_rentable: rankingRows.length > 0 ? rankingRows[0] : null,
      sugerencia: rankingRows.length > 0
        ? generarSugerencia(rankingRows)
        : 'No hay datos suficientes para generar sugerencias.',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function generarSugerencia(ranking) {
  if (!ranking.length) return 'Sin datos disponibles.';

  const top = ranking[0];
  const totalGenerado = ranking.reduce((sum, p) => sum + parseFloat(p.total_generado), 0);
  const porcentaje = totalGenerado > 0
    ? ((parseFloat(top.total_generado) / totalGenerado) * 100).toFixed(0)
    : 0;

  return `🌟 "${top.nombre}" es tu producto estrella, generando el ${porcentaje}% de tus ingresos. ¡Considerá destacarlo en el menú o preparar stock extra!`;
}

module.exports = router;
