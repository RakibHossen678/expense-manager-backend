import nodemailer from 'nodemailer';
import { ApiError } from '../../errors/ApiError.js';
import { env } from '../../config/env.js';

let transporter;

const getTransporter = () => {
  if (transporter) {
    return transporter;
  }

  if (!env.BREVO_SMTP_USER || !env.BREVO_SMTP_PASS) {
    throw new ApiError(
      500,
      'Mail delivery is not configured. Set BREVO_SMTP_USER and BREVO_SMTP_PASS.'
    );
  }

  transporter = nodemailer.createTransport({
    host: env.BREVO_SMTP_HOST,
    port: env.BREVO_SMTP_PORT,
    secure: env.BREVO_SMTP_PORT === 465,
    auth: {
      user: env.BREVO_SMTP_USER,
      pass: env.BREVO_SMTP_PASS,
    },
  });

  return transporter;
};

export const sendMail = async ({ to, subject, html, text }) => {
  const mailer = getTransporter();

  try {
    await mailer.sendMail({
      from: env.MAIL_FROM,
      to,
      subject,
      html,
      text,
    });
  } catch (error) {
    const isAuthFailure = error?.code === 'EAUTH' || error?.responseCode === 454;

    if (isAuthFailure) {
      throw new ApiError(
        503,
        'Email service authentication failed. Check Brevo SMTP username/password and use a verified sender address.'
      );
    }

    throw new ApiError(503, 'Email service is temporarily unavailable. Please try again later.');
  }
};
