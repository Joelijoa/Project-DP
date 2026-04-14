const bcrypt = require('bcryptjs');
const pool = require('./src/config/db');

const seed = async () => {
  const hash = await bcrypt.hash('motdepasse123', 10);
  await pool.query(
    `INSERT INTO users (nom, prenom, email, password, role)
     VALUES ('Dupont', 'Jean', 'jean@example.com', $1, 'admin')`,
    [hash]
  );
  console.log('Utilisateur créé');
  process.exit();
};
seed();