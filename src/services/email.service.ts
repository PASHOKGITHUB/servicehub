// src/services/email.service.ts - UPDATED FOR GMAIL
import nodemailer from 'nodemailer';
import { config } from '../config';

interface EmailResult {
  success: boolean;
  previewUrl?: string;
}

// Create transporter - Always use Gmail since credentials are provided
const createTransporter = () => {
  console.log('📧 Using Gmail SMTP for email delivery');
  console.log('📧 Email User:', process.env.EMAIL_USER);
  
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('❌ Gmail credentials not found! Please set EMAIL_USER and EMAIL_PASS in .env file');
  }
  
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};


export const sendVerificationEmail = async (
  email: string,
  verificationLink: string
): Promise<EmailResult> => {
  try {
    console.log('📧 Preparing verification email for:', email);
    
    const transporter = createTransporter();
    
    const mailOptions = {
      from: {
        name: 'ServiceHub',
        address: process.env.EMAIL_FROM || 'noreply@servicehub.com'
      },
      to: email,
      subject: '✅ Verify Your ServiceHub Account',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: white; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            .header { text-align: center; background: linear-gradient(135deg, #1EC6D9, #0EA5E9); color: white; padding: 30px; border-radius: 10px 10px 0 0; margin: -20px -20px 20px -20px; }
            .logo { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
            .button { 
              display: inline-block; 
              padding: 15px 30px; 
              background: linear-gradient(135deg, #1EC6D9, #0EA5E9); 
              color: white !important; 
              text-decoration: none; 
              border-radius: 8px; 
              font-weight: bold; 
              margin: 20px 0;
              border: none;
              cursor: pointer;
            }
            .button:hover {
              background: linear-gradient(135deg, #17B3C4, #0D94D1);
            }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px; }
            .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0; color: #856404; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🔧 ServiceHub</div>
              <p>Welcome to your service platform!</p>
            </div>
            
            <h2>Verify Your Email Address</h2>
            <p>Hello!</p>
            <p>Thank you for registering with ServiceHub. To complete your account setup and start booking services, please verify your email address by clicking the button below:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationLink}" class="button">✅ Verify Email Address</a>
            </div>
            
            <div class="warning">
              <strong>⚠️ Important:</strong> This verification link will expire in 24 hours. If you didn't create an account with ServiceHub, please ignore this email.
            </div>
            
            <p><strong>Having trouble with the button?</strong> Make sure you're clicking it from the same device and browser where you registered.</p>
            
            <div class="footer">
              <p>Best regards,<br>The ServiceHub Team</p>
              <p>© 2024 ServiceHub. All rights reserved.</p>
              <p style="font-size: 12px;">This is an automated email. Please do not reply to this message.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        ServiceHub - Verify Your Email Address
        
        Hello!
        
        Thank you for registering with ServiceHub. To complete your account setup, please verify your email address by visiting this link:
        
        ${verificationLink}
        
        This link will expire in 24 hours.
        
        If you didn't create an account with ServiceHub, please ignore this email.
        
        Best regards,
        The ServiceHub Team
      `,
    };

    console.log('📤 Sending verification email...');
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Verification email sent successfully!');
    console.log('📧 Message ID:', info.messageId);
    console.log('📬 Email sent to:', email);
    
    const result: EmailResult = { success: true };
    console.log('📬 Real email sent via Gmail - no preview URL needed');
    
    return result;
  } catch (error: any) {
    console.error('❌ Failed to send verification email:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      response: error.response
    });
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
};

export const sendWelcomeEmail = async (
  email: string,
  name: string
): Promise<EmailResult> => {
  try {
    console.log('📧 Sending welcome email to:', email);
    
    const transporter = createTransporter();
    
    const mailOptions = {
      from: {
        name: 'ServiceHub',
        address: process.env.EMAIL_FROM || 'noreply@servicehub.com'
      },
      to: email,
      subject: '🎉 Welcome to ServiceHub - Your Account is Ready!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to ServiceHub</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: white; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            .header { text-align: center; background: linear-gradient(135deg, #1EC6D9, #0EA5E9); color: white; padding: 30px; border-radius: 10px 10px 0 0; margin: -20px -20px 20px -20px; }
            .logo { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
            .button { display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #1EC6D9, #0EA5E9); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 10px; }
            .feature { background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #1EC6D9; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🔧 ServiceHub</div>
              <p>Your service platform awaits!</p>
            </div>
            
            <h2>Welcome aboard, ${name}! 🎉</h2>
            <p>Congratulations! Your email has been verified and your ServiceHub account is now active.</p>
            
            <h3>What's next?</h3>
            <div class="feature">
              <strong>🔍 Browse Services</strong><br>
              Discover trusted professionals for home repair, beauty, grocery delivery, and pet care.
            </div>
            
            <div class="feature">
              <strong>📅 Book Instantly</strong><br>
              Schedule services at your convenience with our easy booking system.
            </div>
            
            <div class="feature">
              <strong>💳 Secure Payments</strong><br>
              Pay safely with multiple payment options and wallet features.
            </div>
            
            <div class="feature">
              <strong>⭐ Rate & Review</strong><br>
              Help our community by sharing your experience with service providers.
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/user-dashboard" class="button">🚀 Start Exploring</a>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/browse" class="button">📋 Browse Services</a>
            </div>
            
            <p>Need help getting started? Our support team is here to assist you every step of the way.</p>
            
            <div class="footer">
              <p>Best regards,<br>The ServiceHub Team</p>
              <p>© 2024 ServiceHub. All rights reserved.</p>
              <p style="font-size: 12px;">
                Follow us: 
                <a href="#" style="color: #1EC6D9;">Facebook</a> | 
                <a href="#" style="color: #1EC6D9;">Twitter</a> | 
                <a href="#" style="color: #1EC6D9;">Instagram</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        ServiceHub - Welcome!
        
        Welcome aboard, ${name}!
        
        Congratulations! Your email has been verified and your ServiceHub account is now active.
        
        What's next?
        - Browse trusted service providers
        - Book services instantly
        - Make secure payments
        - Rate and review services
        
        Visit your dashboard: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/user-dashboard
        
        Best regards,
        The ServiceHub Team
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Welcome email sent successfully!');
    console.log('📧 Message ID:', info.messageId);
    
    const result: EmailResult = { success: true };
    console.log('📬 Real welcome email sent via Gmail');
    
    return result;
  } catch (error: any) {
    console.error('❌ Failed to send welcome email:', error);
    return { success: false };
  }
};