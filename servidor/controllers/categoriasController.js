import Categoria from "../models/categoriasModel.js";
import { logHistory } from "../utils/historyLogger.js";
import prisma from "../config/prisma.js"; // Importamos prisma en lugar de pool

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
            nuevaCategoria.ID_CATEGORIA || 0, // Prisma devuelve el ID_CATEGORIA
            'INSERT',
            `Se creó la categoría ${req.body.nombre || 'N/A'}`
        );

        res.status(201).json({ success: true, data: nuevaCategoria });
    } catch (error) {
        if (error.code === 'P2002') { // Violación de Unique Constraint
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
        await Categoria.update(id, req.body);

        await logHistory(
            req.user?.id_usuario || 1,
            'categorias',
            id,
            'UPDATE',
            `Se actualizó la categoría ID ${id}`
        );

        res.json({ success: true, message: "Categoría actualizada correctamente" });
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ success: false, message: 'El nombre de la categoría ya existe' });
        }
        if (error.code === 'P2025') { // Registro no encontrado
            return res.status(404).json({ success: false, message: "Categoría no encontrada" });
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

        await Categoria.delete(id);

        if (force) {
            // Reemplazo de pool.query usando updateMany de Prisma
            await prisma.productos.updateMany({
                where: { ID_CATEGORIA: Number(id) },
                data: { Estado: 'Inactivo' }
            });
            await prisma.servicios.updateMany({
                where: { ID_CATEGORIA: Number(id) },
                data: { Estado: 'Inactivo' }
            });
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
        if (error.code === 'P2025') {
            return res.status(404).json({ success: false, message: "Categoría no encontrada" });
        }
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
        await Categoria.restore(id);

        // Reactivar productos y servicios asociados (reemplazo de pool.query)
        await prisma.productos.updateMany({
            where: { ID_CATEGORIA: Number(id) },
            data: { Estado: 'Activo' }
        });
        await prisma.servicios.updateMany({
            where: { ID_CATEGORIA: Number(id) },
            data: { Estado: 'Activo' }
        });

        res.json({ success: true, message: "Categoría habilitada correctamente" });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ success: false, message: "Categoría no encontrada" });
        }
        console.error("Error al habilitar categoría:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};
