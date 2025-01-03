import {Merchant} from "../../src/config-builder/config.interface";

declare global {
    namespace Express {
        export interface Request {
            api?: { requestId: string };
            merchant: Merchant;
        }
    }
}
