import dotenv from 'dotenv';
dotenv.config();

// Obtén tu API Key de Brevo en: https://app.brevo.com/settings/keys/api
const BREVO_API_KEY = process.env.BREVO_API_KEY;

// IMPORTANTE: Este correo DEBE estar verificado en Brevo en la sección de "Remitentes".
// Si verificaste tu Gmail en Brevo, debes poner tu Gmail aquí.
const fromEmail = process.env.EMAIL_FROM || 'duvan2002pinto@gmail.com'; 

/**
 * Helper to send email using Brevo HTTP API
 */
const sendBrevoEmail = async (to, subject, htmlContent) => {
  if (!BREVO_API_KEY) {
    console.error('Error: BREVO_API_KEY no está configurada en las variables de entorno.');
    return false;
  }

  const url = 'https://api.brevo.com/v3/smtp/email';
  const options = {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'content-type': 'application/json',
      'api-key': BREVO_API_KEY
    },
    body: JSON.stringify({
      sender: { name: "Soporte KTM", email: fromEmail },
      to: [{ email: to }],
      subject: subject,
      htmlContent: htmlContent
    })
  };

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error enviando correo con Brevo:', errorData);
      return false;
    }
    const data = await response.json();
    console.log('Correo enviado con éxito (Brevo), messageId:', data.messageId);
    return true;
  } catch (error) {
    console.error('Excepción al enviar correo con Brevo:', error);
    return false;
  }
};

/**
 * Send password recovery email
 * @param {string} destinatario Email of the user
 * @param {string} token Recovery token
 */
export const enviarCorreoRecuperacion = async (destinatario, token) => {
  const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
  const enlaceRecuperacion = `${FRONTEND_URL}/reset-password/${token}`;

  const subject = 'Recuperación de contraseña';
  const html = `
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
  `;

  return await sendBrevoEmail(destinatario, subject, html);
};

/**
 * Send account pending approval email (upon registration)
 * @param {string} destinatario Email of the user
 * @param {string} nombre Name of the user
 */
export const enviarCorreoRegistroPendiente = async (destinatario, nombre) => {
  const subject = 'Registro Exitoso - Cuenta Pendiente de Aprobación';
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #ff6600;">¡Hola, ${nombre}!</h2>
      <p>Tu registro y el de tu motocicleta se han completado exitosamente en nuestra plataforma.</p>
      <p>Actualmente, tu cuenta se encuentra en estado <strong>Pendiente de Aprobación</strong>.</p>
      <p>Un administrador revisará tus datos pronto. Te notificaremos por este medio tan pronto como tu cuenta sea aprobada para que puedas iniciar sesión y acceder a todos nuestros servicios.</p>
      <hr style="border: none; border-top: 1px solid #ccc; margin-top: 30px;" />
      <p style="font-size: 12px; color: #777;">Gracias por unirte a nosotros.</p>
    </div>
  `;

  return await sendBrevoEmail(destinatario, subject, html);
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

  return await sendBrevoEmail(destinatario, `Actualización de estado de tu cuenta: ${titulo}`, mensajeHtml);
};
