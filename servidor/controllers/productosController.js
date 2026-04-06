// Cambiamos 'productos' por 'Producto' para que coincida con el resto del archivo
import Producto from "../models/productosModel.js"; 
import pool from "../config/db.js"; 

// Obtener todos los productos
export const obtenerProductos = async (req, res) => {
    try {
        // Ahora sí, 'Producto' ya está definido arriba
        const filas = await Producto.findAll(); 
        res.json({ success: true, data: filas });
    } catch (error) {
        console.error("Error al obtener productos:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// ... el resto de tu código está bien porque usa 'Producto'

// Obtener un producto por su ID
export const obtenerProductoPorId = async (req, res) => {
    const { id } = req.params;
    try {
        // Uso de pool directo para búsqueda específica por ID (evitando inyección SQL)
        const [rows] = await pool.query('SELECT * FROM productos WHERE ID_PRODUCTOS = ?', [id]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Producto no encontrado' });
        }

        res.json({ success: true, data: rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Crear un nuevo producto
export const crearProducto = async (req, res) => {
    try {
        // Se asume que req.body contiene los campos necesarios (Nombre, Precio, Stock, etc.)
        const nuevoProducto = await Producto.create(req.body);    
        res.json({ success: true, data: nuevoProducto });
    } catch (error) {
        console.error("Error al crear producto:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Actualizar un producto existente
export const actualizarProducto = async (req, res) => {
    // Intentamos obtener el ID de los parámetros o del body (fallback)
    const id = req.params.id || req.body.ID_PRODUCTO_ORIGINAL;

    if (!id) {
        return res.status(400).json({ success: false, message: 'ID del producto no proporcionado' });
    }

    try {
        const productoActualizado = await Producto.update(id, req.body);  
        res.json({ success: true, data: productoActualizado });
    } catch (error) {
        console.error("Error al actualizar producto:", error);
        res.status(500).json({ success: false, error: error.message });
    }   
};

// Eliminar un producto
export const eliminarProducto = async (req, res) => {
    const { id } = req.params;
    try {
        await Producto.delete(id);
        res.json({ success: true, message: 'Producto eliminado correctamente' });
    } catch (error) {
        console.error("Error al eliminar producto:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Ejemplo de consulta específica: Obtener productos con poco stock
export const obtenerStockBajo = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM productos WHERE stock < 5');
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};