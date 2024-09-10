<script setup lang="ts">
import { ref } from 'vue';
import type { ValueType } from '../types/helper';

type FieldType = 'password' | 'date' | 'time' | 'number' | 'checkbox' | 'text';

const props = defineProps<{
    label: string,
    prop: string,
    readonly?: boolean,
    type?: FieldType,
    inTable?: boolean,
}>()

const model = defineModel<ValueType>()

const value = ref(model.value);

if (props.type === 'date') {
    if (typeof model.value === 'object' && model.value instanceof Date) {
        value.value = model.value.toISOString().split('T')[0];
    } else {
        console.warn('Invalid date value:', model.value, 'for prop:', props.prop);
    }
}

if (props.type === 'time') {
    if (typeof model.value === 'object' && model.value instanceof Date) {
        value.value = model.value.toLocaleTimeString().substring(0, 5);
    } else {
        console.warn('Invalid time value:', model.value, 'for prop:', props.prop);
    }
}

const emits = defineEmits<{
    (e: 'validate', prop: string, value?: ValueType): void,
}>();

let originalValue = value.value;

const checkValidate = () => {
    if (props.readonly) { return; }
    if (value.value === originalValue) { return; }

    let updatedValue = value.value;
    if (props.type === 'date' && typeof updatedValue === 'string') {
        updatedValue = new Date(updatedValue);
    }

    if (props.type === 'time' && typeof updatedValue === 'string') {
        if (model.value instanceof Date) {
            updatedValue = new Date(model.value.toDateString() + ' ' + updatedValue);
        }
    }

    emits('validate', props.prop, updatedValue);
    originalValue = value.value;
    model.value = updatedValue;
}

</script>

<template>
    <div class="field" :class="{ 'in-table': !!props.inTable }">
        <label :for="props.prop" v-if="!props.inTable">{{ props.label }}</label>
        <div v-if="props.type === 'checkbox'">
            <label class="switch">
                <input type="checkbox" :disabled="!!readonly" :name="props.prop" :id="props.prop" v-model="value"
                    @change="checkValidate()">
                <span class="slider round"></span>
            </label>
        </div>
        <input v-else :type="props.type ?? 'text'" :disabled="!!readonly" :name="props.prop" :id="props.prop"
            v-model="value" @blur="checkValidate()" :key="model?.toString() ?? '-'">
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

.switch {
    position: relative;
    display: inline-block;
    width: 3rem;
    height: 1.5rem;
}

/* Hide default HTML checkbox */
.switch input {
    opacity: 0;
    width: 0;
    height: 0;
}

/* The slider */
.slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--color-background-mute);
    -webkit-transition: .4s;
    transition: .4s;
}

.slider:before {
    position: absolute;
    content: "";
    height: 1rem;
    width: 1rem;
    left: 0.25rem;
    bottom: 0.25rem;
    background-color: var(--color-border-hover);
    -webkit-transition: .4s;
    transition: .4s;
}

input:checked+.slider {
    background-color: var(--color-highlight);
}

input:checked+.slider:before {
    -webkit-transform: translateX(1.5rem);
    -ms-transform: translateX(1.5rem);
    transform: translateX(1.5rem);
}

/* Rounded sliders */
.slider.round {
    border-radius: 34px;
}

.slider.round:before {
    border-radius: 50%;
}
</style>