const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:goFyK8zIAqV6hfwV@db.wyddlbaasbonhhzfxrmb.supabase.co:5432/postgres';

  console.log('Iniciando conexión con la base de datos Supabase...');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    await client.connect();
    console.log('Conexión establecida exitosamente.');

    const sqlPath = path.join(__dirname, '..', 'supabase', 'migrations', '0001_create_demostracion.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Aplicando migración SQL...');
    await client.query(sql);
    console.log('Migración aplicada con éxito.');

    const result = await client.query('SELECT id, nombre, cultivo, humedad_suelo, temperatura, estado FROM demostracion ORDER BY id ASC;');
    console.log(`Registros actuales en la tabla 'demostracion' (${result.rows.length}):`);
    console.table(result.rows);
  } catch (err) {
    console.error('Error durante la migración:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
