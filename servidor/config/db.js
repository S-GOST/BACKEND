import mysql from 'mysql2/promise'; // Libreria para manejar conexiones a MySQL con soporte para promesas//
import dotenv from 'dotenv'; // Cargar variables de entorno desde el archivo .env
import { fileURLToPath } from 'url';

dotenv.config({
    path: fileURLToPath(new URL('./.env', import.meta.url))
}); // Cargamos el archivo .env de esta carpeta para que funcione sin depender del directorio de ejecución

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sgost',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

export default pool; // Exportamos el pool de conexiones para que pueda ser utilizado en otras partes de la aplicación
