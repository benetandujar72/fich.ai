import nodemailer from 'nodemailer';
import { EmailSetting } from '@shared/schema';

export class GmailService {
  private transporter: nodemailer.Transporter | null = null;
  
  constructor(private emailConfig: EmailSetting) {
    this.initializeTransporter();
  }
  
  private initializeTransporter() {
    this.transporter = nodemailer.createTransporter({
      host: this.emailConfig.smtpHost,
      port: this.emailConfig.smtpPort,
      secure: false, // true for 465, false for other ports like 587
      auth: {
        user: this.emailConfig.smtpUser,
        pass: this.emailConfig.smtpPassword, // App-specific password for Gmail
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }
  
  async sendCommunicationEmail({
    to,
    subject,
    content,
    senderName,
    priority = 'medium'
  }: {
    to: string;
    subject: string;
    content: string;
    senderName: string;
    priority?: string;
  }): Promise<boolean> {
    if (!this.transporter) {
      console.error('Gmail transporter not initialized');
      return false;
    }
    
    try {
      const priorityHeaders: Record<string, string> = {
        'low': '5',
        'medium': '3', 
        'high': '2',
        'urgent': '1'
      };
      
      const mailOptions = {
        from: `"${this.emailConfig.senderName}" <${this.emailConfig.senderEmail}>`,
        to: to,
        subject: `[${this.emailConfig.senderName}] ${subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
              <h2 style="color: #333; margin: 0;">Nova comunicació de ${senderName}</h2>
            </div>
            
            <div style="padding: 20px; background-color: #ffffff; border: 1px solid #e9ecef; border-radius: 8px;">
              <h3 style="color: #0066cc; margin-top: 0;">${subject}</h3>
              <div style="margin: 20px 0; line-height: 1.6; color: #333;">
                ${content.replace(/\n/g, '<br>')}
              </div>
            </div>
            
            <div style="margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 8px; font-size: 12px; color: #666;">
              <p style="margin: 0;"><strong>Informació del missatge:</strong></p>
              <p style="margin: 5px 0;">De: ${senderName}</p>
              <p style="margin: 5px 0;">Prioritat: ${priority}</p>
              <p style="margin: 5px 0;">Data: ${new Date().toLocaleDateString('ca-ES')}</p>
            </div>
            
            <div style="margin-top: 20px; padding: 10px; background-color: #e3f2fd; border-left: 4px solid #2196f3; font-size: 11px; color: #555;">
              <p style="margin: 0;"><strong>Sistema de Gestió EduPresència</strong></p>
              <p style="margin: 5px 0;">Aquest missatge ha estat enviat automàticament des del sistema de comunicacions interna.</p>
            </div>
          </div>
        `,
        headers: {
          'X-Priority': priorityHeaders[priority] || '3',
          'X-MSMail-Priority': priority === 'urgent' ? 'High' : priority === 'high' ? 'High' : 'Normal'
        }
      };
      
      const result = await this.transporter.sendMail(mailOptions);
      console.log('Gmail email sent successfully:', result.messageId);
      return true;
      
    } catch (error) {
      console.error('Gmail sending failed:', error);
      return false;
    }
  }
  
  async testConnection(): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }
    
    try {
      await this.transporter.verify();
      console.log('Gmail connection test successful');
      return true;
    } catch (error) {
      console.error('Gmail connection test failed:', error);
      return false;
    }
  }
}

// Singleton service instance
let gmailServiceInstance: GmailService | null = null;

export async function getGmailService(emailConfig: EmailSetting): Promise<GmailService> {
  if (!gmailServiceInstance) {
    gmailServiceInstance = new GmailService(emailConfig);
  }
  return gmailServiceInstance;
}