import app from './app.js'; // Importamos la aplicación Express desde el archivo 'app.js' donde se ha configurado el servidor, las rutas y los middleware necesarios. Al importar esta aplicación, podremos iniciar el servidor y escuchar las solicitudes en un puerto específico. Esta separación entre la configuración de la aplicación (app.js) y el arranque del servidor (server.js) es una buena práctica que facilita el mantenimiento y la escalabilidad de la aplicación a medida que crece y se agregan más funcionalidades.
import pool from './config/db.js'; // Importamos el pool de conexiones a la base de datos desde el archivo 'db.js' para poder verificar la conexión a la base de datos cuando iniciamos el servidor. Esto nos permite asegurarnos de que el servidor puede comunicarse correctamente con la base de datos MySQL antes de comenzar a aceptar solicitudes. Al importar el pool aquí, también podemos realizar cualquier operación relacionada con la base de datos que necesitemos durante el arranque del servidor, como verificar la conexión o realizar consultas iniciales si es necesario.

const port = process.env.PORT || 3000; // Definimos el puerto en el que se ejecutará el servidor. Usamos 'process.env.PORT' para permitir que el puerto sea configurado a través de variables de entorno, lo cual es útil en entornos de producción donde el puerto puede ser asignado dinámicamente. Si no se proporciona un puerto a través de las variables de entorno, el servidor se ejecutará en el puerto 3000 por defecto. Esta flexibilidad en la configuración del puerto es importante para garantizar que nuestro servidor pueda adaptarse a diferentes entornos y requisitos de despliegue sin necesidad de modificar el código fuente.


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