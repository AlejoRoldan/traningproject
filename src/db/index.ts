import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Crear cliente de postgres
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL no está definida en las variables de entorno');
}

const client = postgres(connectionString, {
  prepare: false,
});

// Crear instancia de Drizzle
export const db = drizzle(client, { schema });

export type Database = typeof db;
