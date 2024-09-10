import type { ValueType } from "../types/helper";
import type { Ref } from "vue";
import { useLockStore } from "./lockStore";
import { useNotificationStore } from "./notification";

export type Model = {
    id: string;
}

export const storeFunctions = (
    getHeaders: () => Promise<HeadersInit> = async () => ({}),
    onHandleErrorResponse?: (response: Response) => Promise<boolean>,
) => {

    const handleErrorResponse = async (response: Response, message?: string) => {
        const { sendNotification } = useNotificationStore();

        if (onHandleErrorResponse && await onHandleErrorResponse(response)) {
            return;
        }

        const errorText = await response.text();
        sendNotification("warning", errorText);
        console.error(message, errorText);
    }


    return {
        deleteRec: <T extends Model>(url: string, fetchRecs: () => Promise<T[] | undefined>) => {
            return async (rec: T) => {
                const response = await fetch(`${url}/${rec.id}`, {
                    method: 'DELETE',
                    headers: {
                        ...await getHeaders(),
                    },
                });

                if (response.ok) {
                    fetchRecs();
                } else {
                    handleErrorResponse(response, 'Failed to delete record:');
                }
            };
        },

        saveRec: <T extends Model>(url: string, fetchRecs: () => Promise<T[] | undefined>, mapper?: (data: any) => T) => {
            return async (rec: Partial<T>) => {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...await getHeaders(),
                    },
                    body: JSON.stringify(rec),
                });

                if (response.ok) {
                    fetchRecs();
                    const data = await response.json();
                    if (mapper) {
                        return mapper(data);
                    } else {
                        return data as T;
                    }
                } else {
                    handleErrorResponse(response, 'Failed to save record:');
                };
            };
        },

        validateRec: <T extends Model>(url: string, fetchAllL: () => Promise<T[] | undefined>, mapper?: (data: any) => T) => {
            return async (rec: T, key: string, value?: ValueType) => {
                const body = {
                    id: rec.id,
                    [key]: value,
                };

                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...await getHeaders(),
                    },
                    body: JSON.stringify(body),
                });

                if (response.ok) {
                    fetchAllL();
                    const data = await response.json();
                    if (mapper) {
                        return mapper(data);
                    } else {
                        return data as T;
                    }
                } else {
                    handleErrorResponse(response, 'Failed to validate record:');
                };
            };
        },

        fetchOne: <T extends Model>(url: string, mapper?: (data: any) => T): () => Promise<T | undefined> => {
            return async () => {
                const response = await fetch(url, {
                    headers: {
                        ...await getHeaders(),
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    if (mapper) {
                        return mapper(data);
                    } else {
                        return data as T;
                    }
                } else {
                    handleErrorResponse(response, 'Failed to fetch record:');
                }
            };
        },

        fetchAll: <T extends Model>(url: string, records: Ref<T[]>, mapper?: (data: any) => T): () => Promise<T[] | undefined> => {
            const { fetchAllLock } = useLockStore();

            if (fetchAllLock.has(url)) {
                return async () => {
                    return records.value;
                };
            }

            return async () => {
                const uri = new URL(url);
                uri.searchParams.set('page', '1');
                const appendNextRecords = async (page: number) => {
                    uri.searchParams.set('page', page.toString());
                    const response = await fetch(uri, {
                        headers: {
                            ...await getHeaders(),
                        }
                    });
                    if (response.ok) {
                        const { data, total } = await response.json();
                        if (Array.isArray(data) && mapper) {
                            records.value.push(...data.map(mapper));
                        } else {
                            records.value.push(...data);
                        }

                        if (data.length > 0) {
                            await appendNextRecords(page + 1);
                        } else {
                            fetchAllLock.delete(url);
                        }
                    } else {
                        handleErrorResponse(response, 'Failed to fetch records:');
                    }
                }

                fetchAllLock.add(url);
                const response = await fetch(uri, {
                    headers: {
                        ...await getHeaders(),
                    },
                });
                if (response.ok) {
                    const { data, total } = await response.json();
                    if (Array.isArray(data) && mapper) {
                        records.value = data.map(mapper);
                    } else {
                        records.value = data;
                    }

                    if (records.value.length < total) {
                        await appendNextRecords(2);
                    } else {
                        fetchAllLock.delete(url);
                    }

                    return records.value;
                } else {
                    handleErrorResponse(response, 'Failed to fetch records:');
                }
            };
        }
    };
};