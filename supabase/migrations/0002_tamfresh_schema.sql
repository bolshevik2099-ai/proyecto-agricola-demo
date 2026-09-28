-- ==========================================================
-- SISTEMA TAMFRESH: ESQUEMA COMPLETO POSTGRESQL / SUPABASE
-- Comercializadora de Berries - Zamora, Michoacán
-- ==========================================================

-- 1. TABLA: USUARIOS Y PERFILES (RBAC)
CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  rol TEXT NOT NULL CHECK (rol IN ('admin', 'supervisor')),
  pin TEXT DEFAULT '1234',
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABLA: CATÁLOGO DINÁMICO DE PRODUCTOS (BERRIES Y VARIEDADES)
CREATE TABLE IF NOT EXISTS productos (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  variedad TEXT DEFAULT '',
  unidad_base TEXT DEFAULT 'kg',
  descripcion TEXT DEFAULT '',
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLA: CLIENTES (Compradores, exportadoras, recibidores de empaque)
CREATE TABLE IF NOT EXISTS clientes (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  contacto TEXT DEFAULT '',
  telefono TEXT DEFAULT '',
  ciudad TEXT DEFAULT 'Zamora',
  rfc TEXT DEFAULT '',
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLA: PROVEEDORES (Productores locales de huertas)
CREATE TABLE IF NOT EXISTS proveedores (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  contacto TEXT DEFAULT '',
  telefono TEXT DEFAULT '',
  ubicacion_huerta TEXT DEFAULT 'Valle de Zamora',
  tipo_berry_principal TEXT DEFAULT 'Arándano',
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABLA: TIPOS DE EMPAQUE (Material, gramaje, cajas máster, clamshells)
CREATE TABLE IF NOT EXISTS empaque_tipos (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  gramaje_g NUMERIC DEFAULT 0,
  material TEXT DEFAULT 'Plástico PET',
  capacidad_desc TEXT DEFAULT '',
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABLA: CONTROL DE MOVIMIENTOS DE EMPAQUE POR CLIENTE
CREATE TABLE IF NOT EXISTS empaque_movimientos (
  id SERIAL PRIMARY KEY,
  fecha TIMESTAMPTZ DEFAULT NOW(),
  cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  empaque_tipo_id INTEGER NOT NULL REFERENCES empaque_tipos(id) ON DELETE CASCADE,
  tipo_movimiento TEXT NOT NULL CHECK (tipo_movimiento IN ('entrada_cliente', 'salida_a_cliente', 'ajuste')),
  cantidad INTEGER NOT NULL,
  comprobante_url TEXT DEFAULT '',
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  notas TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABLA: COMPRAS DE PRODUCTO A PRODUCTORES
CREATE TABLE IF NOT EXISTS compras (
  id SERIAL PRIMARY KEY,
  folio TEXT DEFAULT '',
  fecha TIMESTAMPTZ DEFAULT NOW(),
  proveedor_id INTEGER NOT NULL REFERENCES proveedores(id) ON DELETE RESTRICT,
  producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
  unidad_medida TEXT NOT NULL DEFAULT 'kg',
  cantidad NUMERIC NOT NULL,
  precio_unitario NUMERIC NOT NULL,
  total NUMERIC NOT NULL,
  calidad TEXT DEFAULT 'Primera',
  comprobante_url TEXT DEFAULT '',
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  notas TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TABLA: VENTAS DE PRODUCTO A CLIENTES
CREATE TABLE IF NOT EXISTS ventas (
  id SERIAL PRIMARY KEY,
  folio TEXT DEFAULT '',
  fecha TIMESTAMPTZ DEFAULT NOW(),
  cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
  producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
  unidad_medida TEXT NOT NULL DEFAULT 'kg',
  cantidad NUMERIC NOT NULL,
  precio_unitario NUMERIC NOT NULL,
  total NUMERIC NOT NULL,
  empaque_tipo_id INTEGER REFERENCES empaque_tipos(id) ON DELETE SET NULL,
  cajas_descontadas INTEGER DEFAULT 0,
  estado TEXT DEFAULT 'entregado' CHECK (estado IN ('entregado', 'pendiente_pago', 'pagada', 'cancelada')),
  comprobante_url TEXT DEFAULT '',
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  notas TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. TABLAS: GASTOS OPERATIVOS Y CATEGORÍAS
CREATE TABLE IF NOT EXISTS gastos_categorias (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  icono TEXT DEFAULT 'DollarSign',
  activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS gastos (
  id SERIAL PRIMARY KEY,
  fecha TIMESTAMPTZ DEFAULT NOW(),
  categoria_id INTEGER NOT NULL REFERENCES gastos_categorias(id) ON DELETE RESTRICT,
  concepto TEXT NOT NULL,
  monto NUMERIC NOT NULL,
  metodo_pago TEXT DEFAULT 'Efectivo',
  comprobante_url TEXT DEFAULT '',
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  notas TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================================
-- VISTAS CALCULADAS PARA REPORTES Y RENDIMIENTO
-- ==========================================================

-- Vista: Saldos de empaque por cliente y tipo
CREATE OR REPLACE VIEW vista_saldos_empaque AS
SELECT 
  c.id AS cliente_id,
  c.nombre AS cliente_nombre,
  et.id AS empaque_tipo_id,
  et.nombre AS empaque_nombre,
  et.gramaje_g,
  et.material,
  COALESCE(SUM(CASE WHEN em.tipo_movimiento = 'entrada_cliente' THEN em.cantidad ELSE 0 END), 0) AS total_recibido,
  COALESCE(SUM(CASE WHEN em.tipo_movimiento = 'salida_a_cliente' THEN em.cantidad ELSE 0 END), 0) AS total_entregado,
  COALESCE(SUM(CASE WHEN em.tipo_movimiento = 'ajuste' THEN em.cantidad ELSE 0 END), 0) AS total_ajustes,
  COALESCE(SUM(CASE 
    WHEN em.tipo_movimiento = 'entrada_cliente' THEN em.cantidad 
    WHEN em.tipo_movimiento = 'salida_a_cliente' THEN -em.cantidad 
    WHEN em.tipo_movimiento = 'ajuste' THEN em.cantidad 
    ELSE 0 
  END), 0) AS saldo_disponible
FROM clientes c
CROSS JOIN empaque_tipos et
LEFT JOIN empaque_movimientos em ON em.cliente_id = c.id AND em.empaque_tipo_id = et.id
WHERE c.activo = TRUE AND et.activo = TRUE
GROUP BY c.id, c.nombre, et.id, et.nombre, et.gramaje_g, et.material;

-- ==========================================================
-- POLÍTICAS RLS (Row Level Security) - Acceso permitido
-- ==========================================================
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE empaque_tipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE empaque_movimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE compras ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE gastos_categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE gastos ENABLE ROW LEVEL SECURITY;

DO $$ 
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN (
    'usuarios', 'productos', 'clientes', 'proveedores', 'empaque_tipos', 
    'empaque_movimientos', 'compras', 'ventas', 'gastos_categorias', 'gastos'
  )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "permitir_todo_%s" ON %I;', tbl, tbl);
    EXECUTE format('CREATE POLICY "permitir_todo_%s" ON %I FOR ALL USING (true) WITH CHECK (true);', tbl, tbl);
  END LOOP;
END $$;

-- ==========================================================
-- DATOS SEMILLA INICIALES (TAMFRESH)
-- ==========================================================

-- Usuarios (Abram, Juan y Supervisor)
INSERT INTO usuarios (nombre, rol, pin)
SELECT 'Abram', 'admin', '1234'
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE nombre = 'Abram');

INSERT INTO usuarios (nombre, rol, pin)
SELECT 'Juan', 'admin', '1234'
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE nombre = 'Juan');

INSERT INTO usuarios (nombre, rol, pin)
SELECT 'Supervisor Bodega', 'supervisor', '1234'
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE nombre = 'Supervisor Bodega');

-- Productos iniciales
INSERT INTO productos (nombre, variedad, unidad_base, descripcion)
SELECT 'Arándano', 'Biloxi / Atlas', 'kg', 'Arándano fresco de exportación'
WHERE NOT EXISTS (SELECT 1 FROM productos WHERE nombre = 'Arándano' AND variedad = 'Biloxi / Atlas');

INSERT INTO productos (nombre, variedad, unidad_base, descripcion)
SELECT 'Fresa', 'Festival / San Andreas', 'kg', 'Fresa seleccionada zamorana'
WHERE NOT EXISTS (SELECT 1 FROM productos WHERE nombre = 'Fresa' AND variedad = 'Festival / San Andreas');

INSERT INTO productos (nombre, variedad, unidad_base, descripcion)
SELECT 'Zarzamora', 'Tupy / Clarita', 'kg', 'Zarzamora dulce de la región'
WHERE NOT EXISTS (SELECT 1 FROM productos WHERE nombre = 'Zarzamora');

INSERT INTO productos (nombre, variedad, unidad_base, descripcion)
SELECT 'Frambuesa', 'Heritage / Adelita', 'kg', 'Frambuesa roja fresca'
WHERE NOT EXISTS (SELECT 1 FROM productos WHERE nombre = 'Frambuesa');

INSERT INTO productos (nombre, variedad, unidad_base, descripcion)
SELECT 'Golden Berry', 'Uchuva Silvestre', 'kg', 'Uchuva / Golden berry seleccionada'
WHERE NOT EXISTS (SELECT 1 FROM productos WHERE nombre = 'Golden Berry');

INSERT INTO productos (nombre, variedad, unidad_base, descripcion)
SELECT 'Grosella', 'Roja Michoacana', 'kg', 'Grosella fresca para especialidades'
WHERE NOT EXISTS (SELECT 1 FROM productos WHERE nombre = 'Grosella');

-- Tipos de empaque iniciales
INSERT INTO empaque_tipos (nombre, gramaje_g, material, capacidad_desc)
SELECT 'Clamshell 125g (4.4 oz)', 125, 'Plástico PET', 'Típico para arándano y frambuesa'
WHERE NOT EXISTS (SELECT 1 FROM empaque_tipos WHERE nombre = 'Clamshell 125g (4.4 oz)');

INSERT INTO empaque_tipos (nombre, gramaje_g, material, capacidad_desc)
SELECT 'Clamshell 170g (6 oz)', 170, 'Plástico PET', 'Típico para zarzamora'
WHERE NOT EXISTS (SELECT 1 FROM empaque_tipos WHERE nombre = 'Clamshell 170g (6 oz)');

INSERT INTO empaque_tipos (nombre, gramaje_g, material, capacidad_desc)
SELECT 'Clamshell 250g', 250, 'Plástico PET', 'Presentación estándar mediana'
WHERE NOT EXISTS (SELECT 1 FROM empaque_tipos WHERE nombre = 'Clamshell 250g');

INSERT INTO empaque_tipos (nombre, gramaje_g, material, capacidad_desc)
SELECT 'Clamshell 454g (1 lb)', 454, 'Plástico PET', 'Estándar para fresa y arándano nacional/export'
WHERE NOT EXISTS (SELECT 1 FROM empaque_tipos WHERE nombre = 'Clamshell 454g (1 lb)');

INSERT INTO empaque_tipos (nombre, gramaje_g, material, capacidad_desc)
SELECT 'Caja Máster Cartón 12x125g', 1500, 'Cartón Corrugado', 'Caja master para 12 empaques de 125g'
WHERE NOT EXISTS (SELECT 1 FROM empaque_tipos WHERE nombre = 'Caja Máster Cartón 12x125g');

INSERT INTO empaque_tipos (nombre, gramaje_g, material, capacidad_desc)
SELECT 'Caja Máster Cartón 8x1 lb', 3632, 'Cartón Corrugado', 'Caja master para 8 clamshells de 1 lb'
WHERE NOT EXISTS (SELECT 1 FROM empaque_tipos WHERE nombre = 'Caja Máster Cartón 8x1 lb');

INSERT INTO empaque_tipos (nombre, gramaje_g, material, capacidad_desc)
SELECT 'Charola Plástica Plana de Cosecha', 0, 'Plástico Rígido', 'Charola retornable para campo/bodega'
WHERE NOT EXISTS (SELECT 1 FROM empaque_tipos WHERE nombre = 'Charola Plástica Plana de Cosecha');

-- Clientes iniciales
INSERT INTO clientes (nombre, contacto, telefono, ciudad)
SELECT 'BerryMex Exportaciones', 'Lic. Eduardo Gómez', '351-555-1020', 'Zamora'
WHERE NOT EXISTS (SELECT 1 FROM clientes WHERE nombre = 'BerryMex Exportaciones');

INSERT INTO clientes (nombre, contacto, telefono, ciudad)
SELECT 'Driscoll''s Jacona', 'Ing. Roberto Navarro', '351-555-3040', 'Jacona'
WHERE NOT EXISTS (SELECT 1 FROM clientes WHERE nombre = 'Driscoll''s Jacona');

INSERT INTO clientes (nombre, contacto, telefono, ciudad)
SELECT 'Distribuidora Frutícola del Bajío', 'Carlos Vega', '351-555-5060', 'Zamora'
WHERE NOT EXISTS (SELECT 1 FROM clientes WHERE nombre = 'Distribuidora Frutícola del Bajío');

-- Proveedores iniciales
INSERT INTO proveedores (nombre, contacto, telefono, ubicacion_huerta, tipo_berry_principal)
SELECT 'Rancho El Encino', 'Don Miguel Méndez', '351-555-7080', 'Tangancícuaro', 'Arándano'
WHERE NOT EXISTS (SELECT 1 FROM proveedores WHERE nombre = 'Rancho El Encino');

INSERT INTO proveedores (nombre, contacto, telefono, ubicacion_huerta, tipo_berry_principal)
SELECT 'Huerta San Juan', 'Pedro Morales', '351-555-8090', 'Ario de Rayón', 'Fresa'
WHERE NOT EXISTS (SELECT 1 FROM proveedores WHERE nombre = 'Huerta San Juan');

INSERT INTO proveedores (nombre, contacto, telefono, ubicacion_huerta, tipo_berry_principal)
SELECT 'Agrícola Los Pinos', 'Salvador Rios', '351-555-9010', 'Jacona', 'Zarzamora'
WHERE NOT EXISTS (SELECT 1 FROM proveedores WHERE nombre = 'Agrícola Los Pinos');

-- Categorías de gastos iniciales
INSERT INTO gastos_categorias (nombre, icono)
SELECT 'Combustible y Fletes', 'Truck'
WHERE NOT EXISTS (SELECT 1 FROM gastos_categorias WHERE nombre = 'Combustible y Fletes');

INSERT INTO gastos_categorias (nombre, icono)
SELECT 'Mano de Obra y Cuadrillas', 'Users'
WHERE NOT EXISTS (SELECT 1 FROM gastos_categorias WHERE nombre = 'Mano de Obra y Cuadrillas');

INSERT INTO gastos_categorias (nombre, icono)
SELECT 'Insumos de Empaque y Cintas', 'Package'
WHERE NOT EXISTS (SELECT 1 FROM gastos_categorias WHERE nombre = 'Insumos de Empaque y Cintas');

INSERT INTO gastos_categorias (nombre, icono)
SELECT 'Hielo y Cuarto Frío', 'Snowflake'
WHERE NOT EXISTS (SELECT 1 FROM gastos_categorias WHERE nombre = 'Hielo y Cuarto Frío');

INSERT INTO gastos_categorias (nombre, icono)
SELECT 'Mantenimiento y Reparaciones', 'Wrench'
WHERE NOT EXISTS (SELECT 1 FROM gastos_categorias WHERE nombre = 'Mantenimiento y Reparaciones');

INSERT INTO gastos_categorias (nombre, icono)
SELECT 'Servicios y Renta de Bodega', 'Building'
WHERE NOT EXISTS (SELECT 1 FROM gastos_categorias WHERE nombre = 'Servicios y Renta de Bodega');

INSERT INTO gastos_categorias (nombre, icono)
SELECT 'Otros Gastos Generales', 'DollarSign'
WHERE NOT EXISTS (SELECT 1 FROM gastos_categorias WHERE nombre = 'Otros Gastos Generales');

-- Registros semilla de ejemplo en empaque_movimientos para demostración inicial
INSERT INTO empaque_movimientos (cliente_id, empaque_tipo_id, tipo_movimiento, cantidad, notas)
SELECT 1, 1, 'entrada_cliente', 5000, 'Entrega inicial de clamshells 125g por cliente BerryMex'
WHERE NOT EXISTS (SELECT 1 FROM empaque_movimientos LIMIT 1);

INSERT INTO empaque_movimientos (cliente_id, empaque_tipo_id, tipo_movimiento, cantidad, notas)
SELECT 1, 5, 'entrada_cliente', 400, 'Entrega de cajas master 12x125g por BerryMex'
WHERE (SELECT COUNT(*) FROM empaque_movimientos) = 1;

INSERT INTO empaque_movimientos (cliente_id, empaque_tipo_id, tipo_movimiento, cantidad, notas)
SELECT 2, 4, 'entrada_cliente', 3000, 'Recepción de clamshells 1 lb para temporada de fresa'
WHERE (SELECT COUNT(*) FROM empaque_movimientos) = 2;
