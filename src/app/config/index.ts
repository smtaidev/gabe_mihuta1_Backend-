import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.join(process.cwd(), ".env") });

export default {
  NODE_ENV: process.env.NODE_ENV,
  port: process.env.PORT || 5006,
  databaseUrl: process.env.DATABASE_URL,
  sendEmail: {
    email_from: process.env.EMAIL_FROM,
    brevo_pass: process.env.BREVO_PASS,
    brevo_email: process.env.BREVO_EMAIL,
  },
  jwt: {
    access: {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN,
    },
    refresh: {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
    },
    resetPassword: {
      expiresIn: process.env.JWT_RESET_PASS_ACCESS_EXPIRES_IN,
    },
  },
  imageUrl: process.env.IMAGE_URL,
  backendUrl: process.env.BACKEND_URL,
  frontendUrl: process.env.FRONTEND_URL,
  verifyEmailLink: process.env.VERIFY_EMAIL_LINK,
  resetPassUILink: process.env.RESET_PASS_UI_LINK,
  stripe_secret_key: process.env.STRIPE_SECRET_KEY,
  cloudinaryAPIKey: process.env.CLOUDINARY_API_KEY,
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
  cloudinaryAPISecret: process.env.CLOUDINARY_API_SECRET,
  stripe_webhook_secret: process.env.STRIPE_WEBHOOK_SECRET,
  stripe_success_url: process.env.STRIPE_SUCCESS_URL,
  stripe_cancel_url: process.env.STRIPE_CANCEL_URL,
  stripe_publishable_key: process.env.STRIPE_PUBLISHABLE_KEY,
};
