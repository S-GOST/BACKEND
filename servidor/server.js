import app from './app.js';
import pool from './config/db.js';

// ============================================================
// Manejo Global de Errores Críticos del Proceso
// ============================================================
process.on('uncaughtException', (err) => {
    console.error('❌ Excepción no capturada (uncaughtException):', err);
    process.exit(1); 
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promesa rechazada no manejada (unhandledRejection):', reason);
});

const port = process.env.PORT || 3000;


// Iniciar servidor
app.listen(port, () => {
    console.log(`✅ Servidor corriendo en http://localhost:${port}`);
});

// Verificar conexión a la base de datos
pool.getConnection()
    .then(connection => {
        console.log('✅ Conexión exitosa a la base de datos MySQL');
        connection.release();
    })
    .catch(err => {
        console.error('❌ Error al conectar a la base de datos:', err);
    });
    