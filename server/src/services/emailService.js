const nodemailer = require("nodemailer");

let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;
  if (!process.env.SMTP_HOST) return null;

  _transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return _transporter;
}

async function sendEmail({ to, subject, html }) {
  const t = getTransporter();
  if (!t) {
    // SMTP not configured — log to console so nothing silently fails
    console.log(`[Email not sent — SMTP_HOST not configured]\n  To: ${to}\n  Subject: ${subject}`);
    return;
  }
  try {
    await t.sendMail({
      from: process.env.SMTP_FROM || "Milta PRM <noreply@milta.com>",
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error("[Email send failed]", err.message);
  }
}

exports.sendTaskAssignmentEmail = async ({ assigneeName, assigneeEmail, taskName, taskId, dueDate, managerName }) => {
  await sendEmail({
    to: assigneeEmail,
    subject: `[Milta PRM] New Task Assigned: ${taskName}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px">
        <h2 style="color:#0b66e4">New Task Assigned</h2>
        <p>Hi <strong>${assigneeName}</strong>,</p>
        <p>You have been assigned a new task by <strong>${managerName}</strong>:</p>
        <table style="border-collapse:collapse;width:100%;margin:12px 0">
          <tr><td style="padding:8px;border:1px solid #ddd;color:#666">Task</td><td style="padding:8px;border:1px solid #ddd"><strong>${taskName}</strong> (${taskId})</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;color:#666">Due Date</td><td style="padding:8px;border:1px solid #ddd">${dueDate || "Not set"}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;color:#666">Assigned by</td><td style="padding:8px;border:1px solid #ddd">${managerName}</td></tr>
        </table>
        <p>Log in to <strong>Milta PRM</strong> to view and start working on your task.</p>
      </div>
    `,
  });
};

exports.sendDeadlineAlertEmail = async ({ userName, email, taskName, taskId, dueDate }) => {
  await sendEmail({
    to: email,
    subject: `[Milta PRM] Deadline Approaching: ${taskName}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px">
        <h2 style="color:#c52929">Task Deadline Alert</h2>
        <p>Hi <strong>${userName}</strong>,</p>
        <p>The following task is due <strong>within 24 hours</strong>:</p>
        <table style="border-collapse:collapse;width:100%;margin:12px 0">
          <tr><td style="padding:8px;border:1px solid #ddd;color:#666">Task</td><td style="padding:8px;border:1px solid #ddd"><strong>${taskName}</strong> (${taskId})</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;color:#666">Due Date</td><td style="padding:8px;border:1px solid #ddd;color:#c52929"><strong>${dueDate}</strong></td></tr>
        </table>
        <p>Please ensure this task is completed on time.</p>
      </div>
    `,
  });
};

exports.sendWelcomeEmail = async ({ name, email, username, password, role, loginUrl }) => {
  await sendEmail({
    to: email,
    subject: `[Milta PRM] Your account is ready — Welcome, ${name}!`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
        <div style="background:linear-gradient(135deg,#0b66e4,#1077ca);padding:28px 24px;border-radius:12px 12px 0 0">
          <h1 style="margin:0;color:#fff;font-size:22px;font-weight:800">Welcome to Milta PRM</h1>
          <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:14px">Your workspace account is ready</p>
        </div>
        <div style="background:#ffffff;padding:28px 24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px">
          <p style="margin:0 0 18px;color:#334155;font-size:15px">Hi <strong>${name}</strong>,</p>
          <p style="margin:0 0 18px;color:#475569;font-size:14px">
            An account has been created for you on <strong>Milta PRM</strong> with the <strong>${role}</strong> role.
            Use the credentials below to log in.
          </p>

          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:18px 20px;margin:0 0 20px">
            <table style="width:100%;border-collapse:collapse">
              <tr>
                <td style="padding:8px 0;color:#64748b;font-size:13px;width:110px;font-weight:600">Login URL</td>
                <td style="padding:8px 0">
                  <a href="${loginUrl}" style="color:#0b66e4;font-weight:700;font-size:14px">${loginUrl}</a>
                </td>
              </tr>
              <tr>
                <td style="padding:8px 0;border-top:1px solid #e2e8f0;color:#64748b;font-size:13px;font-weight:600">Username</td>
                <td style="padding:8px 0;border-top:1px solid #e2e8f0;font-family:monospace;font-size:14px;font-weight:700;color:#1e293b">${username}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;border-top:1px solid #e2e8f0;color:#64748b;font-size:13px;font-weight:600">Password</td>
                <td style="padding:8px 0;border-top:1px solid #e2e8f0;font-family:monospace;font-size:14px;font-weight:700;color:#1e293b">${password}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;border-top:1px solid #e2e8f0;color:#64748b;font-size:13px;font-weight:600">Role</td>
                <td style="padding:8px 0;border-top:1px solid #e2e8f0;font-size:14px;color:#1e293b">${role}</td>
              </tr>
            </table>
          </div>

          <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;margin:0 0 20px">
            <p style="margin:0;font-size:13px;color:#92400e">
              <strong>Security tip:</strong> Please change your password after your first login.
            </p>
          </div>

          <a href="${loginUrl}" style="display:inline-block;background:linear-gradient(135deg,#0066cc,#0052a3);color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:700;font-size:14px">
            Log in to Milta PRM
          </a>

          <p style="margin:20px 0 0;color:#94a3b8;font-size:12px">
            This email was sent by Milta PRM. If you did not expect this account, please contact your administrator.
          </p>
        </div>
      </div>
    `,
  });
};

exports.sendPasswordResetEmail = async ({ name, email, resetToken, resetUrl }) => {
  await sendEmail({
    to: email,
    subject: `[Milta PRM] Password Reset Request`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto">
        <div style="background:linear-gradient(135deg,#0b66e4,#1077ca);padding:24px;border-radius:12px 12px 0 0">
          <h1 style="margin:0;color:#fff;font-size:20px">Password Reset</h1>
        </div>
        <div style="background:#fff;padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px">
          <p>Hi <strong>${name}</strong>,</p>
          <p>We received a request to reset your Milta PRM password. Click the button below to set a new password:</p>
          <a href="${resetUrl}" style="display:inline-block;background:#0b66e4;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:700;font-size:14px;margin:12px 0">
            Reset My Password
          </a>
          <p style="margin-top:16px;font-size:13px;color:#64748b">Or copy this link into your browser:<br>
            <code style="word-break:break-all;color:#0b66e4">${resetUrl}</code>
          </p>
          <p style="font-size:12px;color:#94a3b8;margin-top:20px">This link expires in 1 hour. If you did not request a password reset, ignore this email.</p>
        </div>
      </div>
    `,
  });
};

exports.sendMilestoneDueEmail = async ({ userName, email, milestoneTitle, dueDate, projectTitle }) => {
  await sendEmail({
    to: email,
    subject: `[Milta PRM] Milestone Due Soon: ${milestoneTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px">
        <h2 style="color:#9f6500">Milestone Deadline Alert</h2>
        <p>Hi <strong>${userName}</strong>,</p>
        <p>The milestone <strong>${milestoneTitle}</strong> on project <strong>${projectTitle}</strong> is due on <strong>${dueDate}</strong>.</p>
        <p>Log in to Milta PRM to review milestone progress.</p>
      </div>
    `,
  });
};
