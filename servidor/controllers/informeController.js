import Informe from "../models/informeModel.js";
import pool from "../config/db.js";
import { logHistory } from "../utils/historyLogger.js";



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
        const tecnicoId = req.user?.id_usuario || req.admin?.id_usuario;
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

/**
 * Generar reporte de informes (HU-004.1)
 */
export const generarReporte = async (req, res) => {
    try {
        const { fecha_inicio, fecha_fin } = req.body;
        const usuarioRol = req.user?.id_rol || req.admin?.id_rol;
        const idUsuario = req.user?.id_usuario || req.admin?.id_usuario;

        // Cliente no tiene acceso
        if (usuarioRol === 3) {
            return res.status(403).json({ success: false, message: 'Acceso denegado' });
        }

        let query = 'SELECT * FROM informe WHERE DATE(fecha) BETWEEN ? AND ?';
        const queryParams = [fecha_inicio, fecha_fin];

        // RN-003 y RN-004: Si es técnico (Rol 2), solo ver los suyos
        if (usuarioRol === 2) {
            query += ' AND id_tecnico = ?';
            queryParams.push(idUsuario);
        }

        query += ' ORDER BY fecha DESC';

        const [rows] = await pool.query(query, queryParams);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Sin datos disponibles' });
        }

        await logHistory(
            idUsuario || 1,
            'informe',
            0, // No aplica a un informe específico
            'REPORT',
            `Generó reporte de informes desde ${fecha_inicio} hasta ${fecha_fin}`
        );

        res.json({ success: true, data: rows });
    } catch (error) {
        console.error("Error al generar reporte de informes:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Obtener informe de productividad de tecnicos (RF-0036)
 */
export const obtenerProductividadTecnicos = async (req, res) => {
    try {
        const { fecha_inicio, fecha_fin } = req.query;
        const idUsuario = req.user?.id_usuario || req.admin?.id_usuario;

        if (!fecha_inicio || !fecha_fin) {
            return res.status(400).json({ success: false, message: 'Faltan fechas de inicio o fin' });
        }

        // 1. Contar cuantas ordenes completadas por tecnico
        const queryOrdenes = `
            SELECT u.nombre, u.id_usuario, COUNT(os.id_orden) as total_completadas
            FROM orden_servicio os
            JOIN usuarios u ON os.id_tecnico = u.id_usuario
            WHERE os.estado = 'Finalizada' 
              AND DATE(os.fecha_salida) BETWEEN ? AND ?
            GROUP BY u.id_usuario
        `;
        
        const [ordenesCompletadas] = await pool.query(queryOrdenes, [fecha_inicio, fecha_fin]);

        // 2. Calcular tiempo promedio por tipo de servicio
        const queryPromedio = `
            SELECT 
                u.id_usuario,
                u.nombre,

                s.Nombre as servicio,
                AVG(TIMESTAMPDIFF(MINUTE, os.fecha_ingreso, os.fecha_salida)) as promedio_minutos
            FROM orden_servicio os
            JOIN usuarios u ON os.id_tecnico = u.id_usuario
            JOIN detalles_orden_servicio dos ON os.id_orden = dos.id_orden
            JOIN servicios s ON dos.ID_SERVICIOS = s.ID_SERVICIOS
            WHERE os.estado = 'Finalizada' 
              AND DATE(os.fecha_salida) BETWEEN ? AND ?
              AND os.fecha_ingreso IS NOT NULL 
              AND os.fecha_salida IS NOT NULL
            GROUP BY u.id_usuario, s.ID_SERVICIOS
        `;

        const [promediosServicios] = await pool.query(queryPromedio, [fecha_inicio, fecha_fin]);

        if (ordenesCompletadas.length === 0 && promediosServicios.length === 0) {
            return res.status(404).json({ success: false, message: 'No hay órdenes completadas en el período' });
        }

        await logHistory(
            idUsuario || 1,
            'informe',
            0,
            'REPORT',
            `Generó reporte de productividad desde ${fecha_inicio} hasta ${fecha_fin}`
        );

        res.json({ 
            success: true, 
            data: {
                ordenesCompletadas,
                promediosServicios
            } 
        });
    } catch (error) {
        console.error("Error al generar reporte de productividad:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};


/**
 * Obtener informe de inventario (RF-0035)
 */
export const obtenerReporteInventario = async (req, res) => {
    try {
        const { fecha_inicio, fecha_fin, categoria } = req.query;
        const idRol = req.user?.id_rol || req.admin?.id_rol;
        const idUsuario = req.user?.id_usuario || req.admin?.id_usuario;

        // 1. Obtener estado del inventario actual
        let queryInventario = `
            SELECT p.ID_PRODUCTOS, p.Nombre, p.Marca, p.stock, p.stock_minimo, p.precio_venta, p.precio_costo, c.Nombre as categoria_nombre
            FROM productos p
            LEFT JOIN categorias c ON p.ID_CATEGORIA = c.ID_CATEGORIA
            WHERE p.Estado = 'Activo'
        `;
        
        let paramsInventario = [];
        if (categoria) {
            queryInventario += ' AND p.ID_CATEGORIA = ?';
            paramsInventario.push(categoria);
        }

        const [productos] = await pool.query(queryInventario, paramsInventario);

        // 2. Obtener productos mas utilizados en el rango de fechas
        let queryMasUsados = `
            SELECT p.ID_PRODUCTOS, p.Nombre, SUM(dos.cantidad) as total_usado
            FROM detalles_orden_servicio dos
            JOIN orden_servicio os ON dos.id_orden = os.id_orden
            JOIN productos p ON dos.ID_PRODUCTOS = p.ID_PRODUCTOS
            WHERE os.estado = 'Finalizada'
        `;
        
        let paramsMasUsados = [];
        if (fecha_inicio && fecha_fin) {
            queryMasUsados += ' AND DATE(os.fecha_salida) BETWEEN ? AND ?';
            paramsMasUsados.push(fecha_inicio, fecha_fin);
        }
        if (categoria) {
            queryMasUsados += ' AND p.ID_CATEGORIA = ?';
            paramsMasUsados.push(categoria);
        }
        
        queryMasUsados += ' GROUP BY p.ID_PRODUCTOS ORDER BY total_usado DESC LIMIT 10';
        
        const [masUsados] = await pool.query(queryMasUsados, paramsMasUsados);

        
        // 2b. Obtener servicios mas utilizados
        let queryMasUsadosServicios = `
            SELECT s.ID_SERVICIOS, s.nombre, s.Precio, SUM(dos.cantidad) as total_usado, SUM(dos.cantidad * CAST(s.Precio AS DECIMAL(10,2))) as total_generado
            FROM detalles_orden_servicio dos
            JOIN orden_servicio os ON dos.id_orden = os.id_orden
            JOIN servicios s ON dos.ID_SERVICIOS = s.ID_SERVICIOS
            WHERE os.estado = 'Finalizada'
        `;
        let paramsMasUsadosServicios = [];
        if (fecha_inicio && fecha_fin) {
            queryMasUsadosServicios += ' AND DATE(os.fecha_salida) BETWEEN ? AND ?';
            paramsMasUsadosServicios.push(fecha_inicio, fecha_fin);
        }
        if (categoria) {
            queryMasUsadosServicios += ' AND s.id_categoria = ?';
            paramsMasUsadosServicios.push(categoria);
        }
        queryMasUsadosServicios += ' GROUP BY s.ID_SERVICIOS ORDER BY total_usado DESC LIMIT 10';
        const [masUsadosServicios] = await pool.query(queryMasUsadosServicios, paramsMasUsadosServicios);

        if (productos.length === 0 && masUsadosServicios.length === 0) {
            return res.status(404).json({ success: false, message: 'No hay datos registrados' });
        }

        // 3. Obtener Ventas y Costos Reales
        let queryVentasProd = `
            SELECT SUM(dos.cantidad * p.precio_venta) as total_venta_prod,
                   SUM(dos.cantidad * p.precio_costo) as total_costo_prod
            FROM detalles_orden_servicio dos
            JOIN orden_servicio os ON dos.id_orden = os.id_orden
            JOIN productos p ON dos.ID_PRODUCTOS = p.ID_PRODUCTOS
            WHERE os.estado = 'Finalizada'
        `;
        let queryVentasServ = `
            SELECT SUM(dos.cantidad * CAST(s.Precio AS DECIMAL(10,2))) as total_venta_serv
            FROM detalles_orden_servicio dos
            JOIN orden_servicio os ON dos.id_orden = os.id_orden
            JOIN servicios s ON dos.ID_SERVICIOS = s.ID_SERVICIOS
            WHERE os.estado = 'Finalizada'
        `;
        
        let paramVentas = [];
        if (fecha_inicio && fecha_fin) {
            queryVentasProd += ' AND DATE(os.fecha_salida) BETWEEN ? AND ?';
            queryVentasServ += ' AND DATE(os.fecha_salida) BETWEEN ? AND ?';
            paramVentas.push(fecha_inicio, fecha_fin);
        }
        if (categoria) {
            // Esto solo filtrará por categoría de producto o servicio dependiendo de la query
            // Para simplificar, si hay filtro de categoría, se aplica a ambas, si una no tiene datos, retorna null
            queryVentasProd += ' AND p.ID_CATEGORIA = ?';
            queryVentasServ += ' AND s.id_categoria = ?';
            paramVentas.push(categoria);
        }
        
        const [ventasProd] = await pool.query(queryVentasProd, paramVentas);
        const [ventasServ] = await pool.query(queryVentasServ, paramVentas);

        let total_venta = (Number(ventasProd[0]?.total_venta_prod) || 0) + (Number(ventasServ[0]?.total_venta_serv) || 0);
        let total_costo = Number(ventasProd[0]?.total_costo_prod) || 0;

        // 4. Procesar alertas
        const alertas_stock = [];

        const inventarioProcesado = productos.map(p => {
            const valVenta = Number(p.stock) * Number(p.precio_venta);
            const valCosto = Number(p.stock) * Number(p.precio_costo);

            if (p.stock <= p.stock_minimo) {
                alertas_stock.push({
                    id: p.ID_PRODUCTOS,
                    nombre: p.Nombre,
                    stock: p.stock,
                    minimo: p.stock_minimo
                });
            }

            // Ocultar costos a técnicos (RN-001)
            if (idRol === 2) {
                delete p.precio_costo;
            }

            return {
                ...p,
                valor_venta: valVenta,
                valor_costo: idRol !== 2 ? valCosto : undefined
            };
        });

        await logHistory(
            idUsuario || 1,
            'productos',
            0,
            'REPORT',
            'Generó reporte de inventario'
        );

        res.json({
            success: true,
            data: {
                total_venta,
                total_costo: idRol !== 2 ? total_costo : undefined,
                alertas_stock,
                masUsados,
                masUsadosServicios,
                inventario: inventarioProcesado
            }
        });

    } catch (error) {
        console.error("Error al generar reporte de inventario:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};
