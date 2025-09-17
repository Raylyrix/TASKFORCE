const nodemailer = require('nodemailer');
const crypto = require('crypto-js');

class SimpleEmailService {
  constructor() {
    this.transporter = this.createTransporter();
  }

  createTransporter() {
    return nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    });
  }

  async sendEmail(options) {
    try {
      console.log(`📧 Sending email to ${options.to.join(', ')}`);
      
      const mailOptions = {
        from: {
          name: process.env.SMTP_FROM_NAME || 'Taskforce Mailer',
          address: process.env.SMTP_USER || 'noreply@taskforce.com',
        },
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html || `<p>${options.text}</p>`,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email sent successfully: ${result.messageId}`);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Email send failed:', error);
      return { success: false, error: error.message };
    }
  }

  async sendTestEmail(to) {
    return await this.sendEmail({
      to: [to],
      subject: 'Test Email from Taskforce Mailer',
      text: 'This is a test email to verify the email service is working correctly.',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Test Email from Taskforce Mailer</h2>
          <p>This is a test email to verify the email service is working correctly.</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          <p><strong>Service:</strong> Taskforce Mailer Scheduling Service</p>
        </div>
      `,
    });
  }

  async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log('✅ SMTP connection verified');
      return true;
    } catch (error) {
      console.error('❌ SMTP connection failed:', error);
      return false;
    }
  }
}

module.exports = SimpleEmailService;
