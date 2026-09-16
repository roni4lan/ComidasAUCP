# 🫔 Sistema de Pedidos AUCP

Sistema web completo de gestión de pedidos para rotisería/empanadas.  
Backend Node.js + Express · PostgreSQL · Frontend Vanilla HTML/CSS/JS

---

## 📋 Pantallas

| Pantalla | Ruta | Descripción |
|---|---|---|
| 📱 Tomar Pedido | `/tomar-pedido` | Interfaz táctil para tomar pedidos desde el celular |
| 🍳 Monitor Cocina | `/monitor` | Tablero de cocina con pedidos activos (actualiza cada 3s) |
| ⚙️ Administración | `/admin` | ABM de productos con imagen, precios |
| 📊 Dashboard | `/dashboard` | Estadísticas, gráficos y sugerencias (actualiza cada 10s) |

---

## 🚀 Cómo correr el proyecto

### Requisitos previos
- [Node.js](https://nodejs.org/) v18 o superior
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y corriendo

---

### Paso 1: Levantar la base de datos con Docker

```bash
docker-compose up -d
```

Esto crea un contenedor PostgreSQL con:
- **Host**: localhost:5432
- **Usuario**: admin
- **Contraseña**: admin123
- **Base de datos**: pedidos

Y ejecuta automáticamente `init.sql` con las tablas y 3 productos de ejemplo.

Para verificar que está corriendo:
```bash
docker ps
```

---

### Paso 2: Instalar dependencias del backend

```bash
cd backend
npm install
```

---

### Paso 3: Iniciar el servidor

```bash
npm start
```

O con auto-reload para desarrollo:
```bash
npm run dev
```

El servidor estará disponible en: **http://localhost:3000**

---

## 🌐 URLs disponibles

| URL | Descripción |
|---|---|
| http://localhost:3000/ | Redirige a Tomar Pedido |
| http://localhost:3000/tomar-pedido | 📱 Pantalla de pedidos |
| http://localhost:3000/monitor | 🍳 Monitor de cocina |
| http://localhost:3000/admin | ⚙️ Administración |
| http://localhost:3000/dashboard | 📊 Dashboard |

---

## 📡 API REST

### Productos — `/api/productos`

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/productos` | Listar productos activos |
| GET | `/api/productos/all` | Listar todos (incl. inactivos) |
| GET | `/api/productos/:id` | Obtener un producto |
| POST | `/api/productos` | Crear producto (multipart/form-data) |
| PUT | `/api/productos/:id` | Actualizar producto |
| DELETE | `/api/productos/:id` | Desactivar producto (soft delete) |

### Pedidos — `/api/pedidos`

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/pedidos` | Listar pedidos (query: `?estado=pendiente`) |
| GET | `/api/pedidos/monitor` | Solo pendientes y en preparación |
| GET | `/api/pedidos/:id` | Obtener un pedido |
| POST | `/api/pedidos` | Crear pedido |
| PATCH | `/api/pedidos/:id/estado` | Actualizar estado |
| DELETE | `/api/pedidos/:id` | Eliminar pedido |

### Estadísticas — `/api/estadisticas`

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/estadisticas?periodo=dia` | Estadísticas del día |
| GET | `/api/estadisticas?periodo=historico` | Estadísticas históricas |

---

## 🗃️ Estructura del proyecto

```
ComidasAUCP/
├── backend/
│   ├── index.js              ← Servidor Express principal
│   ├── db.js                 ← Conexión a PostgreSQL
│   ├── package.json
│   └── routes/
│       ├── productos.js      ← CRUD de productos
│       ├── pedidos.js        ← Gestión de pedidos
│       └── estadisticas.js   ← Estadísticas y rankings
├── frontend/
│   ├── shared.css            ← Sistema de diseño compartido
│   ├── tomar-pedido.html     ← 📱 Pantalla de pedidos (móvil)
│   ├── monitor.html          ← 🍳 Monitor de cocina
│   ├── admin.html            ← ⚙️ ABM productos
│   └── dashboard.html        ← 📊 Estadísticas (Chart.js)
├── init.sql                  ← Schema + datos de ejemplo
├── docker-compose.yml        ← Configuración Docker
└── README.md
```

---

## 🐳 Comandos Docker útiles

```bash
# Iniciar la DB
docker-compose up -d

# Detener la DB
docker-compose down

# Ver logs
docker-compose logs -f

# Eliminar todos los datos (¡cuidado!)
docker-compose down -v

# Conectarse a la DB directamente
docker exec -it pedidos-db psql -U admin -d pedidos
```

---

## 🎨 Características del diseño

- **Dark mode** con paleta de colores cuidada
- **Responsive** — funciona en móvil, tablet y TV
- **Micro-animaciones** en todas las interacciones
- **Colores de estado**: 🟡 Pendiente · 🟠 En preparación · 🟢 Entregado
- **Polling automático**: Monitor (3s) y Dashboard (10s)
- **Chart.js** para gráficos de barras y líneas

---

## ⚡ Variables de entorno (opcional)

Podés configurar el backend con variables de entorno:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=admin
DB_PASSWORD=admin123
DB_NAME=pedidos
PORT=3000
```

---

## 🛠️ Tecnologías

- **Backend**: Node.js + Express.js
- **Base de datos**: PostgreSQL 16 (Docker)
- **ORM/Query**: `pg` (node-postgres)
- **Upload**: Multer
- **Frontend**: HTML5 + CSS3 + JavaScript vanilla
- **Gráficos**: Chart.js 4.4 (CDN)
- **Fuentes**: Inter (Google Fonts)
