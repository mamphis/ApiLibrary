import { Request } from "express";

export type User = {
    id: string,
}

export type AuthenticatorResponse = {
    user: User
    authenticator: string;
}

export interface Provider {
    getAuthorizationUrl(req: Request): Promise<string>;
    getAccessToken(req: Request, code: string, state: string): Promise<string>;
    getUser(req: Request, accessToken: string): Promise<AuthenticatorResponse>
}