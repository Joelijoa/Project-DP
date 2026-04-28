const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const sendTempPasswordEmail = async (to, nom, prenom, tempPassword) => {
    const mailOptions = {
        from: `"ZeroGap — DataProtect" <${process.env.SMTP_USER}>`,
        to,
        subject: 'Votre accès à ZeroGap a été créé',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a2e;">
                <div style="background: #1a1a2e; padding: 24px 32px; border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 22px; letter-spacing: -0.5px;">
                        Zero<span style="color: #cc0000;">Gap</span>
                    </h1>
                    <p style="margin: 4px 0 0; color: #9ca3af; font-size: 12px;">GRC Audit Platform — DataProtect</p>
                </div>
                <div style="background: #ffffff; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
                    <h2 style="margin: 0 0 16px; font-size: 18px; color: #1a1a2e;">Bienvenue sur ZeroGap</h2>
                    <p style="margin: 0 0 12px; color: #374151;">Bonjour <strong>${prenom} ${nom}</strong>,</p>
                    <p style="margin: 0 0 20px; color: #374151;">Un compte a été créé pour vous sur la plateforme ZeroGap de DataProtect. Vous pouvez dès maintenant vous connecter avec les identifiants ci-dessous.</p>
                    <div style="background: #f9fafb; border: 1px solid #e5e7eb; padding: 16px 20px; border-radius: 8px; margin: 0 0 20px;">
                        <p style="margin: 0 0 8px; font-size: 13px;"><span style="color: #6b7280;">Email :</span> <strong>${to}</strong></p>
                        <p style="margin: 0; font-size: 13px;"><span style="color: #6b7280;">Mot de passe temporaire :</span> <code style="background: #e5e7eb; padding: 3px 10px; border-radius: 4px; font-size: 14px; letter-spacing: 1px;">${tempPassword}</code></p>
                    </div>
                    <p style="margin: 0 0 24px; font-size: 13px; color: #cc0000; background: #fff5f5; border: 1px solid #fecaca; padding: 10px 14px; border-radius: 6px;">
                        <strong>Important :</strong> Vous devrez changer ce mot de passe lors de votre première connexion.
                    </p>
                    <p style="margin: 0; color: #6b7280; font-size: 13px;">Cordialement,<br><strong style="color: #374151;">L'équipe DataProtect</strong></p>
                </div>
            </div>
        `,
    };

    await transporter.sendMail(mailOptions);
};

const sendResetPasswordEmail = async (to, nom, prenom, resetToken) => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

    const mailOptions = {
        from: `"ZeroGap — DataProtect" <${process.env.SMTP_USER}>`,
        to,
        subject: 'Réinitialisation de votre mot de passe — ZeroGap',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a2e;">
                <div style="background: #1a1a2e; padding: 24px 32px; border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 22px; letter-spacing: -0.5px;">
                        Zero<span style="color: #cc0000;">Gap</span>
                    </h1>
                    <p style="margin: 4px 0 0; color: #9ca3af; font-size: 12px;">GRC Audit Platform — DataProtect</p>
                </div>
                <div style="background: #ffffff; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
                    <h2 style="margin: 0 0 16px; font-size: 18px; color: #1a1a2e;">Réinitialisation de mot de passe</h2>
                    <p style="margin: 0 0 12px; color: #374151;">Bonjour <strong>${prenom} ${nom}</strong>,</p>
                    <p style="margin: 0 0 24px; color: #374151;">Une demande de réinitialisation de mot de passe a été effectuée pour votre compte ZeroGap. Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe.</p>
                    <div style="text-align: center; margin: 0 0 24px;">
                        <a href="${resetLink}" style="background: #cc0000; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">
                            Réinitialiser mon mot de passe
                        </a>
                    </div>
                    <p style="margin: 0 0 24px; font-size: 13px; color: #6b7280; background: #f9fafb; border: 1px solid #e5e7eb; padding: 10px 14px; border-radius: 6px;">
                        Ce lien est valable <strong>1 heure</strong>. Si vous n'avez pas fait cette demande, ignorez cet email.
                    </p>
                    <p style="margin: 0; color: #6b7280; font-size: 13px;">Cordialement,<br><strong style="color: #374151;">L'équipe DataProtect</strong></p>
                </div>
            </div>
        `,
    };

    await transporter.sendMail(mailOptions);
};

const sendNotificationEmail = async (to, nom, prenom, titre, message) => {
    const mailOptions = {
        from: `"ZeroGap — DataProtect" <${process.env.SMTP_USER}>`,
        to,
        subject: `${titre} — ZeroGap`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a2e;">
                <div style="background: #1a1a2e; padding: 24px 32px; border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 22px; letter-spacing: -0.5px;">
                        Zero<span style="color: #cc0000;">Gap</span>
                    </h1>
                    <p style="margin: 4px 0 0; color: #9ca3af; font-size: 12px;">GRC Audit Platform — DataProtect</p>
                </div>
                <div style="background: #ffffff; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
                    <h2 style="margin: 0 0 16px; font-size: 18px; color: #1a1a2e;">${titre}</h2>
                    <p style="margin: 0 0 12px; color: #374151;">Bonjour <strong>${prenom} ${nom}</strong>,</p>
                    <p style="margin: 0 0 24px; color: #374151;">${message}</p>
                    <p style="margin: 0; color: #6b7280; font-size: 13px;">Cordialement,<br><strong style="color: #374151;">L'équipe DataProtect</strong></p>
                </div>
            </div>
        `,
    };
    await transporter.sendMail(mailOptions);
};

module.exports = { sendTempPasswordEmail, sendResetPasswordEmail, sendNotificationEmail };
