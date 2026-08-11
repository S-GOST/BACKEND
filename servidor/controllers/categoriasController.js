import Categoria from "../models/categoriasModel.js";
import { logHistory } from "../utils/historyLogger.js";
import pool from "../config/db.js";

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
 * Inhabilitar (soft delete) una categoría
 */
export const eliminarCategoria = async (req, res) => {
    const { id } = req.params;
    const force = req.query.force === 'true';

    try {
        if (!force) {
            const deps = await Categoria.checkDependencies(id);
            if (deps.productosCount > 0 || deps.serviciosCount > 0) {
                return res.status(409).json({
                    success: false, 
                    message: `La categoría tiene ${deps.productosCount} producto(s) y ${deps.serviciosCount} servicio(s) activos asociados. ¿Desea inhabilitarla junto con sus dependencias?`,
                    dependencies: deps
                });
            }
        }

        const resultado = await Categoria.delete(id);
        if (resultado.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Categoría no encontrada" });
        }
        
        if (force) {
            await pool.query("UPDATE productos SET Estado = 'Inactivo' WHERE ID_CATEGORIA = ?", [id]);
            await pool.query("UPDATE servicios SET Estado = 'Inactivo' WHERE ID_CATEGORIA = ?", [id]);
        }

        await logHistory(
            req.user?.id_usuario || 1,
            'categorias',
            id,
            'UPDATE',
            `Se inhabilitó la categoría ID ${id}`
        );

        res.json({ success: true, message: "Categoría inhabilitada correctamente" });
    } catch (error) {
        console.error("Error al inhabilitar categoría:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Habilitar (restaurar) una categoría
 */
export const habilitarCategoria = async (req, res) => {
    const { id } = req.params;
    try {
        const resultado = await Categoria.restore(id);
        if (resultado.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Categoría no encontrada" });
        }

        // Reactivar productos y servicios asociados
        await pool.query("UPDATE productos SET Estado = 'Activo' WHERE ID_CATEGORIA = ?", [id]);
        await pool.query("UPDATE servicios SET Estado = 'Activo' WHERE ID_CATEGORIA = ?", [id]);

        res.json({ success: true, message: "Categoría habilitada correctamente" });
    } catch (error) {
        console.error("Error al habilitar categoría:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};
