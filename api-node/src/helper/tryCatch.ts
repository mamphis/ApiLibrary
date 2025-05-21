
type Success<T> = [T, null];
type Failure<E extends Error> = [null, E];

type Result<T, E extends Error> = Success<T> | Failure<E>;

type Input = (...args: any[]) => any;
export const tryCatch =
    <E extends Error, F extends Input>(inputFunction: F) =>
    (...params: Parameters<F>): Result<ReturnType<F>, E> => {
        try {
            const result = inputFunction(...params);
            return [result, null] as Success<ReturnType<F>>;
        } catch (error) {
            if (error instanceof Error) {
                return [null, error] as Failure<E>;
            }
            throw error;
        }
    };