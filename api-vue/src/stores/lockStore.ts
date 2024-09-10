import { defineStore } from "pinia";

export const useLockStore = defineStore('lock', () => {
    const fetchAllLock: Set<string> = new Set<string>();

    return {
        fetchAllLock,
    };
});