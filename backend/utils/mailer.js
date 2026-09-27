const nodemailer = require("nodemailer");

// Configure via .env:
// MAIL_USER=your.gmail@gmail.com
// MAIL_PASS=your_app_password  (Gmail App Password - not your login password)
// MAIL_FROM=PitStop Performance <your.gmail@gmail.com>

let transporter = null;

if (process.env.MAIL_USER && process.env.MAIL_PASS) {
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });
}

const sendMail = async ({ to, subject, html }) => {
  if (!transporter) {
    console.log("[Mailer] Email skipped — MAIL_USER/MAIL_PASS not configured in .env");
    return;
  }
  try {
    await transporter.sendMail({
      from: process.env.MAIL_FROM || `PitStop Performance <${process.env.MAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`[Mailer] Email sent to ${to}: ${subject}`);
  } catch (err) {
    console.error(`[Mailer] Failed to send email to ${to}:`, err.message);
  }
};

const sendJobCompletedEmail = async ({ to, customerName, jobNumber, vehicleMake, vehicleModel, licensePlate }) => {
  await sendMail({
    to,
    subject: `✅ Your Vehicle is Ready — Job ${jobNumber} | PitStop Performance`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f1f5f9; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 32px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; color: #fff;">🏁 Vehicle Ready!</h1>
          <p style="margin: 8px 0 0; color: rgba(255,255,255,0.85); font-size: 15px;">Your vehicle service has been completed</p>
        </div>
        <div style="padding: 32px;">
          <p style="font-size: 16px; margin: 0 0 20px;">Dear <strong>${customerName}</strong>,</p>
          <p style="color: #94a3b8; margin: 0 0 24px;">We are pleased to inform you that your vehicle service at <strong style="color: #f59e0b;">PitStop Performance Workshop</strong> has been completed successfully.</p>
          <div style="background: #1e293b; border-radius: 8px; padding: 20px; margin-bottom: 24px; border-left: 4px solid #f59e0b;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="color: #94a3b8; padding: 6px 0; font-size: 13px;">Job Number</td><td style="font-weight: bold; color: #fbbf24; font-size: 13px;">${jobNumber}</td></tr>
              <tr><td style="color: #94a3b8; padding: 6px 0; font-size: 13px;">Vehicle</td><td style="font-weight: bold; color: #f1f5f9; font-size: 13px;">${vehicleMake} ${vehicleModel}</td></tr>
              <tr><td style="color: #94a3b8; padding: 6px 0; font-size: 13px;">License Plate</td><td style="font-weight: bold; color: #f1f5f9; font-size: 13px;">${licensePlate}</td></tr>
              <tr><td style="color: #94a3b8; padding: 6px 0; font-size: 13px;">Status</td><td style="color: #4ade80; font-weight: bold; font-size: 13px;">✅ COMPLETED</td></tr>
            </table>
          </div>
          <p style="color: #94a3b8; font-size: 14px; margin: 0 0 24px;">You can collect your vehicle at any time during our working hours. Please bring this email or your job card number when collecting.</p>
          <div style="text-align: center;">
            <a href="http://localhost:5173/customer" style="background: linear-gradient(135deg, #f59e0b, #d97706); color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: bold; display: inline-block;">View in Portal →</a>
          </div>
        </div>
        <div style="background: #1e293b; padding: 20px; text-align: center; font-size: 12px; color: #475569;">
          <p style="margin: 0;">PitStop Performance Workshop | Thank you for choosing us!</p>
        </div>
      </div>
    `,
  });
};

const sendJobApprovedEmail = async ({ to, customerName, jobNumber }) => {
  await sendMail({
    to,
    subject: `✅ Job Approved — ${jobNumber} | PitStop Performance`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f1f5f9; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #22c55e, #16a34a); padding: 32px; text-align: center;">
          <h1 style="margin: 0; color: #fff;">✅ Estimate Approved</h1>
        </div>
        <div style="padding: 32px;">
          <p>Dear <strong>${customerName}</strong>,</p>
          <p style="color: #94a3b8;">Your high-value estimate for job <strong style="color: #fbbf24;">${jobNumber}</strong> has been approved by the Workshop Manager. Work will now proceed.</p>
        </div>
        <div style="background: #1e293b; padding: 16px; text-align: center; font-size: 12px; color: #475569;">
          PitStop Performance Workshop
        </div>
      </div>
    `,
  });
};

module.exports = { sendMail, sendJobCompletedEmail, sendJobApprovedEmail };
