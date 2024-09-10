export type  ValueType = string | number | boolean | Date | null;

export type ErrorType = {
    type: string;
    name: string;
    error: string;
    data: string;
    status?: number;
}