import mysql from 'mysql2/promise'; // Libreria para manejar conexiones a MySQL con soporte para promesas//
import dotenv from 'dotenv'; // Cargar variables de entorno desde el archivo .env

dotenv.config(); // Configuración de la conexión a la base de datos MySQL utilizando variables de entorno para mayor seguridad y flexibilidad

const pool = mysql.createPool({ 
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sgost',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

export default pool;// Exportamos el pool de conexiones para que pueda ser utilizado en otras partes de la aplicación, como en los modelos y controladores. 