import { defineStore } from "pinia";

export const useLockStore = defineStore('lock', () => {
    const fetchAllLock: Set<string> = new Set<string>();
    const getRandomString = () => Math.random().toString(36).substring(7) + Math.random().toString(36).substring(7);
    const sessionId = sessionStorage.getItem('sessionId') ?? getRandomString();

    sessionStorage.setItem('sessionId', sessionId);

    return {
        fetchAllLock,
        sessionId,
    };
});