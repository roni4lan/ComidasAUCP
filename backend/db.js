const { Pool, types } = require('pg');

// Configurar pg para que interprete TIMESTAMP sin zona horaria (OID 1114) como UTC
types.setTypeParser(1114, function(stringValue) {
  return new Date(stringValue.replace(' ', 'T') + 'Z');
});

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5434,
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'admin123',
  database: process.env.DB_NAME || 'pedidos',
});

pool.on('error', (err) => {
  console.error('Error inesperado en el pool de PostgreSQL:', err);
});

// Test connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Error al conectar con la base de datos:', err.message);
  } else {
    console.log('✅ Conectado a PostgreSQL:', res.rows[0].now);
  }
});

module.exports = pool;
