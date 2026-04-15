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
      schemas: {
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
