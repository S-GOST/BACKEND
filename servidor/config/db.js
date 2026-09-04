import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// ---------------------------------------------------------
// CORRECCIÓN 1: Cargar .env desde la RAÍZ del proyecto
// ---------------------------------------------------------
// Obtenemos la ruta absoluta de la carpeta raíz (subimos un nivel desde 'config')
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..'); 

// Cargamos dotenv apuntando a la raíz. 
dotenv.config({ path: path.join(projectRoot, '.env') });

// ---------------------------------------------------------
// CORRECCIÓN 2: Configuración del Pool
// ---------------------------------------------------------
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: false
  }
});


export default pool;