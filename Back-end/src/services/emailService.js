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
        from: `"Plateforme Audit GRC" <${process.env.SMTP_USER}>`,
        to,
        subject: 'Votre compte Plateforme Audit GRC a été créé',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1e3a5f;">Bienvenue sur la Plateforme Audit GRC</h2>
                <p>Bonjour <strong>${prenom} ${nom}</strong>,</p>
                <p>Un compte a été créé pour vous sur la plateforme d'audit de conformité GRC.</p>
                <p>Voici vos identifiants de connexion :</p>
                <div style="background: #f4f4f4; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Email :</strong> ${to}</p>
                    <p style="margin: 5px 0;"><strong>Mot de passe temporaire :</strong> <code style="background: #e0e0e0; padding: 2px 8px; border-radius: 3px;">${tempPassword}</code></p>
                </div>
                <p style="color: #d32f2f;"><strong>Important :</strong> Vous devrez changer ce mot de passe lors de votre première connexion.</p>
                <p>Cordialement,<br>L'équipe GRC</p>
            </div>
        `,
    };

    await transporter.sendMail(mailOptions);
};

const sendResetPasswordEmail = async (to, nom, prenom, resetToken) => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

    const mailOptions = {
        from: `"Plateforme Audit GRC" <${process.env.SMTP_USER}>`,
        to,
        subject: 'Réinitialisation de votre mot de passe — Plateforme Audit GRC',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1e3a5f;">Réinitialisation de mot de passe</h2>
                <p>Bonjour <strong>${prenom} ${nom}</strong>,</p>
                <p>Une demande de réinitialisation de mot de passe a été effectuée pour votre compte.</p>
                <p>Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe :</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetLink}" style="background: #2563eb; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                        Réinitialiser mon mot de passe
                    </a>
                </div>
                <p style="color: #666; font-size: 13px;">Ce lien est valable <strong>1 heure</strong>. Si vous n'avez pas fait cette demande, ignorez cet email.</p>
                <p>Cordialement,<br>L'équipe GRC</p>
            </div>
        `,
    };

    await transporter.sendMail(mailOptions);
};

module.exports = { sendTempPasswordEmail, sendResetPasswordEmail };
