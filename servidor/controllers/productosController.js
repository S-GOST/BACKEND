// Importamos el modelo Producto
import Producto from "../models/productosModel.js";
import { logHistory } from "../utils/historyLogger.js";

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

// Obtener productos por categoría
export const obtenerProductosPorCategoria = async (req, res) => {
    const { idCategoria } = req.params;
    try {
        const productos = await Producto.findByCategoria(idCategoria);
        res.json({ success: true, data: productos });
    } catch (error) {
        console.error("Error al obtener productos por categoría:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Crear un nuevo producto
export const crearProducto = async (req, res) => {
    try {
        const resultado = await Producto.create(req.body);

        await logHistory(
            req.user?.id_usuario || 1,
            'productos',
            resultado.ID_PRODUCTOS || 0, // Prisma devuelve directamente el objeto creado
            'INSERT',
            `Se creó el producto ${req.body.Nombre || req.body.nombre || 'N/A'}`
        );

        res.status(201).json({ success: true, data: resultado });
    } catch (error) {
        if (error.code === 'P2002') { // Violación Unique Constraint en Prisma
            return res.status(400).json({ success: false, message: 'El nombre del producto ya existe' });
        }
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

        await logHistory(
            req.user?.id_usuario || 1,
            'productos',
            id,
            'UPDATE',
            `Se actualizó el producto ID ${id}`
        );

        res.json({ success: true, data: productoActualizado });
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ success: false, message: 'El nombre del producto ya existe' });
        }
        if (error.code === 'P2025') { // Registro no encontrado
            return res.status(404).json({ success: false, message: 'Producto no encontrado' });
        }
        console.error("Error al actualizar producto:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Eliminar un producto
export const eliminarProducto = async (req, res) => {
    const { id } = req.params;
    try {
        await Producto.delete(id);

        await logHistory(
            req.user?.id_usuario || 1,
            'productos',
            id,
            'DELETE',
            `Se eliminó el producto ID ${id}`
        );

        res.json({ success: true, message: 'Producto eliminado correctamente' });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ success: false, message: 'Producto no encontrado' });
        }
        console.error("Error al eliminar producto:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Habilitar (restaurar) un producto
 */
export const habilitarProducto = async (req, res) => {
    const { id } = req.params;
    try {
        await Producto.restore(id);

        await logHistory(
            req.user?.id_usuario || 1,
            'productos',
            id,
            'UPDATE',
            `Se habilitó el producto ID ${id}`
        );

        res.json({ success: true, message: "Producto habilitado correctamente" });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ success: false, message: "Producto no encontrado" });
        }
        console.error("Error al habilitar producto:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};
