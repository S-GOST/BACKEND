// Importamos el modelo Producto (asegúrate que la ruta y el export sean correctos)
import Producto from "../models/productosModel.js";

// Obtener todos los productos
export const obtenerProductos = async (req, res) => {
    try {
        const productos = await Producto.findAll();
        res.json({ success: true, data: productos });
    } catch (error) {
        console.error("Error al obtener productos:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Obtener un producto por su ID
export const obtenerProductoPorId = async (req, res) => {
    const { id } = req.params;
    try {
        const producto = await Producto.findById(id);
        if (!producto) {
            return res.status(404).json({ success: false, message: 'Producto no encontrado' });
        }
        res.json({ success: true, data: producto });
    } catch (error) {
        console.error("Error al obtener producto por ID:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Crear un nuevo producto
export const crearProducto = async (req, res) => {
    try {
        // req.body debe incluir: ID, PRODUCTOS, CATEGORIA, MARCA, NOMBRE, GARANTÍA, PRECIO, CANTIDAD, ESTADO
        const resultado = await Producto.create(req.body);
        res.status(201).json({ success: true, data: resultado });
    } catch (error) {
        console.error("Error al crear producto:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Actualizar un producto existente
export const actualizarProducto = async (req, res) => {
    const { id } = req.params; // El ID se toma de la URL
    if (!id) {
        return res.status(400).json({ success: false, message: 'ID del producto no proporcionado' });
    }

    try {
        const productoActualizado = await Producto.update(id, req.body);
        if (productoActualizado.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Producto no encontrado' });
        }
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

// Obtener productos con bajo stock (usando la columna CANTIDAD)
export const obtenerStockBajo = async (req, res) => {
    try {
        // Usamos el modelo para hacer una consulta personalizada o podemos crear un método específico en el modelo
        // Por simplicidad, aquí hacemos la consulta directa con pool (opcional, pero mejor crear un método en el modelo)
        // Para mantener la coherencia, crearemos un nuevo método en el modelo llamado `findLowStock`
        const productosBajoStock = await Producto.findLowStock(5); // umbral 5
        res.json({ success: true, data: productosBajoStock });
    } catch (error) {
        console.error("Error al obtener productos con stock bajo:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};