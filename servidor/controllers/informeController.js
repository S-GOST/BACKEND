// controllers/informeController.js
import Informe from "../models/informeModel.js";

// Convierte fecha ISO a formato MySQL (solo transformación de string, no SQL)
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
 * Requiere que el cliente envíe ID_INFORME (ej: "INF1") junto a los demás campos.
 */
export const crearInforme = async (req, res) => {
    try {
        const {
            ID_INFORME,
            ID_DETALLES_ORDEN_SERVICIO,
            ID_ADMINISTRADOR,
            ID_TECNICOS,
            Descripcion,
            Fecha,
            Estado,
        } = req.body;

        // Validar campos obligatorios (incluyendo ID_INFORME)
        if (!ID_INFORME || !ID_DETALLES_ORDEN_SERVICIO || !ID_ADMINISTRADOR || !ID_TECNICOS) {
            return res.status(400).json({
                success: false,
                message: "Faltan campos obligatorios: ID_INFORME, ID_DETALLES_ORDEN_SERVICIO, ID_ADMINISTRADOR, ID_TECNICOS",
            });
        }

        // Formatear fecha si viene en formato ISO
        let fechaFormateada = Fecha;
        if (Fecha) {
            fechaFormateada = formatearFechaMySQL(Fecha);
        }

        const resultado = await Informe.create({
            ID_INFORME,
            ID_DETALLES_ORDEN_SERVICIO,
            ID_ADMINISTRADOR,
            ID_TECNICOS,
            Descripcion,
            Fecha: fechaFormateada,
            Estado,
        });

        // Opcional: recuperar el registro recién creado (si el modelo lo permite)
        const nuevoInforme = await Informe.findById(ID_INFORME);

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

        // Excluir ID_INFORME por seguridad
        const { ID_INFORME, ...datosActualizables } = req.body;

        // Formatear fecha si viene
        if (datosActualizables.Fecha) {
            datosActualizables.Fecha = formatearFechaMySQL(datosActualizables.Fecha);
        }

        const resultado = await Informe.update(id, datosActualizables);
        const informeActualizado = await Informe.findById(id);

        res.json({
            success: true,
            data: informeActualizado,
            updateResult: resultado,
        });
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
        res.json({ success: true, message: "Informe eliminado correctamente" });
    } catch (error) {
        console.error("Error al eliminar informe:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};