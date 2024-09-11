import { PrismaClient } from "@prisma/client";
import { Request, RequestHandler, Response, Router } from "express";
import { Model } from "./model";


type Client = Omit<PrismaClient, symbol | "$on" | "$connect" | "$disconnect" | "$use" | "$transaction" | "$extends" | "$executeRaw" | "$executeRawUnsafe" | "$queryRaw" | "$queryRawUnsafe">;
type TransactionClient = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

const PAGE_SIZE = 100;

function getSelectParams(req: Request) {
    let selectParams: {
        skip?: number | undefined;
        take?: number | undefined;
    } = {};

    if (req.query) {
        const { page } = req.query;
        if (page) {
            const intPage = parseInt(page as string);
            if (!isNaN(intPage)) {
                selectParams = {
                    skip: (intPage - 1) * PAGE_SIZE,
                    take: PAGE_SIZE,
                };
            }
        }
    }
    return selectParams;
}

export class ApiRouter<
    T extends Model<any>,
    K extends keyof Client,
    C extends Client[K],
    WhereFilter extends Required<NonNullable<Parameters<C['findMany']>[0]>> extends { where?: infer T } ? T : never
> {
    private router: Router;

    private constructor(
        private entity: K,
        private client: C,
        private ctor: new (value: any, client: TransactionClient) => T
    ) {

        this.router = Router({ mergeParams: true });
    }

    public static create<
        T extends Model<any>,
        K extends keyof Client,
        C extends Client[K],
        WhereFilter extends Required<NonNullable<Parameters<C['findMany']>[0]>> extends { where?: infer T } ? T : never
    >(
        entity: K,
        client: C,
        ctor: new (value: any) => T
    ) {
        return new ApiRouter<T, K, C, WhereFilter>(entity, client, ctor);
    }

    authed(authFunction: RequestHandler): this {
        this.router.use(authFunction);
        return this;
    }

    subRoute(path: string, subRouter: Router): this {
        this.router.use(path, subRouter);
        return this;
    }

    getOne(...middlewares: RequestHandler[]): this {
        this.router.get('/:id', ...middlewares, async (req, res, next) => {
            const rec = await this.client.findUnique({
                where: { id: req.params.id }
            });

            if (!rec) {
                return res.status(404).json({ message: `Record with id ${req.params.id} not found.` });
            }

            res.json(await new this.ctor(rec, this.client).toJsonObject());
        });

        return this;
    }

    getMany(
        orderBy?: { [key in keyof T]?: 'desc' | 'asc' },
        filter?: (req: Request, res: Response, currentFilter: WhereFilter) => WhereFilter,
        ...middlewares: RequestHandler[]): this {
        this.router.get('/', ...middlewares, async (req, res, next) => {
            const selectParams = getSelectParams(req);
            const whereParams: WhereFilter = {} as WhereFilter;

            for (const key in req.params) {
                if (Object.keys(this.client.fields).includes(key)) {
                    (whereParams as any)[key] = (req.params as Record<string, string>)[key];
                } else {
                    const fieldName = key.replace(/Id$/, '');
                    if (Object.keys(this.client.fields).includes(fieldName)) {
                        (whereParams as any)[fieldName] = {
                            some: {
                                id: (req.params as Record<string, string>)[key],
                            }
                        }
                    }
                }
            }

            const params = filter ? filter(req, res, whereParams) : whereParams;

            const recs: any[] = await this.client.findMany({
                where: params,
                orderBy,
                ...selectParams,
            });

            const total = await this.client.count({
                where: params,
            })

            res.json({
                data: await Promise.all(recs.map(rec => new this.ctor(rec, this.client).toJsonObject())),
                total: total,
            });
        });
        return this;
    }

    update(
        initializer?: (req: Request, res: Response, db: TransactionClient, rec: Partial<T>) => Promise<Partial<T>>,
        ...middlewares: RequestHandler[]): this {
        this.router.post('/', ...middlewares, async (req, res, next) => {
            let rec;
            // remove empty fields from body
            Object.keys(req.body).forEach(key => {
                const value = req.body[key];

                if (value === undefined) {
                    delete req.body[key];
                }
            });

            if ('id' in req.body) {
                const dbRec = await this.client.findUnique({
                    where: { id: req.body.id }
                });

                if (dbRec) {
                    rec = new this.ctor(dbRec, this.client);
                }
            }

            if (!rec) {
                try {
                    await this.client.$transaction(async (client: TransactionClient) => {
                        const init = initializer ? await initializer(req, res, client, req.body) : {};
                        const data = { ...req.body, ...init };
                        const dbRec = await (client[this.entity] as any).create({
                            data,
                        });

                        rec = new this.ctor(dbRec, client);
                        if (rec.onBeforeInsert) {
                            try {
                                if (!await rec.onBeforeInsert()) {
                                    throw new Error('Failed to create record.');
                                }
                            } catch (e: unknown) {
                                return next(e);
                            }
                        }

                    });
                } catch (e: unknown) {
                    return next(e);
                }
            }

            if (!rec) {
                return next(new Error('Failed to create or receive Record'));
            }

            try {
                await rec.apply(req.body);
                await rec.save();
            } catch (e: unknown) {
                return next(e);
            }

            res.json(await rec.toJsonObject());
        });
        return this;
    }

    delete(...middlewares: RequestHandler[]): this {
        this.router.delete('/:id', ...middlewares, async (req, res, next) => {
            const dbRec = await this.client.findUnique({
                where: { id: req.params.id }
            });

            const rec = new this.ctor(dbRec, this.client);

            if (rec.onBeforeDelete) {
                try {
                    if (!await rec.onBeforeDelete()) {
                        return next(new Error('Failed to delete record.'));
                    }
                } catch (e: unknown) {
                    return next(e);
                }
            }

            try {
                await this.client.delete({
                    where: { id: req.params.id }
                });
            } catch (e: unknown) {
                return next(e);
            }
            res.status(201).end();
        });
        return this;
    }

    build(): Router {
        return this.router;
    }
}