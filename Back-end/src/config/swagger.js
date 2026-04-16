const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'GRC Audit API',
      version: '1.0.0',
      description: 'API de gestion des risques et conformité — GRC Audit',
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Serveur de développement',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Entrer le token JWT obtenu via POST /api/auth/login',
        },
      },
      responses: {
        Unauthorized: {
          description: 'Token manquant ou invalide',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
      },
      schemas: {
        Entite: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            nom: { type: 'string', example: 'Ministère de la Santé' },
            secteur: { type: 'string', example: 'Administration publique' },
            adresse: { type: 'string', example: '1 Rue de la Santé' },
            ville: { type: 'string', example: 'Rabat' },
            pays: { type: 'string', example: 'Maroc' },
            telephone: { type: 'string', example: '+212 5 37 00 00 00' },
            email: { type: 'string', format: 'email', example: 'contact@sante.gov.ma' },
            site_web: { type: 'string', example: 'https://sante.gov.ma' },
            description: { type: 'string', example: 'Ministère en charge de la politique sanitaire nationale' },
            audits: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'integer', example: 3 },
                  nom: { type: 'string', example: 'Audit DNSSI 2025' },
                  statut: { type: 'string', enum: ['brouillon', 'en_cours', 'termine', 'archive'], example: 'en_cours' },
                  date_debut: { type: 'string', format: 'date', example: '2025-01-15' },
                  date_fin: { type: 'string', format: 'date', example: '2025-03-31' },
                },
              },
            },
          },
        },
        CreateEntiteRequest: {
          type: 'object',
          required: ['nom'],
          properties: {
            nom: { type: 'string', example: 'Ministère de la Santé' },
            secteur: { type: 'string', example: 'Administration publique' },
            adresse: { type: 'string', example: '1 Rue de la Santé' },
            ville: { type: 'string', example: 'Rabat' },
            pays: { type: 'string', example: 'Maroc' },
            telephone: { type: 'string', example: '+212 5 37 00 00 00' },
            email: { type: 'string', format: 'email', example: 'contact@sante.gov.ma' },
            site_web: { type: 'string', example: 'https://sante.gov.ma' },
            description: { type: 'string', example: 'Description de l\'entité' },
          },
        },
        PlanAction: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            audit_id: { type: 'integer', example: 3 },
            mesure_id: { type: 'integer', example: 42 },
            description_nc: { type: 'string', example: 'Absence de politique de gestion des accès' },
            action_corrective: { type: 'string', example: 'Rédiger et diffuser la politique IAM' },
            responsable: { type: 'string', example: 'Jean Dupont' },
            delai: { type: 'string', format: 'date', example: '2025-09-30' },
            priorite: { type: 'string', enum: ['haute', 'moyenne', 'basse'], example: 'haute' },
            statut: { type: 'string', enum: ['a_faire', 'en_cours', 'cloture'], example: 'a_faire' },
            criticite: { type: 'number', format: 'float', example: 4.5 },
            kpi: { type: 'string', example: 'Taux de couverture des comptes gérés par IAM' },
            mesure: {
              type: 'object',
              properties: {
                id: { type: 'integer', example: 42 },
                code: { type: 'string', example: 'MO.1.1.1' },
                description: { type: 'string', example: 'Politique de contrôle des accès' },
              },
            },
            audit: {
              type: 'object',
              properties: {
                id: { type: 'integer', example: 3 },
                nom: { type: 'string', example: 'Audit DNSSI 2025' },
                client: { type: 'string', example: 'Ministère X' },
              },
            },
          },
        },
        CreatePlanActionRequest: {
          type: 'object',
          required: ['mesure_id'],
          properties: {
            mesure_id: { type: 'integer', example: 42 },
            description_nc: { type: 'string', example: 'Absence de politique de gestion des accès' },
            action_corrective: { type: 'string', example: 'Rédiger et diffuser la politique IAM' },
            responsable: { type: 'string', example: 'Jean Dupont' },
            delai: { type: 'string', format: 'date', example: '2025-09-30' },
            priorite: { type: 'string', enum: ['haute', 'moyenne', 'basse'], example: 'haute' },
            kpi: { type: 'string', example: 'Taux de couverture des comptes gérés par IAM' },
          },
        },
        UpdatePlanActionRequest: {
          type: 'object',
          properties: {
            description_nc: { type: 'string', example: 'Absence de politique de gestion des accès' },
            action_corrective: { type: 'string', example: 'Rédiger et diffuser la politique IAM' },
            responsable: { type: 'string', example: 'Jean Dupont' },
            delai: { type: 'string', format: 'date', example: '2025-09-30' },
            priorite: { type: 'string', enum: ['haute', 'moyenne', 'basse'], example: 'moyenne' },
            statut: { type: 'string', enum: ['a_faire', 'en_cours', 'cloture'], example: 'en_cours' },
            kpi: { type: 'string', example: 'Taux de couverture des comptes gérés par IAM' },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'jean@example.com',
            },
            password: {
              type: 'string',
              minLength: 6,
              example: 'motdepasse123',
            },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            token: {
              type: 'string',
              description: 'JWT token à utiliser dans le header Authorization: Bearer <token>',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
            user: {
              $ref: '#/components/schemas/User',
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1,
            },
            nom: {
              type: 'string',
              example: 'Dupont',
            },
            prenom: {
              type: 'string',
              example: 'Jean',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'jean@example.com',
            },
            role: {
              type: 'string',
              enum: ['admin', 'auditeur_senior', 'auditeur_junior', 'client'],
              example: 'admin',
            },
            organisation: {
              type: 'string',
              example: 'GRC Corp',
            },
            telephone: {
              type: 'string',
              example: '0600000000',
            },
            actif: {
              type: 'boolean',
              example: true,
            },
          },
        },
        CreateUserRequest: {
          type: 'object',
          required: ['nom', 'prenom', 'email', 'role'],
          properties: {
            nom: { type: 'string', example: 'Martin' },
            prenom: { type: 'string', example: 'Sophie' },
            email: { type: 'string', format: 'email', example: 'sophie@example.com' },
            role: { type: 'string', enum: ['admin', 'auditeur_senior', 'auditeur_junior', 'client'], example: 'auditeur_junior' },
            organisation: { type: 'string', example: 'Entreprise X' },
            telephone: { type: 'string', example: '0600000000' },
          },
        },
        UpdateUserRequest: {
          type: 'object',
          properties: {
            nom: { type: 'string', example: 'Martin' },
            prenom: { type: 'string', example: 'Sophie' },
            email: { type: 'string', format: 'email', example: 'sophie@example.com' },
            role: { type: 'string', enum: ['admin', 'auditeur_senior', 'auditeur_junior', 'client'], example: 'auditeur_senior' },
            organisation: { type: 'string', example: 'Entreprise Y' },
            telephone: { type: 'string', example: '0611111111' },
            actif: { type: 'boolean', example: true },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'Accès refusé. Token manquant.',
            },
          },
        },
        ValidationError: {
          type: 'object',
          properties: {
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  msg: { type: 'string', example: 'Email invalide' },
                  path: { type: 'string', example: 'email' },
                  location: { type: 'string', example: 'body' },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
};

const specs = swaggerJsdoc(options);
module.exports = specs;
