import { Request } from "express";

export type User = {
    id: string,
}

export type AuthenticatorResponse<T extends User> = {
    user: T;
    authenticator: string;
}

export interface Provider<T extends User> {
    getAuthorizationUrl(req: Request): Promise<string>;
    getAccessToken(req: Request, code: string, state: string): Promise<string>;
    getUser(req: Request, accessToken: string): Promise<AuthenticatorResponse<T>>
}