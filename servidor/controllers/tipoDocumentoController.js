import TipoDocumento from "../models/tipoDocumentoModel.js";

export const obtenerTiposDocumento = async (req, res) => {
    try {
        const tipos = await TipoDocumento.findAll();
        res.json({ success: true, data: tipos });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const obtenerTipoDocumentoPorId = async (req, res) => {
    const { id } = req.params;
    try {
        const tipo = await TipoDocumento.findById(id);

        if (!tipo) {
            return res.status(404).json({ success: false, message: 'Tipo de documento no encontrado' });
        }

        res.json({ success: true, data: tipo });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
