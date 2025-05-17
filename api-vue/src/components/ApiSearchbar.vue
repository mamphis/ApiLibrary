<script lang="ts" setup>
import { nextTick, onMounted, ref, watch } from "vue";
import type { Model } from "../stores/storeFunctions";
import DropDown from "./ApiDropDown.vue";
import { useTemplateRef } from "vue";

type NavigatableRoute = Model & {
    id: string;
    name: string;
    group: string;
};

const items = defineModel<NavigatableRoute[]>();
const routes = ref<NavigatableRoute[]>(items.value ?? []);
const dropDown = useTemplateRef('inputField');

watch(items, (newRoutes) => {
    if (!newRoutes) return;
    routes.value = newRoutes;
});

const emits = defineEmits<{
    (e: "routeSelected", route: NavigatableRoute): void;
}>();

const navigate = (prop: string, id: string | null, model?: Model) => {
    if (!id) return;

    const route = routes.value.find((r) => r.id === id);
    if (!route) return;

    emits("routeSelected", route);
    nextTick(() => {
        searchbarVisible.value = false;
    });
};

const selectedRoute = ref("");
const searchbarVisible = ref(false);

document.addEventListener("keydown", (e) => {
    if (e.key === "q" && e.altKey) {
        selectedRoute.value = "";
        searchbarVisible.value = true;
        nextTick(() => {
            if (dropDown.value) {
                dropDown.value.focus();
            }
        });
    }

    if (e.key === "Escape" && searchbarVisible.value) {
        searchbarVisible.value = false;
    }
});
</script>

<template>
    <div class="searchbar" v-if="searchbarVisible">
        <DropDown
            ref="inputField"
            v-model="selectedRoute"
            :in-table="true"
            label=""
            prop=""
            :list="routes"
            :display-values="['group', 'name']"
            @validate="navigate"
        >
        </DropDown>
    </div>
</template>

<style scoped>
.searchbar {
    display: flex;
    justify-content: center;
    margin-bottom: 1rem;

    position: absolute;
    top: 0;
    left: 0;

    width: 100%;
    height: 3rem;
}

.searchbar > div {
    width: 50%;

    background-color: var(--color-background-soft);

    border-radius: 0 0 1.5rem 1.5rem;
    padding: 1rem;
}
</style>
