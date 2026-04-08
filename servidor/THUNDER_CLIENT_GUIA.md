# Guía para usar Thunder Client con JWT

## Problema común: "No hay token, permiso denegado"

Si te aparece este error al hacer peticiones con Thunder Client, sigue estos pasos:

## ✅ Solución paso a paso:

### 1. Instalar Thunder Client
- Abre VS Code
- Ve a Extensions (Ctrl+Shift+X)
- Busca "Thunder Client" de Rong Wong
- Instala y recarga VS Code

### 2. Hacer login primero
- Abre el archivo `peticiones.http`
- Haz clic en el botón "Thunder Client" que aparece arriba
- Ejecuta la petición de login (POST /api/admins/login)
- Copia el token de la respuesta

### 3. Configurar el header correctamente
Para las peticiones que requieren autenticación:

1. **Método:** POST, PUT, GET, DELETE (según corresponda)
2. **URL:** `http://localhost:3000/api/tecnicos/insertar`
3. **Headers:**
   - **Key:** `Authorization` (exactamente así, con mayúscula)
   - **Value:** `Bearer TU_TOKEN_AQUI` (reemplaza con el token real)
4. **Body:** JSON con los datos

### 4. Verificar el header
- Asegúrate de que el header sea exactamente `Authorization` (no `authorization`)
- El valor debe ser `Bearer ` seguido del token (con espacio)
- No uses comillas alrededor del token

## 📝 Ejemplo de configuración en Thunder Client:

```
Method: POST
URL: http://localhost:3000/api/tecnicos/insertar

Headers:
- Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Body (JSON):
{
  "ID_TECNICOS": "TEC999",
  "Nombre": "Test",
  "usuario": "test",
  "contrasena": "123456",
  "Correo": "test@email.com",
  "TipoDocumento": "CC",
  "Telefono": "3001234567"
}
```

## 🔍 Si aún no funciona:

1. Revisa la consola del servidor (donde ejecutas `node server.js`)
2. Deberías ver logs como:
   ```
   Headers recibidos: { authorization: 'Bearer eyJ...' }
   Auth header: Bearer eyJ...
   Token extraído: eyJ...
   ```
3. Si no ves estos logs, el header no se está enviando

## ⚡ Atajos útiles:

- `Ctrl+Shift+P` → "Thunder Client: New Request"
- `Ctrl+Enter` → Ejecutar petición
- `Ctrl+Shift+R` → Recargar colección

¡Listo! Ahora deberías poder hacer peticiones sin problemas. 🚀</content>
<parameter name="filePath">c:\Users\duvan\BACKEND\servidor\THUNDER_CLIENT_GUIA.md