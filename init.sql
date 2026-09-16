-- ============================================
-- INIT SQL - Sistema de Pedidos AUCP
-- ============================================

-- Tabla de productos
CREATE TABLE IF NOT EXISTS productos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    imagen_url TEXT,
    precio_media DECIMAL(10,2) NOT NULL,
    precio_docena DECIMAL(10,2) NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de pedidos
CREATE TABLE IF NOT EXISTS pedidos (
    id SERIAL PRIMARY KEY,
    nombre_cliente VARCHAR(100) NOT NULL,
    total DECIMAL(10,2) NOT NULL DEFAULT 0,
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_preparacion', 'entregado', 'retirado')),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de items de pedidos
CREATE TABLE IF NOT EXISTS pedido_items (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER REFERENCES pedidos(id) ON DELETE CASCADE,
    producto_id INTEGER REFERENCES productos(id),
    cantidad_tipo VARCHAR(20) NOT NULL CHECK (cantidad_tipo IN ('media', 'docena')),
    precio_unitario DECIMAL(10,2) NOT NULL,
    cantidad INTEGER NOT NULL DEFAULT 1
);

-- ============================================
-- DATOS DE EJEMPLO
-- ============================================

INSERT INTO productos (nombre, imagen_url, precio_media, precio_docena) VALUES
(
    'Empanadas de Carne',
    'https://images.unsplash.com/photo-1604467794349-0b74285de7e7?w=400&q=80',
    1800.00,
    3200.00
),
(
    'Empanadas de Jamón y Queso',
    'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&q=80',
    1600.00,
    2900.00
),
(
    'Empanadas de Verdura',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80',
    1500.00,
    2700.00
);

-- Pedidos de ejemplo
INSERT INTO pedidos (nombre_cliente, total, estado, created_at) VALUES
('María García', 6400.00, 'entregado', NOW() - INTERVAL '2 hours'),
('Juan Pérez', 3200.00, 'entregado', NOW() - INTERVAL '1 hour'),
('Laura Martínez', 4700.00, 'pendiente', NOW() - INTERVAL '5 minutes');

-- Items de pedidos de ejemplo
INSERT INTO pedido_items (pedido_id, producto_id, cantidad_tipo, precio_unitario, cantidad) VALUES
(1, 1, 'docena', 3200.00, 2),
(2, 2, 'docena', 2900.00, 1),
(3, 1, 'media', 1800.00, 1),
(3, 3, 'media', 1500.00, 1),
(3, 2, 'media', 1600.00, 1);
