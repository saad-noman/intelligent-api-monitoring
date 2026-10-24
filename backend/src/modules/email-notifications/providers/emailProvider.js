// SMTP email delivery via nodemailer.
// Implements: send({ to, subject, text }) -> Promise<void> and verify() -> Promise<void>.
// SMTP credentials are only passed to the transport; they are never logged or returned.
import nodemailer from 'nodemailer';

// Returns null when SMTP is not configured, so callers can skip delivery honestly.
export function createEmailProvider({ host, port, secure, user, pass, from }) {
  if (!host || !from) return null;

  const transport = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined,
  });

  return {
    async send({ to, subject, text }) {
      await transport.sendMail({ from, to, subject, text });
    },
    // Connects and authenticates with the SMTP server without sending anything.
    async verify() {
      await transport.verify();
    },
  };
}
