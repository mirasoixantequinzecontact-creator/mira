// ============================================================
//  CHANGER UN MOT DE PASSE
//  Usage :  npm run password -- email@exemple.com "nouveau-mot-de-passe"
// ============================================================
const bcrypt = require('bcryptjs');
const { db } = require('./db');

const [email, pwd] = process.argv.slice(2);
if (!email || !pwd) {
  console.error('Usage : npm run password -- email@exemple.com "nouveau-mot-de-passe"');
  process.exit(1);
}
if (pwd.length < 12) {
  console.error('Mot de passe trop court : 12 caractères minimum.');
  process.exit(1);
}
const r = db.prepare('UPDATE users SET password_hash = ? WHERE email = ?')
  .run(bcrypt.hashSync(pwd, 12), email.trim().toLowerCase());
if (!r.changes) { console.error('Aucun compte avec cet email.'); process.exit(1); }

// Déconnecte toutes les sessions ouvertes
try { db.exec('DELETE FROM sessions'); } catch (_) {}
console.log('✓ Mot de passe mis à jour pour ' + email);
