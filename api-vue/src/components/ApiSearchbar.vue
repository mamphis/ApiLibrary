<script lang="ts" setup>
import type { Model } from '../stores/storeFunctions';
import DropDown from './ApiDropDown.vue';
import { nextTick, ref } from 'vue';

type NavigatableRoute = Model & {
    id: string,
    name: string,
    group: string,
}

const items = defineModel<NavigatableRoute[]>();
if (!items.value) {
    items.value = [];
}

const emits = defineEmits<{
    (e: 'routeSelected', route: NavigatableRoute): void,
}>();

const navigate = (prop: string, id?: string, model?: Model) => {
    if (!id) return;

    const route = items.value?.find((r) => r.id === id);
    if (!route) return;

    emits('routeSelected', route);
}

const selectedRoute = ref('');
const searchbarVisible = ref(false);
const searchInput = ref<InstanceType<typeof DropDown> | null>(null);

document.addEventListener('keydown', (e) => {
    if (e.key === 'q' && e.altKey) {
        selectedRoute.value = '';
        searchbarVisible.value = true;
        nextTick(() => {
            searchInput.value?.focus();
        });
    }

    if (e.key === 'Escape' && searchbarVisible.value) {
        searchbarVisible.value = false;
    }
});
</script>

<template>
    <div class="searchbar" v-if="searchbarVisible">
        <DropDown ref="searchInput" v-model="selectedRoute" :in-table="true" label="" prop="" v-if="items" :list="items"
            :display-values="['group', 'name']" @validate="navigate">
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

.searchbar>div {
    width: 50%;

    background-color: var(--color-background-soft);

    border-radius: 0 0 1.5rem 1.5rem;
    padding: 1rem;
}
</style>