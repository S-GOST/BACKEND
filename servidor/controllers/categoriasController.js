import Categoria from "../models/categoriasModel.js";
import { logHistory } from "../utils/historyLogger.js";

/**
 * Obtener todas las categorías
 */
export const obtenerCategorias = async (req, res) => {
    try {
        const categorias = await Categoria.findAll();
        res.json({ success: true, data: categorias });
    } catch (error) {
        console.error("Error al obtener categorías:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Obtener una categoría por su ID
 */
export const obtenerCategoriaPorId = async (req, res) => {
    const { id } = req.params;
    try {
        const categoria = await Categoria.findById(id);
        if (!categoria) {
            return res.status(404).json({ success: false, message: "Categoría no encontrada" });
        }
        res.json({ success: true, data: categoria });
    } catch (error) {
        console.error("Error al obtener categoría por ID:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Obtener categorías por tipo (PRODUCTO o SERVICIO)
 */
export const obtenerCategoriasPorTipo = async (req, res) => {
    const { tipo } = req.params;
    try {
        const categorias = await Categoria.findByTipo(tipo);
        res.json({ success: true, data: categorias });
    } catch (error) {
        console.error("Error al obtener categorías por tipo:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Crear una nueva categoría
 */
export const crearCategoria = async (req, res) => {
    try {
        const nuevaCategoria = await Categoria.create(req.body);

        await logHistory(
            req.user?.id_usuario || 1,
            'categorias',
            nuevaCategoria.insertId || 0,
            'INSERT',
            `Se creó la categoría ${req.body.nombre || 'N/A'}`
        );

        res.status(201).json({ success: true, data: nuevaCategoria });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'El nombre de la categoría ya existe' });
        }
        console.error("Error al crear categoría:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Actualizar una categoría existente
 */
export const actualizarCategoria = async (req, res) => {
    const { id } = req.params;
    try {
        const resultado = await Categoria.update(id, req.body);
        if (resultado.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Categoría no encontrada" });
        }

        await logHistory(
            req.user?.id_usuario || 1,
            'categorias',
            id,
            'UPDATE',
            `Se actualizó la categoría ID ${id}`
        );

        res.json({ success: true, message: "Categoría actualizada correctamente" });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'El nombre de la categoría ya existe' });
        }
        console.error("Error al actualizar categoría:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Eliminar una categoría
 */
export const eliminarCategoria = async (req, res) => {
    const { id } = req.params;
    try {
        const resultado = await Categoria.delete(id);
        if (resultado.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Categoría no encontrada" });
        }

        await logHistory(
            req.user?.id_usuario || 1,
            'categorias',
            id,
            'DELETE',
            `Se eliminó la categoría ID ${id}`
        );

        res.json({ success: true, message: "Categoría eliminada correctamente" });
    } catch (error) {
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({ success: false, message: 'No se puede eliminar la categoría porque tiene servicios o productos asociados. Debe ser inhabilitada o vaciada primero.' });
        }
        console.error("Error al eliminar categoría:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};
