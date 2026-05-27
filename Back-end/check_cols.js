const s = require('./src/config/sequelize');
s.query("SELECT column_name FROM information_schema.columns WHERE table_name='audits' AND column_name IN ('archive_client','archive_junior','archive_interne','rapport_archive_client','rapport_archive_junior','rapport_archive_interne')")
  .then(([r]) => {
    const found = r.map(x => x.column_name);
    console.log('Colonnes trouvées :', found);
    const expected = ['archive_client','archive_junior','archive_interne','rapport_archive_client','rapport_archive_junior','rapport_archive_interne'];
    const missing = expected.filter(c => !found.includes(c));
    if (missing.length) console.log('MANQUANTES :', missing);
    else console.log('OK : toutes les colonnes existent');
  })
  .catch(e => console.error('ERREUR DB:', e.message))
  .finally(() => process.exit());
