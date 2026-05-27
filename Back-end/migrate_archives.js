const s = require('./src/config/sequelize');

const sql = `
  ALTER TABLE audits ADD COLUMN IF NOT EXISTS archive_interne         BOOLEAN DEFAULT FALSE;
  ALTER TABLE audits ADD COLUMN IF NOT EXISTS archive_junior          BOOLEAN DEFAULT FALSE;
  ALTER TABLE audits ADD COLUMN IF NOT EXISTS archive_client          BOOLEAN DEFAULT FALSE;
  ALTER TABLE audits ADD COLUMN IF NOT EXISTS rapport_archive_interne BOOLEAN DEFAULT FALSE;
  ALTER TABLE audits ADD COLUMN IF NOT EXISTS rapport_archive_junior  BOOLEAN DEFAULT FALSE;
  ALTER TABLE audits ADD COLUMN IF NOT EXISTS rapport_archive_client  BOOLEAN DEFAULT FALSE;
  UPDATE audits SET archive_interne = TRUE WHERE statut = 'archive';
  UPDATE audits SET statut = 'termine' WHERE statut = 'archive';
`;

s.query(sql)
  .then(() => console.log('Migration OK'))
  .catch(e => console.error('ERREUR:', e.message))
  .finally(() => process.exit());
