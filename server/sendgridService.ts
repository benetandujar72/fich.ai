import { MailService } from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  console.warn("SENDGRID_API_KEY environment variable not set - email functionality will be disabled");
}

const mailService = new MailService();
if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    content: string;
    filename: string;
    type: string;
    disposition: string;
  }>;
}

export class SendGridService {
  async sendEmail(params: EmailParams): Promise<boolean> {
    if (!process.env.SENDGRID_API_KEY) {
      console.error('SendGrid API key not configured');
      return false;
    }

    try {
      await mailService.send({
        to: params.to,
        from: params.from,
        subject: params.subject,
        text: params.text || '',
        html: params.html,
        attachments: params.attachments,
      });
      
      console.log(`Email sent successfully to ${params.to}`);
      return true;
    } catch (error) {
      console.error('SendGrid email error:', error);
      return false;
    }
  }

  async sendCommunicationEmail(
    recipientEmail: string, 
    senderEmail: string,
    senderName: string,
    subject: string, 
    content: string,
    communicationId: string
  ): Promise<boolean> {
    const emailSubject = `[EduPresència] ${subject}`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #1e40af; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">EduPresència</h1>
          <p style="margin: 10px 0 0 0;">Sistema de Comunicacions</p>
        </div>
        
        <div style="background-color: #f8fafc; padding: 20px; border-left: 4px solid #1e40af;">
          <h2 style="color: #1e40af; margin-top: 0;">Nou missatge de ${senderName}</h2>
          <p><strong>De:</strong> ${senderEmail}</p>
          <p><strong>Assumpte:</strong> ${subject}</p>
        </div>
        
        <div style="padding: 20px; background-color: white; border: 1px solid #e2e8f0;">
          <div style="white-space: pre-wrap; line-height: 1.6;">${content}</div>
        </div>
        
        <div style="background-color: #f1f5f9; padding: 15px; font-size: 12px; color: #64748b; text-align: center;">
          <p>Aquest correu ha estat enviat automàticament pel sistema EduPresència.</p>
          <p>Per respondre, utilitzeu la plataforma web del centre educatiu.</p>
          <p style="margin-top: 10px;">
            <strong>ID de comunicació:</strong> ${communicationId}
          </p>
        </div>
      </div>
    `;

    const textContent = `
EduPresència - Sistema de Comunicacions

Nou missatge de ${senderName}
De: ${senderEmail}
Assumpte: ${subject}

${content}

---
Aquest correu ha estat enviat automàticament pel sistema EduPresència.
Per respondre, utilitzeu la plataforma web del centre educatiu.
ID de comunicació: ${communicationId}
    `;

    return this.sendEmail({
      to: recipientEmail,
      from: senderEmail,
      subject: emailSubject,
      text: textContent,
      html: htmlContent,
    });
  }

  async sendAlertEmail(
    recipientEmail: string,
    institutionName: string,
    alertType: string,
    employeeName: string,
    alertContent: string
  ): Promise<boolean> {
    const subject = `[EduPresència] Alerta: ${alertType}`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #dc2626; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">⚠️ EduPresència - Alerta</h1>
          <p style="margin: 10px 0 0 0;">${institutionName}</p>
        </div>
        
        <div style="background-color: #fef2f2; padding: 20px; border-left: 4px solid #dc2626;">
          <h2 style="color: #dc2626; margin-top: 0;">${alertType}</h2>
          <p><strong>Employee:</strong> ${employeeName}</p>
          <p><strong>Data i hora:</strong> ${new Date().toLocaleString('ca-ES')}</p>
        </div>
        
        <div style="padding: 20px; background-color: white; border: 1px solid #e2e8f0;">
          <div style="white-space: pre-wrap; line-height: 1.6;">${alertContent}</div>
        </div>
        
        <div style="background-color: #f1f5f9; padding: 15px; font-size: 12px; color: #64748b; text-align: center;">
          <p>Aquest correu d'alerta ha estat generat automàticament pel sistema EduPresència.</p>
          <p>Accediu a la plataforma per veure més detalls i gestionar les incidències.</p>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: recipientEmail,
      from: `noreply@${institutionName.toLowerCase().replace(/\s+/g, '')}.edu`,
      subject: subject,
      html: htmlContent,
    });
  }
}

export const sendGridService = new SendGridService();