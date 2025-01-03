import {ApiloProductStatus} from "./enums";

export interface InsertApiloTokenPayload {
    integration_uuid: string,
    endpoint: string,
    client_secret: string,
    client_id: number,
    access_token: string,
    access_token_expire_at: number,
    refresh_token: string,
    refresh_token_expire_at: number
}

export interface UpdateApiloTokenPayload {
    uuid: string,
    accessToken: string | null,
    accessTokenExpireAt: number | null,
    refreshToken: string | null,
    refreshTokenExpireAt: number | null
}

export interface InitApiloPayload {
    uuid: string,
    apiEndpoint: string,
    clientId: number,
    clientSecret: string,
    authCode: string,
}

export interface AuthApiloResponse {
    accessToken: string,
    accessTokenExpireAt: string,
    refreshToken: string,
    refreshTokenExpireAt: string,
}

export interface InitApiloRecord {
    token_uuid: string,
}

export interface ApiloPingResponse {
    content: string,
}

export interface AplioTokenRecord {
    uuid: string,
    endpoint: string,
    client_secret: string,
    client_id: number,
    access_token: string,
    access_token_expire_at: number,
    refresh_token: string,
    refresh_token_expire_at: number,
}

export interface ApiloProductDetails {
    name: string;
    groupName: string;
    productGroupId: number;
    categories: number[];
    unit: string;
    weight: string;
    priceWithoutTax: string;
    sku: string;
    ean: string;
    attributes: Record<string, string | number>,
    images: Record<string, string>,
    id: number;
    originalCode: string;
    quantity: number;
    priceWithTax: number;
    tax: string;
    status: ApiloProductStatus;
}

export interface ApiloProductPut extends ApiloProductDetails {
    id: number
}

export interface ApiloProductGetResponse {
    products: ApiloProductDetails[];
    totalCount: number;
}

export interface ApiloProductPostResponse {
    products: Record<string, string> | [],
}

export interface ApiloProductPutResponse {
    updated: number,
}

interface ApiloPreferences {
    idUser: string;
}

interface ApiloAddress {
    id: number;
    name: string;
    phone: string;
    email: string;
    streetName: string;
    streetNumber: string;
    city: string;
    zipCode: string;
    country: string;
    department: string;
    parcelIdExternal: string;
    parcelName: string;
    class: string;
    companyTaxNumber: string;
    companyName: string;
}

interface ApiloOrderItem {
    id: number;
    idExternal: string | null;
    ean: string | null;
    sku: string | null;
    originalName: string;
    originalCode: string | null;
    originalPriceWithTax: string;
    originalPriceWithoutTax: string;
    media: string | null;
    quantity: number;
    tax: string | null;
    productSet: string | null;
    status: number;
    unit: string | null;
    type: number;
    productId: number | null;
}

interface ApiloOrderPayment {
    idExternal: string;
    amount: number;
    paymentDate: string;
    type: number;
    comment: string;
}

export interface ApiloOrder {
    platformAccountId: number;
    platformId: number;
    idExternal: string;
    isInvoice: boolean;
    customerLogin: string;
    paymentStatus: number;
    paymentType: number;
    originalCurrency: string;
    originalAmountTotalWithoutTax: number;
    originalAmountTotalWithTax: number;
    originalAmountTotalPaid: number;
    sendDateMin: string;
    sendDateMax: string;
    isEncrypted: boolean;
    preferences: ApiloPreferences;
    createdAt: string;
    updatedAt: string;
    orderItems: ApiloOrderItem[];
    orderPayments: ApiloOrderPayment[];
    addressCustomer: ApiloAddress;
    addressDelivery: ApiloAddress;
    addressInvoice: ApiloAddress;
    carrierAccount: number;
    orderNotes: any[];
    orderedAt: string;
    isCanceledByBuyer: boolean;
    id: string;
    status: number;
}