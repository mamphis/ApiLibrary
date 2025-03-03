import { PrismaClient } from "@prisma/client";
import { Request, RequestHandler, Response, Router } from "express";
import createHttpError from "http-errors";
import { Model } from "./model";

type Client = Omit<PrismaClient, symbol | "$on" | "$connect" | "$disconnect" | "$use" | "$extends" | "$executeRaw" | "$executeRawUnsafe" | "$queryRaw" | "$queryRawUnsafe">;
export type TransactionClient = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

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
    DB extends Client,
    C extends Client[K],
    WhereFilter extends Required<NonNullable<Parameters<DB[K]['findMany']>[0]>> extends { where?: infer U } ? U : never,
    UpdateFilter extends Required<NonNullable<Parameters<DB[K]['update']>[0]>> extends { data?: infer U } ? U : never,
    SecurityFilter extends { [key in DB[K]['fields']]: string | number | boolean },
> {
    private router: Router;
    private client: C;

    private getWhereFilter(req: Request, res: Response): WhereFilter {
        const whereParams: WhereFilter = {} as WhereFilter;
        const whereFilterSpan = req.logger.startSpan('where-filter');
        whereFilterSpan.verbose('{scope} Preparing where params');
        const params = req.params as Record<string, string>;

        if (this.globalFilter) {
            const filter = this.globalFilter(req, res);
            for (const key in filter) {
                whereFilterSpan.verbose('{scope} Found field {field} in global filter', { field: key });
                params[key] = filter[key] as string;
            }
        }

        for (const key in params) {
            if (Object.keys(this.client.fields).includes(key)) {
                whereFilterSpan.verbose('{scope} Found field {field} directly in params', { field: key });
                (whereParams as any)[key] = params[key];
            } else {
                const fieldName = key.replace(/Id$/, '');
                if (Object.keys(this.client.fields).includes(fieldName)) {
                    whereFilterSpan.verbose('{scope} Found field {field} as object in params', { field: fieldName });
                    (whereParams as any)[fieldName] = {
                        some: {
                            id: params[key],
                        }
                    }
                }
            }
        }

        whereFilterSpan.verbose('{scope} Where params', whereParams as Record<string, any>);
        return whereParams;
    }

    private getUpdateFilter(req: Request, res: Response): UpdateFilter {
        const updateParams: UpdateFilter = {} as UpdateFilter;
        const updateFilterSpan = req.logger.startSpan('update-filter');
        updateFilterSpan.verbose('{scope} Preparing update params');
        const params = {} as Record<string, string>;

        if (this.globalFilter) {
            const filter = this.globalFilter(req, res);
            for (const key in filter) {
                updateFilterSpan.verbose('{scope} Found field {field} in global filter', { field: key });
                params[key] = filter[key] as string;
            }
        }

        for (const key in params) {
            if (Object.keys(this.client.fields).includes(key)) {
                updateFilterSpan.verbose('{scope} Found field {field} directly in params', { field: key });
                (updateParams as any)[key] = params[key];
            } else {
                const fieldName = key.replace(/Id$/, '');
                if (Object.keys(this.client.fields).includes(fieldName)) {
                    updateFilterSpan.verbose('{scope} Found field {field} as object in params', { field: fieldName });
                    (updateParams as any)[fieldName] = {
                        connect: {
                            id: params[key],
                        }
                    }
                }
            }
        }

        updateFilterSpan.verbose('{scope} Update params', updateParams as Record<string, any>);

        return updateParams as UpdateFilter;
    }

    private constructor(
        private entity: K,
        private db: DB,
        private ctor: new (value: any, client: TransactionClient) => T,
        private globalFilter?: (req: Request, res: Response) => SecurityFilter,
    ) {
        this.client = db[entity] as C;
        this.router = Router({ mergeParams: true });
    }

    public static create<
        T extends Model<any>,
        K extends keyof Client,
        DB extends Client,
        SecurityFilter extends { [key in DB[K]['fields']]: string | number | boolean },
    >(
        entity: K,
        db: DB,
        ctor: new (value: any) => T,
        globalFilter?: (req: Request, res: Response) => SecurityFilter,
    ) {
        return new ApiRouter(entity, db, ctor, globalFilter);
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
            const prepareSpan = req.logger.startSpan('api-' + this.entity.toString());
            prepareSpan.verbose('{scope} Trying to find record with id {id}', { id: req.params.id });
            const filterSpan = prepareSpan.startSpan();

            const whereParams = this.getWhereFilter(req, res);
            filterSpan.verbose('{scope} Where params', whereParams as Record<string, any>);

            const rec = await this.client.findUnique({
                where: whereParams,
            });

            if (!rec) {
                return next(createHttpError(404, `Record with id ${req.params.id} not found.`));
            }

            prepareSpan.verbose('{scope} Found record with id {id}', { id: req.params.id });

            res.json(await new this.ctor(rec, this.client).toJsonObject());

            prepareSpan.verbose('{scope} Finished sending response');
        });

        return this;
    }

    getMany(
        orderBy?: { [key in keyof T]?: 'desc' | 'asc' },
        filter?: (req: Request, res: Response, currentFilter: WhereFilter) => WhereFilter,
        ...middlewares: RequestHandler[]): this {
        this.router.get('/', ...middlewares, async (req, res, next) => {
            const prepareSpan = req.logger.startSpan('api-' + this.entity.toString());

            prepareSpan.verbose('{scope} Preparing params for select');
            const filterSpan = prepareSpan.startSpan();

            const selectParams = getSelectParams(req);
            filterSpan.verbose('{scope} Select params', selectParams);

            const whereParams = this.getWhereFilter(req, res);
            const params = filter ? filter(req, res, whereParams) : whereParams;
            filterSpan.verbose('{scope} Where params', params as Record<string, any>);

            const databaseSpan = prepareSpan.startSpan();
            databaseSpan.verbose('{scope} Finding records');
            const recs: any[] = await this.client.findMany({
                where: params,
                orderBy,
                ...selectParams,
            });

            let total = recs.length;
            if (selectParams.take && recs.length >= selectParams.take) {
                total = await this.client.count({
                    where: params,
                });
            }

            databaseSpan.verbose('{scope} loaded {count} of {total} records from database', { total, count: recs.length });

            res.json({
                data: await Promise.all(recs.map(rec => new this.ctor(rec, this.client).toJsonObject())),
                total: total,
            });

            prepareSpan.verbose('{scope} Finished sending response');
        });
        return this;
    }

    update(
        initializer?: (req: Request, res: Response, db: TransactionClient, rec: Partial<T>) => Promise<Partial<T>>,
        ...middlewares: RequestHandler[]): this {
        this.router.post('/', ...middlewares, async (req, res, next) => {
            let rec;
            // remove empty fields from body
            const prepareSpan = req.logger.startSpan('api-' + this.entity.toString());

            const setupSpan = prepareSpan.startSpan();
            setupSpan.verbose('{scope} Setting up record');
            Object.keys(req.body).forEach(key => {
                const value = req.body[key];

                if (value === undefined) {
                    delete req.body[key];
                    setupSpan.verbose('{scope} Removed field {field}', { field: key });
                }
            });

            if ('id' in req.body) {
                setupSpan.verbose('{scope} Trying to find record with id {id}', { id: req.body.id });

                req.params.id = req.body.id;
                const whereParams = this.getWhereFilter(req, res);
                const dbRec = await this.client.findUnique({
                    where: whereParams,
                });

                if (dbRec) {
                    setupSpan.verbose('{scope} Found record with id {id}', { id: req.body.id });
                    rec = new this.ctor(dbRec, this.client);
                }
            }

            if (!rec) {
                setupSpan.verbose('{scope} Creating new record');
                try {
                    await this.db.$transaction(async (client: TransactionClient) => {
                        const init = initializer ? await initializer(req, res, client, req.body) : {};
                        const updateFilter = this.getUpdateFilter(req, res);

                        const data = { ...req.body, ...init };
                        Object.assign(data, updateFilter);

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
            const updateSpan = prepareSpan.startSpan();
            try {
                updateSpan.verbose('{scope} Applying changes to record');
                await rec.apply(req.body);
                updateSpan.verbose('{scope} Saving record');
                await rec.save();
            } catch (e: unknown) {
                return next(e);
            }

            res.json(await rec.toJsonObject());
            prepareSpan.verbose('{scope} Finished sending response');
        });
        return this;
    }

    delete(...middlewares: RequestHandler[]): this {
        this.router.delete('/:id', ...middlewares, async (req, res, next) => {
            const prepareSpan = req.logger.startSpan('api-' + this.entity.toString());
            prepareSpan.verbose('{scope} Trying to find record with id {id}', { id: req.params.id });

            const whereParams = this.getWhereFilter(req, res);
            const dbRec = await this.client.findUnique({
                where: whereParams,
            });

            if (!dbRec) {
                return next(createHttpError(404, `Record with id ${req.params.id} not found.`));
            }

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
                prepareSpan.verbose('{scope} Deleting record with id {id}', { id: req.params.id });

                await this.client.delete({
                    where: whereParams,
                });
            } catch (e: unknown) {
                return next(e);
            }
            res.status(201).end();

            prepareSpan.verbose('{scope} Finished sending response');
        });
        return this;
    }

    build(): Router {
        return this.router;
    }
}