
export abstract class Model<T extends { id: string }> {
    protected tasks: Promise<any>[] = [];

    constructor(
        protected rec: T,
        private db: { upsert: (options: { create: T, update: T, where: { id: string } }) => Promise<T> },
        private ignoredFields: (keyof T)[] = [],
    ) { }

    get id() {
        return this.rec.id;
    }

    onBeforeModify?(): Promise<boolean>;
    onBeforeInsert?(): Promise<boolean>;
    onBeforeDelete?(): Promise<boolean>;

    async toJsonObject() {
        const pojo: Record<string, any> = {};

        // Get all propertydescriptors for the whole prototype chain
        const descriptors = Object.assign({},
            Object.getOwnPropertyDescriptors(Object.getPrototypeOf(this)),
            Object.getOwnPropertyDescriptors(Object.getPrototypeOf(this.constructor.prototype)),
        );

        for (const key in descriptors) {
            const descriptor = descriptors[key];
            if (descriptor && 'get' in descriptor && descriptor.get && !this.ignoredFields.includes(key as keyof T)) {
                pojo[key] = await this[key as keyof this];
            }
        }

        return pojo;
    }

    async apply(obj: Record<string, any>) {
        await Promise.all(this.tasks);

        if (this.onBeforeModify && !await this.onBeforeModify()) {
            return;
        }

        const descriptors = Object.getOwnPropertyDescriptors(Object.getPrototypeOf(this));

        for (const key in descriptors) {
            const descriptor = descriptors[key];
            if (descriptor && 'set' in descriptor && descriptor.set) {
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