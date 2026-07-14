import Informe from "../models/informeModel.js";
import pool from "../config/db.js";
import { logHistory } from "../utils/historyLogger.js";

// Convierte fecha ISO a formato MySQL
const formatearFechaMySQL = (fechaISO) => {
    if (!fechaISO) return null;
    const date = new Date(fechaISO);
    return date.toISOString().slice(0, 19).replace('T', ' ');
};

/**
 * Obtener todos los informes
 */
export const obtenerInformes = async (req, res) => {
    try {
        const informes = await Informe.findAll();
        res.json({ success: true, data: informes });
    } catch (error) {
        console.error("Error al obtener informes:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Obtener informes del técnico autenticado
 */
export const obtenerMisInformes = async (req, res) => {
    try {
        const tecnicoId = req.admin?.id_usuario || req.admin?.id_usuario;
        if (!tecnicoId) {
            return res.status(401).json({ success: false, error: 'No autenticado' });
        }
        
        // Buscar id_usuario real desde el JWT
        const [usuarioRows] = await pool.query(
            'SELECT id_usuario FROM usuarios WHERE numero_documento = ? OR id_usuario = ?',
            [tecnicoId, tecnicoId]
        );
        
        if (!usuarioRows || usuarioRows.length === 0) {
            return res.status(404).json({ success: false, error: 'Técnico no encontrado' });
        }
        
        const idTecnicoReal = usuarioRows[0].id_usuario;
        const [rows] = await pool.query(
            'SELECT * FROM informe WHERE id_tecnico = ? ORDER BY fecha DESC',
            [idTecnicoReal]
        );
        
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error("Error al obtener informes del técnico:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};


/**
 * Obtener un informe por su ID
 */
export const obtenerInformePorId = async (req, res) => {
    const { id } = req.params;
    try {
        const informe = await Informe.findById(id);
        if (!informe) {
            return res.status(404).json({ success: false, message: "Informe no encontrado" });
        }
        res.json({ success: true, data: informe });
    } catch (error) {
        console.error("Error al obtener informe por ID:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Crear un nuevo informe
 */
export const crearInforme = async (req, res) => {
    try {
        const {
            id_orden,
            id_tecnico,
            diagnostico,
            trabajo_realizado,
            recomendaciones
        } = req.body;

        if (!id_orden || !id_tecnico) {
            return res.status(400).json({
                success: false,
                message: "Faltan campos obligatorios: id_orden, id_tecnico",
            });
        }

        const resultado = await Informe.create({
            id_orden,
            id_tecnico,
            diagnostico,
            trabajo_realizado,
            recomendaciones
        });

        // El ID insertado autoincremental
        const nuevoId = resultado.insertId;
        const nuevoInforme = await Informe.findById(nuevoId);

        // Guardar en el historial
        await logHistory(
            id_tecnico,
            'informe',
            nuevoId,
            'INSERT',
            `Redactó un informe para la orden ${id_orden}`
        );

        res.status(201).json({
            success: true,
            data: nuevoInforme,
            insertResult: resultado,
        });
    } catch (error) {
        console.error("Error al crear informe:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Actualizar un informe existente
 */
export const actualizarInforme = async (req, res) => {
    const { id } = req.params;
    try {
        const existe = await Informe.findById(id);
        if (!existe) {
            return res.status(404).json({ success: false, message: "Informe no encontrado" });
        }

        const { id_orden, id_tecnico, diagnostico, trabajo_realizado, recomendaciones } = req.body;

        const resultado = await Informe.update(id, {
            id_orden: id_orden || existe.id_orden,
            id_tecnico: id_tecnico || existe.id_tecnico,
            diagnostico: diagnostico || existe.diagnostico,
            trabajo_realizado: trabajo_realizado || existe.trabajo_realizado,
            recomendaciones: recomendaciones || existe.recomendaciones
        });
        
        const informeActualizado = await Informe.findById(id);

        res.json({
            success: true,
            data: informeActualizado,
            updateResult: resultado,
        });

        await logHistory(
            req.user?.id_usuario || existe.id_tecnico || 1,
            'informe',
            id,
            'UPDATE',
            `Actualizó el informe de la orden ${informeActualizado.id_orden}`
        );
    } catch (error) {
        console.error("Error al actualizar informe:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Eliminar un informe
 */
export const eliminarInforme = async (req, res) => {
    const { id } = req.params;
    try {
        const existe = await Informe.findById(id);
        if (!existe) {
            return res.status(404).json({ success: false, message: "Informe no encontrado" });
        }

        await Informe.delete(id);

        await logHistory(
            req.user?.id_usuario || existe.id_tecnico || 1,
            'informe',
            id,
            'DELETE',
            `Eliminó el informe de la orden ${existe.id_orden}`
        );

        res.json({ success: true, message: "Informe eliminado correctamente" });
    } catch (error) {
        console.error("Error al eliminar informe:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};