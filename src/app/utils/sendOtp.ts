import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config();

// // Log SMTP configuration for debugging (without showing the password)
// console.log('SMTP Configuration:', {
//   host: process.env.SMTP_HOST,
//   port: process.env.SMTP_PORT,
//   secure: process.env.SMTP_SECURE === 'true',
//   user: process.env.SMTP_USER,
//   from: process.env.SMTP_FROM
// });

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
//debug: true, // Show debug information
 // logger: true // Log information to the console
});

/**
 * Send OTP to user's email
 * @param email Recipient email address
 * @param otp One-time password to send
 */
export const sendOTPEmail = async (email: string, otp: string): Promise<void> => {
  try {
    //nsole.log(`Attempting to send OTP to ${email}`);
    
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: 'Your OTP Code',
      text: `Your OTP code is: ${otp}. It will expire in 5 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #333;">Your One-Time Password</h2>
          <p style="font-size: 16px; color: #555;">Use the following OTP to complete your verification:</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 4px; text-align: center; margin: 20px 0;">
            <h1 style="font-size: 32px; margin: 0; color: #333;">${otp}</h1>
          </div>
          <p style="font-size: 14px; color: #777;">This OTP will expire in 5 minutes.</p>
          <p style="font-size: 14px; color: #777;">If you didn't request this OTP, please ignore this email.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
   //onsole.log('Email sent successfully:', info.messageId);
  } catch (error) {
   //onsole.error('Error in sendOTPEmail function:', error);
    throw error;
  }
};

// Verify connection configuration
transporter.verify(function(error, success) {
  if (error) {
   //onsole.error('SMTP connection error:', error);
  } else {
   //onsole.log('SMTP server is ready to take our messages');
  }
});