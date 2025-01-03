export const getRestApiloTokenSchema = {
    type: 'object',
    properties: {
        accessToken: {
            type: 'string',
            minLength: 1
        },
        accessTokenExpireAt: {
            type: 'string',
        },
        refreshToken: {
            type: 'string',
            minLength: 1
        },
        refreshTokenExpireAt: {
            type: 'string',
        }
    },
    required: ['accessToken', 'accessTokenExpireAt', 'refreshToken', 'refreshTokenExpireAt'],
    additionalProperties: false
};

export const apiloTokenSchema = {
    type: 'object',
    properties: {
        access_token: {
            type: 'string',
            minLength: 1
        },
        access_token_expire_at: {
            type: 'number'
        },
        refresh_token: {
            type: 'string',
            minLength: 1
        },
        refresh_token_expire_at: {
            type: 'number'
        }
    },
    required: ['access_token', 'access_token_expire_at', 'refresh_token', 'refresh_token_expire_at'],
    additionalProperties: true
};


export const pingApiloSchema = {
    type: 'object',
    properties: {
        content: {
            type: 'string',
            minLength: 1
        },
    },
    required: ['content'],
    additionalProperties: false
};
