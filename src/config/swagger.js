import swaggerUi from 'swagger-ui-express';


const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Online Tools API',
    version: '1.0.0',
    description: 'API for online development tools including secure clipboard and text utilities',
    contact: {
      name: 'API Support',
      url: 'https://github.com'
    }
  },
  servers: [
    {
      url: 'http://localhost:8080',
      description: 'Development server'
    }
  ],
  paths: {
    '/healthz': {
      get: {
        tags: ['Health'],
        summary: 'Health check endpoint',
        responses: {
          '200': {
            description: 'Server is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    uptime: { type: 'number', example: 12345.67 },
                    version: { type: 'string', example: '1.0.0' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/clipboard': {
      post: {
        tags: ['Clipboard'],
        summary: 'Create a new clipboard note',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['text'],
                properties: {
                  text: { type: 'string', maxLength: 50000 },
                  pin: { type: 'string', pattern: '^\\d{4}$' },
                  expiresIn: { 
                    type: 'string', 
                    enum: ['15m', '1h', '24h', '7d'],
                    default: '1h'
                  }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Clipboard note created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: { type: 'string', pattern: '^\\d{6}$' },
                    ttl: { type: 'number' },
                    expiresAt: { type: 'string', format: 'date-time' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/clipboard/retrieve': {
      post: {
        tags: ['Clipboard'],
        summary: 'Retrieve a clipboard note',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['code'],
                properties: {
                  code: { type: 'string', pattern: '^\\d{6}$' },
                  pin: { type: 'string', pattern: '^\\d{4}$' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Clipboard note retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    text: { type: 'string' },
                    remainingReads: { type: 'number' },
                    expiresAt: { type: 'string', format: 'date-time' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/tools/url-encode': {
      post: {
        tags: ['Tools'],
        summary: 'URL encode text',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['text'],
                properties: {
                  text: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Text encoded successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    result: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  components: {
    schemas: {
      Error: {
        type: 'object',
        properties: {
          ok: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
              details: { type: 'object' }
            }
          }
        }
      }
    }
  }
};

export const setupSwagger = (app) => {
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Online Tools API Documentation'
  }));
};