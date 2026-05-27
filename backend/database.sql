-- ══════════════════════════════════════════
-- LONCHO DB — Script completo
-- ══════════════════════════════════════════

-- Tabla usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id          SERIAL PRIMARY KEY,
  nombre      VARCHAR(100) NOT NULL,
  email       VARCHAR(150) NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabla productos
CREATE TABLE IF NOT EXISTS productos (
  id          SERIAL PRIMARY KEY,
  nombre      VARCHAR(150) NOT NULL,
  precio      DECIMAL(10,2) NOT NULL,
  stock       INTEGER NOT NULL DEFAULT 0,
  en_stock    BOOLEAN NOT NULL DEFAULT false,
  categoria   VARCHAR(80) NOT NULL,
  image_url   TEXT,
  descripcion TEXT,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabla carrito
CREATE TABLE IF NOT EXISTS carrito (
  id          SERIAL PRIMARY KEY,
  usuario_id  INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  cantidad    INTEGER NOT NULL DEFAULT 1,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(usuario_id, producto_id)
);

-- Tabla pedidos
CREATE TABLE IF NOT EXISTS pedidos (
  id              SERIAL PRIMARY KEY,
  usuario_id      INTEGER REFERENCES usuarios(id),
  status          VARCHAR(50) NOT NULL DEFAULT 'CREADO',
  subtotal        DECIMAL(10,2) NOT NULL,
  iva             DECIMAL(10,2) NOT NULL,
  total           DECIMAL(10,2) NOT NULL,
  paypal_order_id VARCHAR(100),
  paypal_status   VARCHAR(50),
  created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabla pedido_items
CREATE TABLE IF NOT EXISTS pedido_items (
  id          SERIAL PRIMARY KEY,
  pedido_id   INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  producto_id INTEGER NOT NULL REFERENCES productos(id),
  nombre      VARCHAR(150) NOT NULL,
  precio      DECIMAL(10,2) NOT NULL,
  cantidad    INTEGER NOT NULL,
  subtotal    DECIMAL(10,2) NOT NULL
);

-- Índices para optimizar consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria);
CREATE INDEX IF NOT EXISTS idx_productos_en_stock  ON productos(en_stock);
CREATE INDEX IF NOT EXISTS idx_carrito_usuario     ON carrito(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_usuario     ON pedidos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_status      ON pedidos(status);

-- Datos iniciales de productos
INSERT INTO productos (nombre, precio, stock, en_stock, categoria, image_url, descripcion) VALUES
('Hoodie Oversized Negro',  699.00, 15, true,  'Hoodies',    'https://images.unsplash.com/photo-1578681994506-b8f463449011?w=400&h=500&fit=crop', 'Hoodie oversized de algodón pesado 380gsm, corte dropped shoulder.'),
('Cargo Pants Gris',        849.00, 12, true,  'Pantalones', 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400&h=500&fit=crop', 'Pantalón cargo de sarga con 6 bolsillos funcionales. Ajuste relajado.'),
('Tee Gráfica Loncho',      399.00, 20, true,  'Camisetas',  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=500&fit=crop', 'Camiseta unisex de algodón 200gsm con gráfica exclusiva. Corte boxy.'),
('Jogger Fleece Crema',     599.00, 12, true,  'Pantalones', 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=400&h=500&fit=crop', 'Jogger de fleece cepillado interior, puños acanalados.'),
('Bomber Jacket Negra',    1299.00,  8, true,  'Chamarras',  'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&h=500&fit=crop', 'Bomber de nylon con forro satinado, ribetes acanalados.'),
('Longsleeve Waffle Gris',  449.00, 20, true,  'Camisetas',  'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400&h=500&fit=crop', 'Manga larga de tejido waffle con cuello redondo.'),
('Gorra Dad Hat Loncho',    299.00, 25, true,  'Accesorios', 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400&h=500&fit=crop', 'Dad hat no estructurada con bordado frontal de Loncho.'),
('Hoodie Zip Rojo',         749.00,  0, false, 'Hoodies',    'https://images.unsplash.com/photo-1509942774463-acf339cf87d5?w=400&h=500&fit=crop', 'Hoodie con cierre completo, capucha ajustable y bolsillo canguro.'),
('Shorts Cargo Arena',      499.00, 10, true,  'Shorts',     'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=400&h=500&fit=crop', 'Short cargo por encima de la rodilla con bolsillos laterales.'),
('Tote Bag Loncho',         199.00, 30, true,  'Accesorios', 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=400&h=500&fit=crop', 'Tote bag de lona 100% algodón con serigrafía de Loncho.');
