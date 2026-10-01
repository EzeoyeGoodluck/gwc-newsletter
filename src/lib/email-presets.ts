export type EmailPreset = {
  id: string;
  label: string;
  host: string;
  port: number;
  secure: boolean;
  maxPerHour: number | null;
  maxPerDay: number | null;
  batchSize: number;
  batchDelaySec: number;
  help: string;
};

export const EMAIL_PRESETS: EmailPreset[] = [
  {
    id: "namecheap-private",
    label: "Namecheap Private Email",
    host: "mail.privateemail.com",
    port: 465,
    secure: true,
    maxPerHour: 500,
    maxPerDay: null,
    batchSize: 50,
    batchDelaySec: 400,
    help: "Username is your full mailbox address. Paid plans allow about 500 emails per hour per mailbox.",
  },
  {
    id: "namecheap-cpanel",
    label: "Namecheap Hosting Mail (cPanel)",
    host: "mail.yourdomain.com",
    port: 465,
    secure: true,
    maxPerHour: 50,
    maxPerDay: null,
    batchSize: 10,
    batchDelaySec: 720,
    help: "Replace the host with mail.<your domain>. Stellar allows 50/hour, Stellar Plus 200/hour, max 100 recipients per message.",
  },
  {
    id: "brevo",
    label: "Brevo",
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: false,
    maxPerHour: null,
    maxPerDay: 300,
    batchSize: 50,
    batchDelaySec: 60,
    help: "Use your Brevo SMTP login and an SMTP key (not your account password). Free plan: 300 emails/day.",
  },
  {
    id: "resend",
    label: "Resend",
    host: "smtp.resend.com",
    port: 465,
    secure: true,
    maxPerHour: null,
    maxPerDay: 100,
    batchSize: 50,
    batchDelaySec: 30,
    help: 'Username is "resend" and the password is your API key. Free plan: 100/day; raise the limit on Pro.',
  },
  {
    id: "custom",
    label: "Other SMTP server",
    host: "",
    port: 587,
    secure: false,
    maxPerHour: null,
    maxPerDay: null,
    batchSize: 50,
    batchDelaySec: 60,
    help: "Enter the SMTP details from your provider.",
  },
];
