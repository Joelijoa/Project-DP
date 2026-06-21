const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

const { sequelize } = require('./src/models');
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const referentielRoutes = require('./src/routes/referentielRoutes');
const auditRoutes = require('./src/routes/auditRoutes');
const entiteRoutes = require('./src/routes/entiteRoutes');
const logRoutes    = require('./src/routes/logRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const settingsRoutes = require('./src/routes/settingsRoutes');
const groqRoutes = require('./src/routes/groqRoutes');
const swaggerSpecs = require('./src/config/swagger');
const { verifyToken } = require('./src/middlewares/authMiddleware');
const { getAllPlanActions } = require('./src/controllers/planActionController');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
    customSiteTitle: 'GRC Audit API Docs',
    swaggerOptions: {
        persistAuthorization: true,
    },
}));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/referentiels', referentielRoutes);
app.use('/api/entites', entiteRoutes);
app.use('/api/logs',   logRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/groq', groqRoutes);

// Route globale plans-actions enregistrée AVANT le middleware auditRoutes pour éviter
// que /:id dans auditRoutes ne capte "plans-actions" comme paramètre
app.get('/api/audits/plans-actions', verifyToken, getAllPlanActions);

app.use('/api/audits', auditRoutes);

// Gestionnaire d'erreurs global — retourne toujours du JSON
app.use((err, req, res, next) => {
    console.error('[ERROR]', err.message);
    res.status(err.status || 500).json({ message: err.message || 'Erreur interne du serveur' });
});

const PORT = process.env.PORT || 5000;

const start = async () => {
    try {
        await sequelize.authenticate();
        console.log('PostgreSQL connecté avec succès (Sequelize)');

        // Migration : ENUM → VARCHAR pour referentiels.type + nouvelles colonnes
        try {
            await sequelize.query(`
                DO $$
                BEGIN
                    IF EXISTS (
                        SELECT 1 FROM information_schema.columns
                        WHERE table_name = 'referentiels' AND column_name = 'type' AND data_type = 'USER-DEFINED'
                    ) THEN
                        ALTER TABLE referentiels ALTER COLUMN type TYPE VARCHAR(50) USING type::text;
                    END IF;
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'referentiels' AND column_name = 'evaluation_config') THEN
                        ALTER TABLE referentiels ADD COLUMN evaluation_config JSONB;
                    END IF;
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'referentiels' AND column_name = 'is_custom') THEN
                        ALTER TABLE referentiels ADD COLUMN is_custom BOOLEAN DEFAULT false;
                    END IF;
                END $$;
            `);
        } catch (migErr) {
            console.warn('[Migration] Pré-migration référentiels :', migErr.message);
        }

        await sequelize.sync({ alter: true });
        console.log('Tables synchronisées');

        app.listen(PORT, () => {
            console.log(`Server est lancé sur le port ${PORT}`);
            console.log(`Swagger UI : http://localhost:${PORT}/api-docs`);
        });
    } catch (error) {
        console.error('Erreur de démarrage :', error.message);
        process.exit(1);
    }
};

start();
