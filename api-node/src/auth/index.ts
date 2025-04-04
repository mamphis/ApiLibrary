import { NextFunction, Request, Response, Router } from "express";
import { AuthenticatorResponse, Provider, User } from "./provider/provider";
import createHttpError from "http-errors";
import jwt from 'jsonwebtoken';
import { TraceLogger } from "../logging";

export class Authenticator<T extends User> {
    constructor(private secret: string) {

    }

    private async verifyToken(token: string, logger: TraceLogger) {
        const [type, tokenValue] = token.split(' ');
        logger.verbose('Verify token of type {type}', { type });

        if (type !== 'Bearer') {
            logger.warn('Invalid token type');
            throw createHttpError(401, 'Unauthorized');
        }
        let user;

        try {
            const { payload } = jwt.verify(tokenValue, this.secret, { complete: true });
            if (typeof payload === 'string') {
                user = JSON.parse(payload);
            } else {
                user = payload;
            }
        } catch (error) {
            if (error instanceof jwt.JsonWebTokenError) {
                logger.error(error, { token: tokenValue });
            } else {
                logger.error('Invalid token', { token: tokenValue });
            }
            throw createHttpError(401, 'Unauthorized');
        }

        const username = user.id;
        logger.verbose('Token username: {username}', { username });

        return user as T;
    }

    async isAuthenticated(req: Request, res: Response, next: NextFunction) {
        const authSpan = req.logger.startSpan('auth');

        const token = req.header('Authorization');

        if (!token) {
            authSpan.warn('No token provided');
            return next(createHttpError(401, 'Unauthorized'));
        }

        // Verify token
        try {
            const user = await this.verifyToken(token, authSpan.startSpan());
            authSpan.setActiveSpan();

            authSpan.debug('User authenticated: {userId}', { userId: user.id, user: user });
            res.locals.user = user;
        } catch (error) {
            authSpan.setActiveSpan();
            return next(error);
        }

        next();
    }

    async generateJwt(user: T): Promise<string> {
        return jwt.sign(user, this.secret);
    }
}

export const getAuthRouter = <T extends User>(provider: Provider<T>, generateAuthResponse: (req: Request, authResponse: AuthenticatorResponse<T>) => Promise<T>): Router => {
    const router: Router = Router();

    router.get('/url', async (req, res, next) => {
        const url = await provider.getAuthorizationUrl(req);
        res.json({ url });
    });

    router.post('/login', async (req, res, next) => {
        const { code, state } = req.body;
        const logger = req.logger.startSpan('login');
        try {
            logger.verbose('getting token.')
            const token = await provider.getAccessToken(req, code, state);
            logger.verbose('got token, getting user.')
            const user = await provider.getUser(req, token);
            logger.verbose('got user, generating auth response.')
            const auth = await generateAuthResponse(req, user);

            logger.verbose(`User ${auth.id} was successfully authenticated with {provider}`, { provider: user.authenticator, user, auth });
            return res.json(auth);
        } catch (e) {
            next(e);
            return;
        }
    });

    return router;
}

export * from './provider';