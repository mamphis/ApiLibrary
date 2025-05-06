<script setup lang="ts">
import { computed, defineAsyncComponent, ref } from 'vue';
import type { ValueType } from '../types/helper';

const Password = defineAsyncComponent(() => import('primevue/password'));
const InputText = defineAsyncComponent(() => import('primevue/inputtext'));
const InputNumber = defineAsyncComponent(() => import('primevue/inputnumber'));
const ToggleSwitch = defineAsyncComponent(() => import('primevue/toggleswitch'));
const DatePicker = defineAsyncComponent(() => import('primevue/datepicker'));
const TextArea = defineAsyncComponent(() => import('primevue/textarea'));

const StringFields = ['text', 'password', 'textarea'] as const;
const NumberFields = ['number', 'money', 'decimal'] as const;
const DateFields = ['date', 'time'] as const;
const BooleanFields = ['checkbox'] as const;

type StringFieldType = (typeof StringFields)[number];
type NumberFieldType = (typeof NumberFields)[number];
type DateFieldType = (typeof DateFields)[number];
type BooleanFieldType = (typeof BooleanFields)[number];

type FieldType = StringFieldType | NumberFieldType | DateFieldType | BooleanFieldType;

const props = defineProps<{
    label: string;
    prop: string;
    readonly?: boolean;
    type?: FieldType;
    inTable?: boolean;
    path?: string;
    currency?: string;
}>();

const model = defineModel<ValueType>();

const stringValue = ref<string | undefined>();
const numberValue = ref<number | undefined>();
const booleanValue = ref<boolean | undefined>();
const dateValue = ref<Date | undefined>();

const clickable = computed(() => !!props.path && !!props.readonly);
let type = props.type;

if (!type) {
    switch (typeof model.value) {
        case 'boolean':
            type = 'checkbox';
            break;
        case 'number':
            type = 'number';
            break;
        case 'string':
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD format
            if (dateRegex.test(model.value)) {
                type = 'date';
            } else {
                type = 'text';
            }
            break;
        default:
            console.warn('Invalid type for prop:', props.prop);
    }
}

function isFieldOfType(type: unknown, fieldTypes: readonly FieldType[]): boolean {
    if (!type) {
        return false;
    }

    if (typeof type !== 'string') {
        return false;
    }

    return fieldTypes.includes(type as FieldType);
}

function isBooleanFieldType(type: unknown): type is BooleanFieldType {
    return isFieldOfType(type, BooleanFields);
}

function isNumberFieldType(type: unknown): type is NumberFieldType {
    return isFieldOfType(type, NumberFields);
}

function isDateFieldType(type: unknown): type is DateFieldType {
    return isFieldOfType(type, DateFields);
}

function isStringFieldType(type: unknown): type is StringFieldType {
    return isFieldOfType(type, StringFields);
}

const value = computed(() => {
    if (!type) {
        return undefined;
    }

    if (isBooleanFieldType(type)) {
        return booleanValue.value;
    } else if (isNumberFieldType(type)) {
        return numberValue.value;
    } else if (isDateFieldType(type)) {
        return dateValue.value;
    } else if (isStringFieldType(type)) {
        return stringValue.value;
    }
    return undefined;
});

if (isBooleanFieldType(type)) {
    if (typeof model.value === 'boolean') {
        booleanValue.value = model.value;
    } else {
        console.warn('Invalid checkbox value:', model.value, 'for prop:', props.prop);
    }
}

if (type === 'date') {
    if (typeof model.value === 'object' && model.value instanceof Date) {
        dateValue.value = model.value;
    } else if (typeof model.value === 'string') {
        const date = new Date(model.value);
        if (!isNaN(date.getTime())) {
            dateValue.value = date;
        } else {
            console.warn('Invalid date string:', model.value, 'for prop:', props.prop);
        }
    } else {
        console.warn('Invalid date value:', model.value, 'for prop:', props.prop);
    }
}

if (type === 'time') {
    if (typeof model.value === 'object' && model.value instanceof Date) {
        dateValue.value = model.value;
    } else if (typeof model.value === 'string') {
        const timeParts = model.value.split(':');
        if (timeParts.length === 2) {
            const date = new Date();
            date.setHours(parseInt(timeParts[0]), parseInt(timeParts[1]));
            dateValue.value = date;
        } else {
            console.warn('Invalid time string:', model.value, 'for prop:', props.prop);
        }
    } else {
        console.warn('Invalid time value:', model.value, 'for prop:', props.prop);
    }
}

if (isNumberFieldType(type)) {
    if (typeof model.value === 'number') {
        numberValue.value = model.value;
    } else if (typeof model.value === 'string') {
        const num = parseFloat(model.value);
        if (!isNaN(num)) {
            numberValue.value = num;
        } else {
            console.warn('Invalid number string:', model.value, 'for prop:', props.prop);
        }
    } else {
        console.warn('Invalid number value:', model.value, 'for prop:', props.prop);
    }
}

if (isStringFieldType(type) || !type) {
    if (typeof model.value === 'string') {
        stringValue.value = model.value;
    } else {
        console.warn('Invalid string value:', model.value, 'for prop:', props.prop);
    }
}

const emits = defineEmits<{
    (e: 'validate', prop: string, value?: ValueType): void;
    (e: 'click', path: string): void;
}>();

let originalValue = value.value;

const checkValidate = () => {
    if (props.readonly) {
        return;
    }
    if (value.value === originalValue) {
        return;
    }

    let updatedValue = value.value;
    if (type === 'date' && typeof updatedValue === 'string') {
        updatedValue = new Date(updatedValue);
    }

    if (type === 'time' && typeof updatedValue === 'string') {
        if (model.value instanceof Date) {
            updatedValue = new Date(model.value.toDateString() + ' ' + updatedValue);
        }
    }

    emits('validate', props.prop, updatedValue);
    originalValue = value.value;
    model.value = updatedValue;
};

const onClick = () => {
    if (clickable.value) {
        emits('click', props.path!);
    }
};

const minFractionDigits = computed(() => {
    if (type === 'money') {
        return 2;
    }
    if (type === 'decimal') {
        return 2;
    }
    return undefined;
});

const numberInputMode = computed(() => {
    if (type === 'money') {
        return 'currency';
    }
    return undefined;
});

const numberInputCurrency = computed(() => {
    if (type === 'money') {
        return props.currency ?? 'EUR';
    }
    return undefined;
});
</script>

<template>
    <div class="field" :class="{ 'in-table': !!props.inTable, clickable: clickable }">
        <label :for="props.prop" v-if="!props.inTable">{{ props.label }}</label>
        <ToggleSwitch
            v-if="type === 'checkbox'"
            size="small"
            :disabled="!!readonly"
            :name="props.prop"
            :id="props.prop"
            v-model="booleanValue"
            @blur="checkValidate()"
        />
        <DatePicker
            v-else-if="type === 'date' || type === 'time'"
            :disabled="!!readonly"
            size="small"
            :name="props.prop"
            :id="props.prop"
            v-model="dateValue"
            :time-only="type === 'time'"
            showIcon
            dateFormat="dd.mm.yy"
            fluid
            @blur="checkValidate()"
        />
        <Password
            v-else-if="type === 'password'"
            size="small"
            :disabled="!!readonly"
            :id="props.prop"
            :name="props.prop"
            @blur="checkValidate()"
            fluid
            toggleMask
            v-model="stringValue"
        >
        </Password>
        <InputNumber
            v-else-if="type === 'number' || type === 'money' || type === 'decimal'"
            v-model="numberValue"
            size="small"
            :minFractionDigits="minFractionDigits"
            :useGrouping="false"
            :mode="numberInputMode"
            :currency="numberInputCurrency"
            :disabled="!!readonly"
            :name="props.prop"
            fluid
            @blur="checkValidate()"
        />
        <TextArea
            v-else-if="type === 'textarea'"
            :disabled="!!readonly"
            :name="props.prop"
            :id="props.prop"
            v-model="stringValue"
            rows="5"
            @blur="checkValidate()"
            :autoResize="true"
            fluid
        />
        <InputText
            v-else
            size="small"
            v-model="stringValue"
            :disabled="!!readonly"
            :name="props.prop"
            fluid
            @blur="checkValidate()"
        />
    </div>
</template>

<style lang="css" scoped>
@import url('@/assets/style/field.css');
</style>
