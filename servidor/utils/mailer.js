import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER || 'test@example.com', 
    pass: process.env.EMAIL_PASS || 'password', 
  },
});

/**
 * Send password recovery email
 * @param {string} destinatario Email of the user
 * @param {string} token Recovery token
 */
export const enviarCorreoRecuperacion = async (destinatario, token) => {
  const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
  const enlaceRecuperacion = `${FRONTEND_URL}/reset-password/${token}`;

  const mailOptions = {
    from: `"Soporte KTM" <${process.env.EMAIL_USER || 'no-reply@ktm.com'}>`,
    to: destinatario,
    subject: 'Recuperación de contraseña',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #ff6600;">Recuperación de contraseña</h2>
        <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para crear una nueva:</p>
        <p style="margin: 30px 0;">
          <a href="${enlaceRecuperacion}" style="background-color: #ff6600; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Restablecer Contraseña
          </a>
        </p>
        <p>Este enlace expirará en 24 horas.</p>
        <p>Si no solicitaste este cambio, puedes ignorar este correo de forma segura.</p>
        <hr style="border: none; border-top: 1px solid #ccc; margin-top: 30px;" />
        <p style="font-size: 12px; color: #777;">Si tienes problemas con el botón, copia y pega esta URL en tu navegador:</p>
        <p style="font-size: 12px; word-break: break-all; color: #0066cc;">${enlaceRecuperacion}</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Correo enviado: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Error enviando correo:', error);
    return false;
  }
};

/**
 * Send account approval/rejection email
 * @param {string} destinatario Email of the user
 * @param {string} estado 'Activo' or 'Rechazado'
 * @param {string} justificacion Justification for rejection (if applicable)
 */
export const enviarCorreoAprobacion = async (destinatario, estado, justificacion = '') => {
  const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
  const loginUrl = `${FRONTEND_URL}/login`;
  
  const esAprobado = estado === 'Activo';
  const titulo = esAprobado ? 'Cuenta Aprobada' : 'Cuenta Rechazada';
  const color = esAprobado ? '#4CAF50' : '#F44336';
  
  let mensajeHtml = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: ${color};">${titulo}</h2>
      <p>Te informamos que el estado de tu solicitud de registro ha sido actualizado.</p>
  `;

  if (esAprobado) {
    mensajeHtml += `
      <p>¡Felicidades! Tu cuenta ha sido <strong>aprobada</strong>. Ya puedes acceder al sistema.</p>
      <p style="margin: 30px 0;">
        <a href="${loginUrl}" style="background-color: ${color}; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
          Iniciar Sesión
        </a>
      </p>
    `;
  } else {
    mensajeHtml += `
      <p>Lamentablemente tu solicitud de cuenta ha sido <strong>rechazada</strong>.</p>
      <p><strong>Motivo:</strong> ${justificacion || 'No especificado'}</p>
      <p>Si consideras que esto es un error, por favor contacta a soporte.</p>
    `;
  }

  mensajeHtml += `</div>`;

  const mailOptions = {
    from: `"Soporte KTM" <${process.env.EMAIL_USER || 'no-reply@ktm.com'}>`,
    to: destinatario,
    subject: `Actualización de estado de tu cuenta: ${titulo}`,
    html: mensajeHtml,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Correo de aprobación/rechazo enviado: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Error enviando correo de aprobación/rechazo:', error);
    return false;
  }
};
