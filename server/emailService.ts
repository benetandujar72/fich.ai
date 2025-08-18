import nodemailer from 'nodemailer';
import 'dotenv/config';

// Interfaz para las opciones del email
interface MailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Validamos que las variables de entorno necesarias existan
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.warn(
        `[EmailService] Advertencia: SMTP_USER o SMTP_PASSWORD no configuradas. El servicio de email estarà inactiu.`
      );
    }

    // Creamos el "transporter" usando la configuración para Gmail
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true para 465, false para otros puertos como 587 (STARTTLS)
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
      tls: {
        // No fallar en certificados autofirmados (puede ser necesario para algunos entornos locales)
        rejectUnauthorized: false
      }
    });
  }

  /**
   * Envía un correo electrónico.
   * @param mailOptions Opciones del correo (destinatario, asunto, cuerpo, etc.)
   */
  async sendEmail(mailOptions: MailOptions): Promise<void> {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.error('[EmailService] Error: Intent d\'enviar un correu sense les credencials SMTP configurades.');
      // En un caso real, podríamos devolver un error o simplemente no hacer nada.
      // Por seguridad, no lanzaremos un error que pueda parar la ejecución.
      return;
    }

    const options = {
      from: `"EduPresència" <${process.env.SMTP_USER}>`, // El remitente será la cuenta configurada
      ...mailOptions,
    };

    try {
      const info = await this.transporter.sendMail(options);
      console.log(`[EmailService] Correu enviat amb èxit a ${mailOptions.to}. Message ID: ${info.messageId}`);
    } catch (error) {
      console.error(`[EmailService] Error en enviar el correu a ${mailOptions.to}:`, error);
      // Es importante lanzar el error para que la acción del MCP sepa que algo ha fallado
      throw new Error("Error del servei d'email al enviar el correu.");
    }
  }
}

// Exportamos una única instancia del servicio para usarla en toda la aplicación (patrón Singleton)
export const emailService = new EmailService();
