const Brevo = require('@getbrevo/brevo');

const sendWelcomeEmail = async (email, name) => {
    try {
        const client = new Brevo.BrevoClient({ apiKey: process.env.BREVO_API_KEY });

        const emailData = {
            subject: "Welcome to AnalyzeGit!",
            htmlContent: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px 20px; color: #1e293b; background-color: #f8fafc; text-align: center;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 48px; border-radius: 32px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);">
                        <div style="display: inline-block; padding: 12px; background-color: #eff6ff; border-radius: 16px; margin-bottom: 24px;">
                            <div style="font-size: 24px; font-weight: 800; letter-spacing: -0.025em; color: #1e293b;">
                                Analyze<span style="color: #2563eb;">Git</span>
                            </div>
                        </div>
                        
                        <h2 style="font-size: 28px; font-weight: 800; color: #0f172a; margin-bottom: 16px; letter-spacing: -0.025em;">Welcome aboard, ${name}!</h2>
                        <p style="font-size: 16px; color: #64748b; line-height: 24px; margin-bottom: 32px;">
                            We're thrilled to have you join <b>AnalyzeGit</b>. You've just unlocked professional-grade repository auditing and developer persona scoring.
                        </p>
                        
                        <div style="padding: 24px; background-color: #f1f5f9; border-radius: 20px; text-align: left; margin-bottom: 32px;">
                            <h4 style="margin: 0 0 12px 0; color: #475569; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">What's next?</h4>
                            <ul style="margin: 0; padding-left: 20px; color: #64748b; font-size: 15px; line-height: 22px;">
                                <li>Run deep architectural audits</li>
                                <li>Export PDF report</li>
                                <li>Track your repository quality history</li>
                            </ul>
                        </div>

                        <p style="font-size: 14px; color: #94a3b8; font-style: italic;">
                            Happy Coding!<br />
                            <span style="color: #2563eb; font-weight: 700; font-style: normal;">— The AnalyzeGit Team</span>
                        </p>
                    </div>
                </div>
            `,
            sender: { "name": "AnalyzeGit", "email": process.env.BREVO_SENDER_EMAIL || "noreply@analyzegit.com" },
            to: [{ "email": email, "name": name }]
        };

        const data = await client.transactionalEmails.sendTransacEmail(emailData);
        console.log('Brevo Email sent successfully. Message ID:', data.messageId);
    } catch (error) {
        console.error('Brevo Email Service Error:', error);
    }
};

const sendOTPEmail = async (email, name, otp) => {
    try {
        const client = new Brevo.BrevoClient({ apiKey: process.env.BREVO_API_KEY });

        const emailData = {
            subject: `${otp} is your AnalyzeGit Verification Code`,
            htmlContent: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px 20px; color: #1e293b; background-color: #f8fafc; text-align: center;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 48px; border-radius: 32px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);">
                        <div style="display: inline-block; padding: 12px; background-color: #eff6ff; border-radius: 16px; margin-bottom: 24px;">
                            <div style="font-size: 24px; font-weight: 800; letter-spacing: -0.025em; color: #1e293b;">
                                Analyze<span style="color: #2563eb;">Git</span>
                            </div>
                        </div>

                        <h2 style="font-size: 28px; font-weight: 800; color: #0f172a; margin-bottom: 16px; letter-spacing: -0.025em;">Verify your email</h2>
                        <p style="font-size: 16px; color: #64748b; line-height: 24px; margin-bottom: 40px;">
                            Hello ${name}, use the verification code below to complete your registration. This code is valid for <b>5 minutes</b>.
                        </p>
                        
                        <div style="margin: 0 auto 40px auto; padding: 32px; background-color: #f8fafc; border: 2px dashed #e2e8f0; border-radius: 24px; width: fit-content;">
                            <span style="font-size: 48px; font-weight: 900; letter-spacing: 12px; color: #2563eb; font-family: 'Courier New', Courier, monospace; display: block;">${otp}</span>
                        </div>

                        <div style="padding: 16px; background-color: #fffbeb; border-radius: 12px; margin-bottom: 32px;">
                            <p style="margin: 0; font-size: 13px; color: #b45309; line-height: 18px;">
                                <b>Security Reminder:</b> Never share this code with anyone. Our team will never ask for your verification code.
                            </p>
                        </div>

                        <p style="font-size: 14px; color: #94a3b8;">
                            If you didn't request this code, you can safely ignore this email.
                        </p>
                    </div>
                    
                    <div style="margin-top: 24px; color: #94a3b8; font-size: 12px;">
                        &copy; ${new Date().getFullYear()} AnalyzeGit. All rights reserved.
                    </div>
                </div>
            `,
            sender: { "name": "AnalyzeGit", "email": process.env.BREVO_SENDER_EMAIL },
            to: [{ "email": email, "name": name }]
        };

        await client.transactionalEmails.sendTransacEmail(emailData);
    } catch (error) {
        console.error('Brevo OTP Email Error:', error);
    }
};

module.exports = { sendWelcomeEmail, sendOTPEmail };
