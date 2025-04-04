<script setup lang="ts">
import { computed, ref } from 'vue';
import type { ValueType } from '../types/helper';
import EyeOff from '@/assets/eye-off.svg';
import EyeOn from '@/assets/eye-on.svg';

type FieldType = 'password' | 'date' | 'time' | 'number' | 'checkbox' | 'text' | 'file';

const props = defineProps<{
    label: string,
    prop: string,
    readonly?: boolean,
    type?: FieldType,
    inTable?: boolean,
    path?: string;
}>()

const model = defineModel<ValueType>()
const value = ref(model.value);

const clickable = computed(() => !!props.path && !!props.readonly);

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
    (e: 'click', path: string): void,
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

const onClick = () => {
    if (clickable.value) {
        emits('click', props.path!);
    }
};

const passwordVisible = ref(false);
const passwordType = computed(() => passwordVisible.value ? 'text' : 'password');

</script>

<template>
    <div class="field" :class="{ 'in-table': !!props.inTable, clickable: clickable }">
        <label :for="props.prop" v-if="!props.inTable">{{ props.label }}</label>
        <div v-if="props.type === 'checkbox'">
            <label class="switch">
                <input type="checkbox" :disabled="!!readonly" :name="props.prop" :id="props.prop" v-model="value"
                    @change="checkValidate()" @click="onClick">
                <span class="slider round"></span>
            </label>
        </div>
        <div v-else-if="props.type === 'password'" class="password">
            <input :type="passwordType" :disabled="!!readonly" :name="props.prop" :id="props.prop" v-model="value"
                @blur="checkValidate()" :key="model?.toString() ?? '-'" @click="onClick">
            <button @click="passwordVisible = !passwordVisible">
                <EyeOff v-if="passwordVisible" alt="Hide password" />
                <EyeOn v-else alt="Show password" />
            </button>
        </div>
        <input v-else-if="props.type === 'file'" type="file" :disabled="!!readonly" :name="props.prop" :id="props.prop"
            @change="checkValidate()" @click="onClick">
        <input v-else :type="props.type ?? 'text'" :disabled="!!readonly" :name="props.prop" :id="props.prop"
            v-model="value" @blur="checkValidate()" :key="model?.toString() ?? '-'" @click="onClick">
    </div>
</template>

<style scoped>
@import '@/assets/style/field.css';

.password {
    display: flex;
    flex: 1;
}

.password>input {
    border-radius: 0.25rem 0 0 0.25rem;
    border-right: 0;
    flex-grow: 1;
}

.password>button {
    border: 1px solid var(--color-border);
    border-radius: 0 0.25rem 0.25rem 0;
    padding: 0.5rem;
    background-color: var(--color-background);
    color: var(--color-text);
    cursor: pointer;
    margin: 0;

    min-width: 2rem;
    line-height: 0;
}

.password>button>svg {
    width: 1rem;
    height: 1rem;
}

.field.in-table input {
    border-radius: 0;
    background-color: transparent;
}

.field.in-table {
    margin-bottom: 0rem;
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