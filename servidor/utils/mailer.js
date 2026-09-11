import dotenv from 'dotenv';
dotenv.config();

import nodemailer from 'nodemailer';

// IMPORTANTE: Este correo DEBE estar configurado en tu archivo .env
const fromEmail = process.env.EMAIL_FROM || 'duvan2002pinto@gmail.com'; 

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false, // true para 465, false para otros puertos
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Helper to send email using Nodemailer
 */
const sendEmail = async (to, subject, htmlContent) => {
  try {
    const info = await transporter.sendMail({
      from: `"Soporte KTM" <${fromEmail}>`,
      to: to,
      subject: subject,
      html: htmlContent,
    });
    console.log('Correo enviado con éxito (Nodemailer), messageId:', info.messageId);
    return true;
  } catch (error) {
    console.error('Excepción al enviar correo con Nodemailer:', error);
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

  return await sendEmail(destinatario, subject, html);
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

  return await sendEmail(destinatario, subject, html);
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

  return await sendEmail(destinatario, `Actualización de estado de tu cuenta: ${titulo}`, mensajeHtml);
};

/**
 * Send welcome email to technician upon account creation by Admin
 * @param {string} destinatario Email of the technician
 * @param {string} nombre Name of the technician
 * @param {string} usuario Username of the technician
 */
export const enviarCorreoBienvenidaTecnico = async (destinatario, nombre, usuario) => {
  const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
  const loginUrl = `${FRONTEND_URL}/login`;

  const subject = 'Bienvenido al equipo - Cuenta de Técnico Creada';
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #ff6600;">¡Hola, ${nombre}!</h2>
      <p>Te informamos que un administrador ha creado tu cuenta de <strong>Técnico</strong> en nuestro sistema.</p>
      <p>Ya puedes acceder a la plataforma para gestionar las órdenes de servicio.</p>
      <p><strong>Tu usuario de acceso es:</strong> ${usuario}</p>
      <p style="margin: 30px 0;">
        <a href="${loginUrl}" style="background-color: #ff6600; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
          Iniciar Sesión
        </a>
      </p>
      <hr style="border: none; border-top: 1px solid #ccc; margin-top: 30px;" />
      <p style="font-size: 12px; color: #777;">Gracias por ser parte de nuestro equipo. Si tienes problemas para ingresar, contacta al administrador.</p>
    </div>
  `;

  return await sendEmail(destinatario, subject, html);
};
