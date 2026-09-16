const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3005;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Servir uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rutas API
app.use('/api/productos', require('./routes/productos'));
app.use('/api/pedidos', require('./routes/pedidos'));
app.use('/api/estadisticas', require('./routes/estadisticas'));

// Rutas del frontend
app.get('/', (req, res) => {
  res.redirect('/tomar-pedido.html');
});

app.get('/tomar-pedido', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/tomar-pedido.html'));
});

app.get('/monitor', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/monitor.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/admin.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dashboard.html'));
});

app.get('/retirar', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/retirar.html'));
});

app.get('/cliente', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/cliente.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno del servidor', details: err.message });
});

const os = require('os');

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);

  // Obtener IPs locales para facilitar la conexión desde el celular
  const networkInterfaces = os.networkInterfaces();
  console.log('\n📱 Para conectarte desde el celular (en la misma red Wi-Fi):');
  for (const name of Object.keys(networkInterfaces)) {
    for (const net of networkInterfaces[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        console.log(`   👉 http://${net.address}:${PORT}/tomar-pedido`);
      }
    }
  }

  console.log(`\n🍳 Monitor Cocina: http://localhost:${PORT}/monitor`);
  console.log(`⚙️  Administración: http://localhost:${PORT}/admin`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard`);
});
