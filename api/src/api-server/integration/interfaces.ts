import {IntegrationStatusEnum, StatusHttp, SupportedPlatforms} from "./enums";

export interface Integration {
    integration__uuid: string,
    integration__name: string,
    integration_settings__platform: SupportedPlatforms,
    integration_settings__status: IntegrationStatusEnum,
    integration_settings__site_url: string | null,
}

export interface GetMerchant {
    id: string
}

export interface GetIntegrationId {
    id: string
}

export interface IntegrationCount {
    integrationCount: number
}

export interface CreateIntegrationPayload {
    merchantUuid: string,
    platform: SupportedPlatforms,
    integrationName: string,
    siteUrl: string | null,
    xblToken?: string
}

export interface UpdatedIntegrationRecord {
    integration__uuid: string,
    integration_settings__status: string,
    integration_settings__platform: string,
    integration_settings__site_url: string,
}

export interface UpdateIntegrationPayload {
    uuid: string;
    integrationName: string;
    platform: SupportedPlatforms;
    siteUrl: string | null;
    xblToken?: string
    status?: string | null;
    isDeleted?: number | null;
    invoiceStatusTrigger?: string | null;
    invoiceNumbering?: string | null;
    receiptNumbering?: string | null;
    warehouse?: string | null;
    productGroup?: string | null;
    priceGroup?: string | null;
    syncDirection?: string | null;
    inventorySync?: boolean | null;
}

export interface UpdateIntegrationStatusPayload {
    uuid: string;
    status: string;
}

export interface DeleteIntegrationRecord {
    success: boolean,
    uuid: string,
}

export interface IntegrationSettings {
    invoice: Record<string, string>[] | [],
    receipt: Record<string, string>[] | [],
    companyWarehouses: Record<string, string>[] | [],
    productGroups: Record<string, string>[] | [],
    priceGroups: Record<string, string>[] | [],
    documentAction?: Record<string, string>
}

export interface CheckIntegrationPayload {
    uuid: string,
    siteUrl: string,
    platform: SupportedPlatforms,
}
export interface InitBaseLinkerIntegrationPayload {
    uuid: string,
    platform: SupportedPlatforms.BASELINKER,
    xblToken: string,
}

export interface checkIntegrationResponse {
    status: StatusHttp;
    data: {
        statuses: Record<string, string>;
    };
}