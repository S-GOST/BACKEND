import express from 'express'; // Importamos Express para crear el router que manejará las rutas relacionadas con los productos. Este router define las rutas y las asocia con los controladores correspondientes para las operaciones CRUD (obtener, buscar por ID, insertar, actualizar y eliminar).
import { 
    obtenerProductos, 
    obtenerProductoPorId, 
    crearProducto, 
    actualizarProducto, 
    eliminarProducto,
    obtenerStockBajo 
} from '../controllers/productosController.js';

const router = express.Router(); // Creamos un router de Express para definir las rutas relacionadas con los productos. Este router se exportará para ser montado en el archivo principal (server.js), usualmente bajo una ruta como '/api/productos'.

// 1. Obtener todos los productos
router.get('/obtener', obtenerProductos); // Definimos la ruta GET '/obtener' asociada al controlador 'obtenerProductos'. Se utiliza para listar todos los productos del inventario. El controlador pedirá los datos al modelo y los devolverá al cliente en formato JSON.

// 2. Buscar producto por ID
router.get('/buscar/:id', obtenerProductoPorId); // Definimos la ruta GET '/buscar/:id'. El parámetro ':id' permite al cliente especificar qué producto desea consultar. El controlador 'obtenerProductoPorId' procesará la solicitud buscando la coincidencia exacta en la base de datos.

// 3. Insertar un nuevo producto
router.post('/insertar', crearProducto); // Definimos la ruta POST '/insertar' asociada al controlador 'crearProducto'. Se utiliza para registrar un nuevo producto enviando sus datos (nombre, precio, stock, etc.) en el cuerpo de la solicitud (req.body).

// 4. Actualizar producto existente
router.put('/actualizar', actualizarProducto); // Ruta alternativa para actualizar enviando el ID directamente en el cuerpo de la solicitud.
router.put('/actualizar/:id', actualizarProducto); // Definimos la ruta PUT '/actualizar/:id'. Se utiliza para modificar los datos de un producto existente. El controlador 'actualizarProducto' tomará el ID de la URL y los nuevos datos del cuerpo para aplicar los cambios en la base de datos.

// 5. Eliminar un producto
router.delete('/eliminar/:id', eliminarProducto); // Definimos la ruta DELETE '/eliminar/:id'. Esta ruta permite dar de baja un producto del sistema utilizando su ID único. El controlador 'eliminarProducto' ejecutará la instrucción de borrado en el modelo.

// 6. Ruta adicional (Opcional: Stock Bajo)
router.get('/stock-bajo', obtenerStockBajo); // Definimos una ruta específica para obtener productos que requieren reabastecimiento, demostrando cómo extender las funcionalidades del controlador.

export default router; // Exportamos el router para que pueda ser importado en 'server.js' y utilizado por la aplicación principal.