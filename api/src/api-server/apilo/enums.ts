export enum ApiloApiRoutes {
    REST_API_PATH = '/rest/api',
    REST_AUTH_PATH = '/rest/auth/token',
    PRODUCT_PATH = '/warehouse/product',
    ORDER_PATH = '/orders'
}

export enum ApiloTokenData {
    // refresh token before expire date in milliseconds
    EXPIRE_THRESHOLD = 300000,
}

export enum ApiloProdcutData {
    LIMIT = 2000,
    VAT = '23',
    WEIGHT_UNIT = 'kg',
    DESCRIPTION = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum dignissim, eros quis consectetur tincidunt, diam leo convallis ligula.',
    CHUNK_SIZE = 128,
}

export enum ApiloProductStatus {
    INACTIVE = 0,
    ACTIVE = 1,
    ARCHIVE = 8
}