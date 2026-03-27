const nodemailer = require('nodemailer');

// Mock transport for development/prototype (uses ethereal email)
// Replace with actual SMTP settings for production
const createTransporter = async () => {
  // If we have actual SMTP details via environment variables, use them
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Fallback: Generate test SMTP service account from ethereal.email
  let testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: testAccount.user, // generated ethereal user
      pass: testAccount.pass, // generated ethereal password
    },
  });
};

/**
 * Send email notification for status change
 */
const sendStatusChangeEmail = async (complaint, newStatus) => {
  try {
    if (!complaint.email) {
      console.log(`No email attached to complaint ${complaint.id}. Skipping notification.`);
      return { success: true, message: 'No email to notify' };
    }

    const transporter = await createTransporter();

    let subject, text;
    if (newStatus === 'resolved') {
      subject = `Road Aware: Your complaint #${complaint.id.split('-')[0]} has been resolved!`;
      text = `Hello ${complaint.name || 'Citizen'},\n\nGood news! Your reported road damage has been fixed. Thank you for making our roads safer.\n\nStatus: RESOLVED\n\n- The Road Aware Team`;
    } else {
      subject = `Road Aware: Status update for complaint #${complaint.id.split('-')[0]}`;
      text = `Hello ${complaint.name || 'Citizen'},\n\nThe status of your reported road damage has been updated to: ${newStatus.toUpperCase()}.\n\n- The Road Aware Team`;
    }

    let info = await transporter.sendMail({
      from: '"Road Aware" <noreply@roadaware.gov>',
      to: complaint.email,
      subject: subject,
      text: text,
    });

    console.log("Message sent to %s: %s", complaint.email, info.messageId);
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error };
  }
};

/**
 * Send email notification for complaint creation
 */
const sendComplaintCreatedEmail = async (complaint) => {
  try {
    if (!complaint.email) return { success: true };

    const transporter = await createTransporter();
    const trackingId = complaint.id.split('-')[0];
    
    let info = await transporter.sendMail({
      from: '"Road Aware" <noreply@roadaware.gov>',
      to: complaint.email,
      subject: `Road Aware: Complaint Received (#${trackingId})`,
      text: `Hello ${complaint.name || 'Citizen'},\n\nWe have successfully received your road damage report. \n\nYour tracking ID is: ${complaint.id}\n\nYou can track the status of your reported issue anytime in the app.\n\n- The Road Aware Team`,
    });

    console.log("Creation email sent: %s", nodemailer.getTestMessageUrl(info));
    return { success: true };
  } catch (error) {
    console.error("Error sending creation email:", error);
    return { success: false };
  }
};

module.exports = {
  sendStatusChangeEmail,
  sendComplaintCreatedEmail
};
