import express from "express";
import { 
    obtenerTiposDocumento, 
    obtenerTipoDocumentoPorId 
} from "../controllers/tipoDocumentoController.js";

const router = express.Router();

router.get("/obtener", obtenerTiposDocumento);
router.get("/buscar/:id", obtenerTipoDocumentoPorId);

export default router;
