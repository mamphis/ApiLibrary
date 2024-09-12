## Components
### util: Logger
Provides a Logger class that logs to stdout.

```ts
const logger = Logger.createLogger();

const scopedLogger = Logger.createScopedLogger('server');

logger.info('Hello World');

scopedLogger.debug('Hello World');

logger.error('Hello World');
```

### express: ApiRouter
Creates a customizable Router which can be used for CRUD operations for the api.

```ts
const router = ApiRouter.create('bike', db.bike, Bike)
    .subRoute('/:bikeId/maintenanceEntries', maintenanceEntryRouter)
    .authed(auth())
    .getMany({ name: 'asc' }, filterByOwner)
    .getOne()
    .update(async (req, res, db, rec) => {
        return {
            ownerId: res.locals.user.id,
        };
    }, verifyOwn)
    .delete(verifyOwn)
    .build();
```

### express: Model
`Model` is a wrapper class for prisma Entities. It provides basic functionality for sending data to over the api.


### express: errorHandler
Provides a middleware to handle errors.

```ts
app.use(errorHandler(scopedLogger));
```

### express: httpLogger
Provides a middleware to log incoming Requests.

```ts
app.use(httpLogger(scopedLogger));
```