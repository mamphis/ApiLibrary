import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

export const handlePrismaClientKnownRequestError = (err: PrismaClientKnownRequestError): { status: number, name: string, message: string, type: string, path?: string } => {

    switch (err.code) {
        case 'P1008':
            return { status: 500, message: 'A connection to the database has been timed out.', name: 'PrismaClientKnownRequestError', type: 'HttpError' };
        case 'P2002':
            return { status: 400, message: `The value of the field "${err.meta?.target}" already exists.`, name: 'PrismaClientKnownRequestError', type: 'ValidationError', path: (err.meta?.target as string[])?.join('.') };
        case 'P2014':
            return { status: 400, message: `The id "${err.meta?.target}" is not valid.`, name: 'PrismaClientKnownRequestError', type: 'ValidationError', path: (err.meta?.target as string[])?.join('.') };
        case 'P2003':
            return { status: 400, message: `You cannot do this action because a relation exists: ${err.meta?.modelName}.${err.meta?.field_name}`, name: 'PrismaClientKnownRequestError', type: 'ValidationError', path: (err.meta?.target as string[])?.join('.') };
        case 'P2006':
            return { status: 400, message: `The provided value ${err.meta?.field_value} for ${err.meta?.model_name} field ${err.meta?.field_name} is not valid`, name: 'PrismaClientKnownRequestError', type: 'ValidationError', path: (err.meta?.target as string[])?.join('.') };
        default:
            return { status: 500, message: err.message, name: 'PrismaClientKnownRequestError', type: 'HttpError' };
    }
}
