<script setup lang="ts">
import type { ValueType } from '../types/helper';
import Fuse from 'fuse.js';
import { computed, ref, nextTick, watch } from 'vue';

type Model = {
    id: string;
    [key: string]: ValueType | Model,
}

const props = defineProps<{
    label: string,
    prop: string,
    readonly?: boolean,
    list: Model[],
    displayValues: Array<keyof Model>,
    inTable?: boolean,
}>()

const fuse = new Fuse(props.list, {
    keys: props.displayValues as string[],
    includeScore: true,
});

watch(() => props.list, () => {
    fuse.setCollection(props.list);
});

const model = defineModel<ValueType>()

const emits = defineEmits<{
    (e: 'validate', prop: string, id?: string, model?: Model): void,
}>();

const inputField = ref<HTMLInputElement | null>(null);

const focus = () => {
    inputField.value?.focus();
}

defineExpose({
    focus,
});

const setState = (visible: boolean) => {
    nextTick(() => {
        inputHasFocus.value = visible;
    });
}

const select = (selection?: Model) => {
    setState(false);
    emits('validate', props.prop, selection?.id, selection);
    if (selection) {
        model.value = selection[props.displayValues[0]] as string;
    }
}

const onInputBlur = () => {
    setState(false);
    nextTick(() => {
        if (!model.value) {
            emits('validate', props.prop, undefined, undefined);
        }
    });
}

const items = computed(() => {
    if (!model.value) { return props.list; }
    const list = fuse.search(model?.value?.toString() ?? '');
    return list.sort((a, b) => (a.score ?? 1) - (b.score ?? 1)).map(l => l.item);

    return props.list.filter(item => {
        if (!model.value) { return true; }
        return props.displayValues.some(d => {
            const value = item[d];
            if (!value) { return false };
            return value.toString().toLowerCase().includes(model.value!.toString().toLowerCase());
        });
    }).splice(0, 5);
});

const preselectedIndex = ref(0);
const inputHasFocus = ref(false);

const onKeydown = (e: KeyboardEvent) => {
    setState(true);
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        preselectedIndex.value = Math.min(preselectedIndex.value + 1, items.value.length - 1);
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        preselectedIndex.value = Math.max(preselectedIndex.value - 1, 0);
    } else if (e.key === 'Enter') {
        e.preventDefault();
        select(items.value[preselectedIndex.value]);
    }
}

</script>

<template>
    <div class="field" :class="{ 'in-table': !!props.inTable }">
        <label :for="props.prop" v-if="!props.inTable">{{ props.label }}</label>
        <div class="input-wrapper">
            <input type="text" :disabled="!!readonly" :name="props.prop" :id="props.prop" v-model="model"
                @focus="setState(true)" @blur="onInputBlur()" @keydown="onKeydown" autocomplete="off" ref="inputField">
            <div class="select-wrapper" v-if="inputHasFocus">
                <span class="select-item" :class="{ preselect: index === preselectedIndex }"
                    v-for="(item, index) in items" :key="item.id" @mousedown="select(item)">
                    {{ displayValues.filter(d => !!item[d]).map(d => item[d]).join(' - ') }}
                </span>
            </div>
        </div>
    </div>
</template>

<style scoped>
.field {
    margin-bottom: 1rem;
    display: flex;
    width: 100%;

    align-items: center;
}

label {
    flex: 1;
    max-width: 250px;
    text-align: right;
    margin-right: 1rem;
}

input {
    flex: 1;
    border: 1px solid var(--color-border);
    border-radius: 0.25rem;
    padding: 0.5rem;
    color: var(--color-text);
    background-color: var(--color-background);
    width: 100%;
}

.field.in-table input {
    border-radius: 0;
    background-color: transparent;
}

.field.in-table {
    margin-bottom: 0rem;
}

input:disabled {
    background-color: var(--color-background-soft);
    color: var(--color-text);
}

.select-wrapper {
    position: absolute;
    display: flex;
    flex-direction: column;
    z-index: 10;
    background-color: var(--color-background-soft);
    width: 100%;
}

.select-item {
    padding: 0.5rem;
    z-index: 11;
    cursor: pointer;
}

.select-item.preselect {
    background-color: var(--color-border);
}

.input-wrapper {
    position: relative;
    flex: 1;
}
</style>