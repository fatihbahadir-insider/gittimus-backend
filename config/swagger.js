const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Gittimus API',
      version: '1.0.0',
      description: 'Gittimus backend API — rule version management with Google OAuth authentication.',
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:3500',
        description: 'Local development server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Access token obtained from `/auth/refresh` or the OAuth callback redirect.',
        },
        CookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'jwt',
          description: 'HttpOnly refresh token cookie set automatically after Google OAuth login.',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Not found.' },
          },
        },
        User: {
          type: 'object',
          properties: {
            _id:       { type: 'string', example: '665a1b2c3d4e5f6789abcdef' },
            googleId:  { type: 'string', example: '117342823480001234567' },
            email:     { type: 'string', format: 'email', example: 'user@example.com' },
            name:      { type: 'string', example: 'Jane Doe' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        RuleSummary: {
          type: 'object',
          properties: {
            ruleId:       { type: 'string', example: 'no-console' },
            name:         { type: 'string', example: 'No Console Logs' },
            versionCount: { type: 'integer', example: 3 },
            latestAt:     { type: 'string', format: 'date-time' },
            shareToken:   { type: 'string', nullable: true, example: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4' },
            createdAt:    { type: 'string', format: 'date-time' },
            updatedAt:    { type: 'string', format: 'date-time' },
          },
        },
        RuleVersion: {
          type: 'object',
          properties: {
            index:         { type: 'integer', example: 0 },
            contentBase64: { type: 'string', format: 'byte', example: 'bW9kdWxlLmV4cG9ydHMgPSB7IHJ1bGVzOiB7fSB9Ow==' },
            createdAt:     { type: 'string', format: 'date-time' },
          },
        },
        RuleHistory: {
          type: 'object',
          properties: {
            ruleId:  { type: 'string', example: 'no-console' },
            name:    { type: 'string', example: 'No Console Logs' },
            history: {
              type: 'array',
              items: { $ref: '#/components/schemas/RuleVersion' },
            },
          },
        },
        SharedRule: {
          type: 'object',
          properties: {
            ruleId:       { type: 'string', example: 'no-console' },
            name:         { type: 'string', example: 'No Console Logs' },
            versionCount: { type: 'integer', example: 3 },
            updatedAt:    { type: 'string', format: 'date-time' },
            history: {
              type: 'array',
              items: { $ref: '#/components/schemas/RuleVersion' },
            },
          },
        },
      },
    },
  },
  apis: ['./routes/*.js'],
};

module.exports = swaggerJsdoc(options);
