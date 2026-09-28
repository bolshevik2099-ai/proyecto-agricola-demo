const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:goFyK8zIAqV6hfwV@db.wyddlbaasbonhhzfxrmb.supabase.co:5432/postgres';

  console.log('Iniciando conexión con la base de datos Supabase...');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });

  try {
    await client.connect();
    console.log('Conexión establecida exitosamente con PostgreSQL.');

    const sqlPath = path.join(__dirname, '..', 'supabase', 'migrations', '0002_tamfresh_schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Aplicando migración del esquema de Tamfresh...');
    await client.query(sql);
    console.log('Migración de Tamfresh aplicada con éxito.');

    // Verificar tablas creadas
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log('Tablas actuales en la base de datos:');
    console.table(tablesRes.rows);

    // Verificar usuarios
    const usersRes = await client.query('SELECT id, nombre, rol, pin FROM usuarios;');
    console.log('Usuarios registrados:');
    console.table(usersRes.rows);

    // Verificar productos
    const prodRes = await client.query('SELECT id, nombre, variedad, unidad_base FROM productos;');
    console.log('Productos de berries registrados:');
    console.table(prodRes.rows);

    // Verificar empaques
    const empRes = await client.query('SELECT id, nombre, gramaje_g, material FROM empaque_tipos;');
    console.log('Tipos de empaque registrados:');
    console.table(empRes.rows);

    // Verificar vista de saldos
    const saldosRes = await client.query('SELECT cliente_nombre, empaque_nombre, saldo_disponible FROM vista_saldos_empaque WHERE saldo_disponible > 0;');
    console.log('Vista de saldos de empaque:');
    console.table(saldosRes.rows);

  } catch (err) {
    console.error('Error durante la migración:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
