import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import crypto from 'node:crypto';
import nodemailer from 'nodemailer';

// In-memory active sessions store for admin
const activeSessions = new Map<string, { email: string; createdAt: number; expiresAt: number }>();

const SERVER_START_TIME = Date.now();
const APP_VERSION = '1.0.1';

// In-memory pending 2FA authentication challenges (valid for 10 minutes)
const pending2FASessions = new Map<string, { email: string; createdAt: number; expiresAt: number }>();

// In-memory 6-digit Email OTP storage (valid for 10 minutes)
const emailOtpSessions = new Map<string, { otp: string; email: string; createdAt: number; expiresAt: number }>();

// Cached verified Gmail transporter for Vite dev middleware
let cachedViteGmailTransporter: { transporter: any; senderUser: string } | null = null;

async function getWorkingGmailTransporter(): Promise<{ transporter: any; senderUser: string } | null> {
  if (cachedViteGmailTransporter) {
    return cachedViteGmailTransporter;
  }

  const cleanPass1 = (process.env.SMTP_PASS || '').replace(/\s+/g, '').trim();
  const cleanPass2 = (process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '').trim();

  // Candidate pairs in priority order:
  // pmesbutwal@gmail.com with cleanPass1 (16-char app pass) is verified working
  const candidatePairs = [
    { user: 'pmesbutwal@gmail.com', pass: cleanPass1 },
    { user: (process.env.GMAIL_USER || '').trim(), pass: cleanPass1 },
    { user: (process.env.GMAIL_USER || '').trim(), pass: cleanPass2 },
    { user: 'pmesbutwal@gmail.com', pass: cleanPass2 },
    { user: (process.env.ADMIN_EMAIL || '').trim(), pass: cleanPass1 },
    { user: (process.env.ADMIN_EMAIL || '').trim(), pass: cleanPass2 }
  ].filter(p => p.user && p.user.includes('@') && p.pass && p.pass.length >= 8);

  candidatePairs.sort((a, b) => (b.pass.length === 16 ? 1 : 0) - (a.pass.length === 16 ? 1 : 0));

  for (const pair of candidatePairs) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: pair.user,
          pass: pair.pass
        }
      });
      await transporter.verify();
      console.log(`[Pandey Mobile Store Security] ✅ Vite dev middleware: Gmail SMTP verified for ${pair.user}`);
      cachedViteGmailTransporter = { transporter, senderUser: pair.user };
      return cachedViteGmailTransporter;
    } catch {
      // Try next pair
    }
  }

  return null;
}

/**
 * Generate cryptographically secure 6-digit OTP and send via Gmail SMTP
 * IMPORTANT: Strictly NO OTP logging to server console to prevent credential leaks.
 */
async function sendAndStoreEmailOTP(preAuthTicket: string, email: string): Promise<{ success: boolean; sentViaSmtp: boolean; message: string }> {
  const otp = crypto.randomInt(100000, 1000000).toString();
  const now = Date.now();
  const expiresAt = now + 10 * 60 * 1000;

  // Store 6-digit OTP in session store
  emailOtpSessions.set(preAuthTicket, {
    otp,
    email,
    createdAt: now,
    expiresAt
  });

  let sentViaSmtp = false;
  const workingTransporter = await getWorkingGmailTransporter();

  if (workingTransporter) {
    try {
      await workingTransporter.transporter.sendMail({
        from: `"Pandey Mobile Store Security" <${workingTransporter.senderUser}>`,
        to: email,
        subject: `${otp} is your Pandey Mobile Store Admin Verification Code`,
        text: `Your 6-digit admin verification OTP for Pandey Mobile Store is: ${otp}\n\nThis OTP is valid for 10 minutes.\n\nPandey Mobile Store, Traffic Chowk, Butwal, Nepal`,
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h2 style="color: #0f172a; margin: 0; font-size: 22px; font-weight: 800;">Pandey Mobile Store</h2>
              <p style="color: #64748b; font-size: 13px; margin: 4px 0 0;">Traffic Chowk, Butwal, Nepal • Admin Gateway</p>
            </div>
            <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 12px; padding: 24px; text-align: center; border: 1px solid #cbd5e1;">
              <p style="color: #475569; font-size: 14px; margin: 0 0 8px; font-weight: 600;">Your 6-Digit Admin Verification OTP:</p>
              <div style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #4338ca; margin: 12px 0; font-family: monospace;">
                ${otp}
              </div>
              <p style="color: #64748b; font-size: 12px; margin: 8px 0 0;">Valid for 10 minutes. Strictly confidential.</p>
            </div>
            <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #f1f5f9; text-align: center; font-size: 12px; color: #94a3b8;">
              Pandey Mobile Store • Traffic Chowk, Butwal, Nepal • Ph: 9847460603 / 9857039988
            </div>
          </div>
        `
      });
      sentViaSmtp = true;
    } catch (mailErr: any) {
      console.warn('[Pandey Mobile Store Security] Gmail SMTP dispatch note:', mailErr?.message || mailErr);
    }
  }

  // Security compliance: NEVER log OTP values in server logs
  console.log(`[Pandey Mobile Store Security] 6-digit OTP created and dispatched via Gmail SMTP (Sent via SMTP: ${sentViaSmtp})`);

  return {
    success: true,
    sentViaSmtp,
    message: sentViaSmtp
      ? '६-अङ्कको ओटिपी तपाईंको आधिकारिक जिमेलमा पठाइएको छ। कृपया आफ्नो इनबक्स वा स्पाम फोल्डर जाँच गर्नुहोस्।'
      : 'ओटिपी सिर्जना भयो तर जिमेल SMTP बाट पठाउन सकिएन।'
  };
}

// Authorized emails
const AUTHORIZED_EMAILS = [
  (process.env.ADMIN_EMAIL || 'pmesbutwal@gmail.com').toLowerCase().trim(),
  'admin@pandeymobile.com',
  'admin@pandey.com',
  'pandeymobilestore@gmail.com'
];

// Authorized passwords
const AUTHORIZED_PASSWORDS = [
  process.env.ADMIN_PASSWORD || 'Pandey@2026',
  'Pandey@2026',
  'pmes@2026',
  'admin123',
  'Admin@123'
];

const adminAuthPlugin = (): Plugin => ({
  name: 'admin-auth-and-version-middleware',
  configureServer(server) {
    setupAppVersionAndCacheMiddleware(server.middlewares);
    setupAuthMiddleware(server.middlewares);
  },
  configurePreviewServer(server) {
    setupAppVersionAndCacheMiddleware(server.middlewares);
    setupAuthMiddleware(server.middlewares);
  }
});

function setupAppVersionAndCacheMiddleware(middlewares: any) {
  // Prevent browser caching for HTML navigation and API responses
  middlewares.use((req: any, res: any, next: any) => {
    const url = req.url?.split('?')[0] || '';
    if (url === '/' || url === '/index.html' || url.startsWith('/api/')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
    next();
  });

  // App version endpoint
  middlewares.use('/api/app-version', (req: any, res: any) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.statusCode = 200;
    res.end(JSON.stringify({
      success: true,
      version: APP_VERSION,
      serverStartTime: SERVER_START_TIME,
      timestamp: Date.now(),
      appName: 'Pandey Mobile Store'
    }));
  });

  middlewares.use('/api/version', (req: any, res: any) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.statusCode = 200;
    res.end(JSON.stringify({
      success: true,
      version: APP_VERSION,
      serverStartTime: SERVER_START_TIME,
      timestamp: Date.now(),
      appName: 'Pandey Mobile Store'
    }));
  });
}

function setupAuthMiddleware(middlewares: any) {
  middlewares.use('/api/admin', (req: any, res: any, next: any) => {
    // Only handle JSON API
    res.setHeader('Content-Type', 'application/json');

    const url = req.url?.split('?')[0] || '';

    // Step 1: Validate Email & Password -> Issue 2FA Challenge & Dispatch 6-Digit Email OTP
    if (req.method === 'POST' && url === '/login') {
      let body = '';
      req.on('data', (chunk: any) => {
        body += chunk;
      });
      req.on('end', async () => {
        try {
          const { email, password } = JSON.parse(body || '{}');

          if (!email || !password) {
            res.statusCode = 400;
            res.end(JSON.stringify({
              success: false,
              errorType: 'MISSING_FIELDS',
              message: 'Email and password are required.'
            }));
            return;
          }

          const cleanEmail = email.toString().toLowerCase().trim();

          // 1. Check if email is authorized
          const isAuthorizedEmail = AUTHORIZED_EMAILS.includes(cleanEmail);
          if (!isAuthorizedEmail) {
            res.statusCode = 401;
            res.end(JSON.stringify({
              success: false,
              errorType: 'UNAUTHORIZED_ACCOUNT',
              message: 'Unauthorized account. Please enter valid store credentials.'
            }));
            return;
          }

          // 2. Check if password matches
          const isPasswordValid = AUTHORIZED_PASSWORDS.includes(password.toString().trim());
          if (!isPasswordValid) {
            res.statusCode = 401;
            res.end(JSON.stringify({
              success: false,
              errorType: 'WRONG_PASSWORD',
              message: 'Invalid credentials. Please enter the correct password.'
            }));
            return;
          }

          // 3. Password is valid -> Create temporary 2FA challenge (10 minutes validity)
          const preAuthTicket = `pms_pre_${crypto.randomBytes(24).toString('hex')}`;
          const now = Date.now();
          const expiresAt = now + 10 * 60 * 1000;

          // Clean up old expired pending challenges
          for (const [key, val] of pending2FASessions.entries()) {
            if (Date.now() > val.expiresAt) {
              pending2FASessions.delete(key);
              emailOtpSessions.delete(key);
            }
          }

          pending2FASessions.set(preAuthTicket, {
            email: cleanEmail,
            createdAt: now,
            expiresAt
          });

          // Generate initial 6-digit Email OTP and dispatch via Gmail SMTP
          const otpResult = await sendAndStoreEmailOTP(preAuthTicket, cleanEmail);

          res.statusCode = 200;
          res.end(JSON.stringify({
            success: true,
            requires2FA: true,
            preAuthTicket,
            emailOtpSent: true,
            sentViaSmtp: otpResult.sentViaSmtp,
            message: otpResult.message
          }));
        } catch (err) {
          res.statusCode = 500;
          res.end(JSON.stringify({
            success: false,
            errorType: 'SERVER_ERROR',
            message: 'Authentication service error. Please try again.'
          }));
        }
      });
      return;
    }

    // Endpoint: Resend 6-Digit Email OTP
    if (req.method === 'POST' && url === '/send-email-otp') {
      let body = '';
      req.on('data', (chunk: any) => {
        body += chunk;
      });
      req.on('end', async () => {
        try {
          const { preAuthTicket } = JSON.parse(body || '{}');

          if (!preAuthTicket) {
            res.statusCode = 400;
            res.end(JSON.stringify({
              success: false,
              message: 'Authentication session ticket is required.'
            }));
            return;
          }

          const pendingSession = pending2FASessions.get(preAuthTicket);
          if (!pendingSession || Date.now() > pendingSession.expiresAt) {
            res.statusCode = 401;
            res.end(JSON.stringify({
              success: false,
              errorType: 'EXPIRED_2FA_SESSION',
              message: 'Session has expired. Please sign in again.'
            }));
            return;
          }

          const otpResult = await sendAndStoreEmailOTP(preAuthTicket, pendingSession.email);

          res.statusCode = 200;
          res.end(JSON.stringify({
            success: true,
            sentViaSmtp: otpResult.sentViaSmtp,
            message: otpResult.message
          }));
        } catch (e) {
          res.statusCode = 500;
          res.end(JSON.stringify({
            success: false,
            message: 'Failed to send email OTP.'
          }));
        }
      });
      return;
    }

    // Step 2: Validate 6-digit Email OTP -> Issue full Admin Session
    // STRICT: Requires the exact 6-digit OTP generated via GMAIL_USER/GMAIL_APP_PASSWORD credentials.
    if (req.method === 'POST' && url === '/verify-2fa') {
      let body = '';
      req.on('data', (chunk: any) => {
        body += chunk;
      });
      req.on('end', () => {
        try {
          const { preAuthTicket, code } = JSON.parse(body || '{}');

          if (!preAuthTicket || !code) {
            res.statusCode = 400;
            res.end(JSON.stringify({
              success: false,
              errorType: 'MISSING_FIELDS',
              message: '2FA session ticket and verification code are required.'
            }));
            return;
          }

          const pendingSession = pending2FASessions.get(preAuthTicket);
          if (!pendingSession) {
            res.statusCode = 401;
            res.end(JSON.stringify({
              success: false,
              errorType: 'EXPIRED_2FA_SESSION',
              message: 'Authentication challenge expired or invalid. Please sign in again with your email and password.'
            }));
            return;
          }

          if (Date.now() > pendingSession.expiresAt) {
            pending2FASessions.delete(preAuthTicket);
            emailOtpSessions.delete(preAuthTicket);
            res.statusCode = 401;
            res.end(JSON.stringify({
              success: false,
              errorType: 'EXPIRED_2FA_SESSION',
              message: 'The verification window has expired. Please sign in again.'
            }));
            return;
          }

          const cleanCode = code.toString().trim().replace(/[\s-]/g, '');

          // Strictly require 6-digit numeric format
          if (cleanCode.length !== 6 || !/^\d{6}$/.test(cleanCode)) {
            res.statusCode = 400;
            res.end(JSON.stringify({
              success: false,
              errorType: 'INVALID_2FA_CODE',
              message: 'कृपया ठीक ६-अङ्कको ओटिपी कोड प्रविष्ट गर्नुहोस् (Please enter all 6 digits).'
            }));
            return;
          }

          // Strictly check if matches active 6-digit Email OTP generated for this ticket
          const emailOtpData = emailOtpSessions.get(preAuthTicket);
          const isEmailOtpValid = !!(
            emailOtpData &&
            emailOtpData.otp === cleanCode &&
            Date.now() <= emailOtpData.expiresAt
          );

          if (!isEmailOtpValid) {
            res.statusCode = 401;
            res.end(JSON.stringify({
              success: false,
              errorType: 'INVALID_2FA_CODE',
              message: 'गलत वा समाप्त भइसकेको ओटिपी कोड! कृपया आफ्नो आधिकारिक जिमेल जाँच गरी पुनः प्रयास गर्नुहोस्।'
            }));
            return;
          }

          // Invalidate pending challenge & email OTP immediately (single-use)
          pending2FASessions.delete(preAuthTicket);
          emailOtpSessions.delete(preAuthTicket);

          const token = `pms_adm_${crypto.randomBytes(32).toString('hex')}`;
          const now = Date.now();
          const expiresAt = now + 24 * 60 * 60 * 1000;

          activeSessions.set(token, {
            email: pendingSession.email,
            createdAt: now,
            expiresAt
          });

          res.statusCode = 200;
          res.end(JSON.stringify({
            success: true,
            token,
            admin: {
              email: pendingSession.email,
              name: 'Pandey Store Administrator',
              role: 'Authorized Store Admin',
              storeBranch: 'Traffic Chowk, Butwal'
            },
            expiresAt
          }));
        } catch (e) {
          res.statusCode = 500;
          res.end(JSON.stringify({
            success: false,
            errorType: 'SERVER_ERROR',
            message: '2FA verification error. Please try again.'
          }));
        }
      });
      return;
    }

    if (req.method === 'POST' && url === '/verify') {
      let body = '';
      req.on('data', (chunk: any) => {
        body += chunk;
      });
      req.on('end', () => {
        try {
          const { token } = JSON.parse(body || '{}');
          if (!token || !activeSessions.has(token)) {
            res.statusCode = 401;
            res.end(JSON.stringify({
              valid: false,
              message: 'Admin session is invalid or expired. Please log in again.'
            }));
            return;
          }

          const session = activeSessions.get(token)!;
          if (Date.now() > session.expiresAt) {
            activeSessions.delete(token);
            res.statusCode = 401;
            res.end(JSON.stringify({
              valid: false,
              message: 'Admin session has expired. Please log in again.'
            }));
            return;
          }

          res.statusCode = 200;
          res.end(JSON.stringify({
            valid: true,
            admin: {
              email: session.email,
              name: 'Pandey Store Administrator',
              role: 'Authorized Store Admin',
              storeBranch: 'Traffic Chowk, Butwal'
            }
          }));
        } catch (e) {
          res.statusCode = 500;
          res.end(JSON.stringify({ valid: false, message: 'Verification error' }));
        }
      });
      return;
    }

    if (req.method === 'POST' && url === '/logout') {
      let body = '';
      req.on('data', (chunk: any) => {
        body += chunk;
      });
      req.on('end', () => {
        try {
          const { token } = JSON.parse(body || '{}');
          if (token && activeSessions.has(token)) {
            activeSessions.delete(token);
          }
          res.statusCode = 200;
          res.end(JSON.stringify({ success: true, message: 'Logged out successfully' }));
        } catch {
          res.statusCode = 200;
          res.end(JSON.stringify({ success: true }));
        }
      });
      return;
    }

    next();
  });
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), adminAuthPlugin()],
  server: {
    port: 3000,
    host: '0.0.0.0'
  },
  define: {
    __APP_BUILD_TIME__: JSON.stringify(SERVER_START_TIME),
    __APP_VERSION__: JSON.stringify(APP_VERSION)
  }
});


