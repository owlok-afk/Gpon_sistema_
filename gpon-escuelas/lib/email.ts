import nodemailer from 'nodemailer'

const gmailUser = process.env.GMAIL_USER
const gmailPass = process.env.GMAIL_APP_PASSWORD

if (!gmailUser || !gmailPass) {
  throw new Error('Faltan GMAIL_USER o GMAIL_APP_PASSWORD en .env.local')
}

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: gmailUser,
    pass: gmailPass,
  },
})

type EnviarCredencialesParams = {
  destinatario: string
  nombreInstitucion: string
  correoAcceso: string
  passwordTemporal: string
}

export async function enviarCredenciales({
  destinatario,
  nombreInstitucion,
  correoAcceso,
  passwordTemporal,
}: EnviarCredencialesParams) {
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; background: #f8fafc;">
      <div style="background: white; border-radius: 12px; padding: 32px; border: 1px solid #e2e8f0;">
        <h1 style="color: #0f172a; font-size: 20px; margin: 0 0 8px 0;">¡Bienvenido al sistema GPON Telecom!</h1>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">
          Hola <strong>${nombreInstitucion}</strong>,
        </p>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">
          Tu solicitud fue <strong style="color: #059669;">aprobada</strong>. Ya puedes acceder al sistema con las siguientes credenciales:
        </p>
        <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 4px 0;">Usuario</p>
          <p style="color: #0f172a; font-family: monospace; font-size: 14px; margin: 0 0 16px 0;">${correoAcceso}</p>
          <p style="color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 4px 0;">Contraseña temporal</p>
          <p style="color: #0f172a; font-family: monospace; font-size: 14px; margin: 0;">${passwordTemporal}</p>
        </div>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">
          Por seguridad, te recomendamos <strong>cambiar tu contraseña</strong> al primer inicio de sesión.
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
        <p style="color: #94a3b8; font-size: 11px; line-height: 1.5; margin: 0;">
          Si no solicitaste este acceso, puedes ignorar este correo.<br>
          GPON Telecom S.A. de C.V. — Soporte 24/7: 800-4766-NOC
        </p>
      </div>
    </div>
  `

  return transporter.sendMail({
    from: `"GPON Telecom" <${gmailUser}>`,
    to: destinatario,
    subject: 'Acceso aprobado — Sistema de Monitoreo Escolar',
    html,
  })
}

type EnviarRechazoParams = {
  destinatario: string
  nombreInstitucion: string
  motivo?: string
}

export async function enviarRechazo({
  destinatario,
  nombreInstitucion,
  motivo,
}: EnviarRechazoParams) {
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; background: #f8fafc;">
      <div style="background: white; border-radius: 12px; padding: 32px; border: 1px solid #e2e8f0;">
        <h1 style="color: #0f172a; font-size: 20px; margin: 0 0 8px 0;">Solicitud revisada</h1>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">
          Hola <strong>${nombreInstitucion}</strong>,
        </p>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">
          Tu solicitud de acceso al sistema fue <strong style="color: #dc2626;">rechazada</strong>.
        </p>
        ${motivo ? `<div style="background: #fef2f2; border-left: 3px solid #dc2626; padding: 12px 16px; margin: 16px 0; border-radius: 4px;"><p style="color: #7f1d1d; font-size: 13px; margin: 0;"><strong>Motivo:</strong> ${motivo}</p></div>` : ''}
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">
          Si consideras que fue un error, contacta al NOC central al 800-4766-NOC.
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
        <p style="color: #94a3b8; font-size: 11px; line-height: 1.5; margin: 0;">
          GPON Telecom S.A. de C.V.
        </p>
      </div>
    </div>
  `

  return transporter.sendMail({
    from: `"GPON Telecom" <${gmailUser}>`,
    to: destinatario,
    subject: 'Solicitud de acceso — Revisada',
    html,
  })
}