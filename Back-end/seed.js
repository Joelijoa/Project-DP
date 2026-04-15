const bcrypt = require('bcryptjs');
const { sequelize, User } = require('./src/models');

const seed = async () => {
    try {
        await sequelize.authenticate();
        await sequelize.sync({ alter: true });

        const existing = await User.findOne({ where: { email: 'jean@example.com' } });
        if (existing) {
            // S'assurer que l'admin n'a pas must_change_password
            await existing.update({ must_change_password: false });
            console.log('Utilisateur admin existe déjà (must_change_password: false)');
            process.exit(0);
        }

        const hash = await bcrypt.hash('motdepasse123', 10);
        await User.create({
            nom: 'Dupont',
            prenom: 'Jean',
            email: 'jean@example.com',
            password: hash,
            role: 'admin',
            organisation: 'GRC Corp',
            must_change_password: false,
        });

        console.log('Utilisateur admin créé avec succès');
        process.exit(0);
    } catch (error) {
        console.error('Erreur seed :', error.message);
        process.exit(1);
    }
};

seed();
