import {jsonPost} from "./common";

export interface InitOptions extends BaseOptions {
    name: string;
    originalLocale: string;
}
export async function createSite(params: InitOptions): Promise<void> {
    const siteId = await jsonPost("angular/create", params);
    console.error("Site created with id", siteId);
}