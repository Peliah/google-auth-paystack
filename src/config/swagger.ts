import swaggerJsDoc from 'swagger-jsdoc';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'auth-paystack',
            version: "1.0.0",
            description: 'API documentation for auth-paystack',
        },
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
    },
    apis: ['src/routes/v1/*.ts'],
};

export default swaggerJsDoc(options);