import { Request, Response } from "express";

export abstract class Model<T extends { id: string }> {
    protected tasks: Promise<any>[] = [];

    constructor(
        protected rec: T,
        private db: {
            upsert: (options: {
                create: T;
                update: T;
                where: { id: string };
            }) => Promise<T>;
        },
        private ignoredFields: (keyof T)[] = []
    ) {}

    get id() {
        return this.rec.id;
    }

    onBeforeModify?(): Promise<boolean>;
    onBeforeInsert?(): Promise<boolean>;
    onBeforeDelete?(): Promise<boolean>;

    private getAllDescriptors() {
        let descriptors: Record<string, TypedPropertyDescriptor<any>> = {};
        let currentPrototype = Object.getPrototypeOf(this);

        while (currentPrototype && currentPrototype !== Object.prototype) {
            const currentDescriptors =
                Object.getOwnPropertyDescriptors(currentPrototype);
            descriptors = { ...descriptors, ...currentDescriptors };
            currentPrototype = Object.getPrototypeOf(currentPrototype);
        }

        return descriptors;
    }

    async toJsonObject(...ignoredFields: (keyof this)[]) {
        const pojo: Record<string, any> = {};

        // Get all property descriptors from the prototype chain
        const descriptors = this.getAllDescriptors();

        for (const key in descriptors) {
            const descriptor = descriptors[key];
            if (
                descriptor &&
                "get" in descriptor &&
                descriptor.get &&
                !this.ignoredFields.includes(key as keyof T) &&
                !ignoredFields.includes(key as keyof this)
            ) {
                pojo[key] = await this[key as keyof this];
            }
        }

        return pojo;
    }

    currentMetadata: Record<string, any> = {};

    async apply(
        obj: Record<string, any>,
        request: Request,
        response: Response
    ) {
        await Promise.all(this.tasks);

        if (this.onBeforeModify && !(await this.onBeforeModify())) {
            return;
        }

        this.currentMetadata.request = request;
        this.currentMetadata.response = response;

        const descriptors = this.getAllDescriptors();

        for (const key in descriptors) {
            const descriptor = descriptors[key];
            if (descriptor && "set" in descriptor && descriptor.set) {
                if (key in obj) {
                    const value = await obj[key];
                    this[key as keyof this] = value;
                }
            }
        }
    }

    async save() {
        await Promise.all(this.tasks);
        return this.db.upsert({
            create: this.rec,
            update: this.rec,
            where: { id: this.rec.id },
        });
    }
}
