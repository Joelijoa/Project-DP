const sequelize = require('../config/sequelize');
const User = require('./User');
const Referentiel = require('./Referentiel');
const Domaine = require('./Domaine');
const Objectif = require('./Objectif');
const Mesure = require('./Mesure');
const Audit = require('./Audit');
const AuditAuditeur = require('./AuditAuditeur');
const Evaluation = require('./Evaluation');
const PlanAction = require('./PlanAction');
const SoA = require('./SoA');
const Entite = require('./Entite');
const Log = require('./Log');

// ========== ASSOCIATIONS ==========

// Referentiel -> Domaines
Referentiel.hasMany(Domaine, { foreignKey: 'referentiel_id', as: 'domaines' });
Domaine.belongsTo(Referentiel, { foreignKey: 'referentiel_id', as: 'referentiel' });

// Domaine -> Objectifs
Domaine.hasMany(Objectif, { foreignKey: 'domaine_id', as: 'objectifs' });
Objectif.belongsTo(Domaine, { foreignKey: 'domaine_id', as: 'domaine' });

// Objectif -> Mesures
Objectif.hasMany(Mesure, { foreignKey: 'objectif_id', as: 'mesures' });
Mesure.belongsTo(Objectif, { foreignKey: 'objectif_id', as: 'objectif' });

// Audit -> Referentiel
Audit.belongsTo(Referentiel, { foreignKey: 'referentiel_id', as: 'referentiel' });
Referentiel.hasMany(Audit, { foreignKey: 'referentiel_id', as: 'audits' });

// Audit -> Créateur (User)
Audit.belongsTo(User, { foreignKey: 'created_by', as: 'createur' });
User.hasMany(Audit, { foreignKey: 'created_by', as: 'audits_crees' });

// Audit <-> User (many-to-many via AuditAuditeur)
Audit.belongsToMany(User, { through: AuditAuditeur, foreignKey: 'audit_id', otherKey: 'user_id', as: 'auditeurs' });
User.belongsToMany(Audit, { through: AuditAuditeur, foreignKey: 'user_id', otherKey: 'audit_id', as: 'audits_assignes' });

// Evaluation -> Audit
Evaluation.belongsTo(Audit, { foreignKey: 'audit_id', as: 'audit' });
Audit.hasMany(Evaluation, { foreignKey: 'audit_id', as: 'evaluations' });

// Evaluation -> Mesure
Evaluation.belongsTo(Mesure, { foreignKey: 'mesure_id', as: 'mesure' });
Mesure.hasMany(Evaluation, { foreignKey: 'mesure_id', as: 'evaluations' });

// Evaluation -> User (updated_by)
Evaluation.belongsTo(User, { foreignKey: 'updated_by', as: 'modificateur' });

// PlanAction -> Audit
PlanAction.belongsTo(Audit, { foreignKey: 'audit_id', as: 'audit' });
Audit.hasMany(PlanAction, { foreignKey: 'audit_id', as: 'plans_actions' });

// PlanAction -> Mesure
PlanAction.belongsTo(Mesure, { foreignKey: 'mesure_id', as: 'mesure' });
Mesure.hasMany(PlanAction, { foreignKey: 'mesure_id', as: 'plans_actions' });

// SoA -> Audit
SoA.belongsTo(Audit, { foreignKey: 'audit_id', as: 'audit' });
Audit.hasMany(SoA, { foreignKey: 'audit_id', as: 'soa_entries' });

// SoA -> Mesure
SoA.belongsTo(Mesure, { foreignKey: 'mesure_id', as: 'mesure' });
Mesure.hasMany(SoA, { foreignKey: 'mesure_id', as: 'soa_entries' });

// Entite -> Audits
Entite.hasMany(Audit, { foreignKey: 'entite_id', as: 'audits' });
Audit.belongsTo(Entite, { foreignKey: 'entite_id', as: 'entite' });

// Log -> User
Log.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(Log, { foreignKey: 'user_id', as: 'logs' });

module.exports = {
    sequelize,
    User,
    Referentiel,
    Domaine,
    Objectif,
    Mesure,
    Audit,
    AuditAuditeur,
    Evaluation,
    PlanAction,
    SoA,
    Entite,
    Log,
};
