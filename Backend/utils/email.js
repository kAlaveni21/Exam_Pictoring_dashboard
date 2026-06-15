let nodemailer = null;

try {
  nodemailer = require('nodemailer');
} catch (error) {
  nodemailer = null;
}

const formatSchedule = (exam) => {
  if (!exam.startTime) return 'a date to be announced';

  const start = new Date(exam.startTime);
  if (Number.isNaN(start.getTime())) return 'a date to be announced';

  const date = start.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  const time = start.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return `${date} at ${time}`;
};

const getTransporter = () => {
  if (!nodemailer) return null;

  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true' || Number(process.env.SMTP_PORT) === 465,
      auth: process.env.SMTP_USER && process.env.SMTP_PASS
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        : undefined
    });
  }

  if (process.env.EMAIL_SERVICE && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  return null;
};

const sendMail = async ({ to, subject, text, html }) => {
  const recipients = Array.isArray(to) ? to.filter(Boolean) : [to].filter(Boolean);
  if (!recipients.length) {
    return { sent: 0, skipped: true, reason: 'No recipients.' };
  }

  const transporter = getTransporter();
  const from = process.env.EMAIL_FROM || process.env.SMTP_USER || process.env.EMAIL_USER || 'ExamGuard <no-reply@examguard.local>';

  if (!transporter) {
    console.log('[Email preview]', { to: recipients, subject, text });
    return {
      sent: 0,
      skipped: true,
      reason: nodemailer ? 'SMTP settings are not configured.' : 'nodemailer is not installed.',
      previewed: recipients.length
    };
  }

  await transporter.sendMail({
    from,
    to: recipients.join(','),
    subject,
    text,
    html
  });

  return { sent: recipients.length, skipped: false };
};

const sendExamScheduleEmail = async (exam, students, mode = 'scheduled') => {
  const recipients = students
    .map(student => student.email)
    .filter(Boolean);

  const schedule = formatSchedule(exam);
  const subject = mode === 'updated'
    ? `Exam updated: ${exam.title} on ${schedule}`
    : `Exam scheduled: ${exam.title} on ${schedule}`;

  const text = [
    `Hello,`,
    ``,
    `You have ${mode === 'updated' ? 'an updated exam schedule' : 'a new exam'} for ${exam.title}.`,
    `Date and time: ${schedule}`,
    `Duration: ${exam.duration || 0} minutes`,
    ``,
    `Please log in to ExamGuard before the exam time and complete OTP and face verification.`
  ].join('\n');

  const html = `
    <p>Hello,</p>
    <p>You have ${mode === 'updated' ? 'an updated exam schedule' : 'a new exam'} for <strong>${exam.title}</strong>.</p>
    <p><strong>Date and time:</strong> ${schedule}</p>
    <p><strong>Duration:</strong> ${exam.duration || 0} minutes</p>
    <p>Please log in to ExamGuard before the exam time and complete OTP and face verification.</p>
  `;

  return sendMail({ to: recipients, subject, text, html });
};

module.exports = { sendExamScheduleEmail };
