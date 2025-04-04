import { Request, Response } from "express";
import { randomUUID } from "crypto";
import { Provider, AuthenticatorResponse } from "./provider";


type GithubUser = {
    login: string;
    id: number;
    name: string;
}

type GithubAuthUser = {
    id: string;
    name: string;
}

export class GithubProvider implements Provider<GithubAuthUser> {
    private states = new Map<string, string>();

    constructor(private clientId: string, private clientSecret: string, private redirectUrl: string) {

    }

    async getAuthorizationUrl(req: Request): Promise<string> {
        const logger = req.logger.startSpan('getAuthorizationUrl');

        logger.debug('Getting authorization URL');

        const state = randomUUID();
        this.states.set(req.ip ?? 'default', state);

        const url = `https://github.com/login/oauth/authorize`;

        const params = new URLSearchParams({
            client_id: this.clientId,
            redirect_uri: this.redirectUrl,
            scope: 'read:user',
            state,
        });

        const authorizationUrl = `${url}?${params.toString()}`;

        logger.debug('Authorization URL: {authorizationUrl}', { authorizationUrl });

        return authorizationUrl;
    }
    async getAccessToken(req: Request, code: string, state: string): Promise<string> {
        const logger = req.logger.startSpan('getAccessToken');

        logger.debug('Getting access token');

        const storedState = this.states.get(req.ip ?? 'default');
        if (state !== storedState || state === 'default') {
            logger.error('Invalid state');
            throw new Error('Invalid state');
        }

        const url = `https://github.com/login/oauth/access_token`;
        const body = {
            client_id: this.clientId,
            client_secret: this.clientSecret,
            code,
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();

        if (response.status !== 200) {
            logger.error('Failed to get access token');
            throw new Error('Failed to get access token');
        }

        return data.access_token;
    }

    async getUser(req: Request, accessToken: string): Promise<AuthenticatorResponse<GithubAuthUser>> {
        const logger = req.logger.startSpan('getUser');

        logger.debug('Getting user');
        const response = await fetch('https://api.github.com/user', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        const data = await response.json();

        if (response.status !== 200) {
            logger.error('Failed to get user');
            throw new Error('Failed to get user');
        }

        const user = data as GithubUser;
        return {
            authenticator: 'github',
            user: {
                id: user.login,
                name: user.name,
            },
        };
    }
}