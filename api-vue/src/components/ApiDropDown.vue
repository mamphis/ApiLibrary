<script setup lang="ts">
import type { ValueType } from '../types/helper';
import Fuse from 'fuse.js';
import { AutoComplete, AutoCompleteCompleteEvent, AutoCompleteOptionSelectEvent } from 'primevue';
import { computed, ref, nextTick, watch } from 'vue';

type Model = {
    id: string;
    [key: string]: ValueType | Model;
};

const props = defineProps<{
    label: string;
    prop: string;
    readonly?: boolean;
    list: Model[];
    displayValues: Array<keyof Model>;
    inTable?: boolean;
}>();

const model = defineModel<ValueType>();

const emits = defineEmits<{
    (e: 'validate', prop: string, id: string | null, selectedValue?: Model): void;
}>();

const inputField = ref<(typeof AutoComplete & { $el?: HTMLDivElement }) | null>(null);

const fuse = new Fuse(props.list, {
    keys: props.displayValues as string[],
    threshold: 0.3,
});

const filteredList = ref<Model[]>([]);

const onComplete = (event: AutoCompleteCompleteEvent) => {
    const { query } = event;

    const result = fuse.search(query);
    filteredList.value = result.map((item) => item.item);
};

const onSelect = (event: AutoCompleteOptionSelectEvent) => {
    emits('validate', props.prop, event.value.id, event.value);
};

const focus = () => {
    inputField.value?.$el?.querySelector('input')?.focus();
};

defineExpose({
    focus,
});
</script>

<template>
    <div class="field" :class="{ 'in-table': !!props.inTable }">
        <label :for="props.prop" v-if="!props.inTable">{{ props.label }}</label>
        <AutoComplete
            ref="inputField"
            v-model="model"
            @complete="onComplete"
            @item-select="onSelect"
            :suggestions="filteredList"
            size="small"
            complete-on-focus
            input-class="field-input"
            dropdown-class="select-wrapper"
            :minlength="0"
            :disabled="props.readonly"
            :option-label="(data) => data[props.displayValues.at(0) as string]"
            fluid
        >
            <template #option="slotProps">
                <div>
                    {{
                        displayValues.map((displayKey) => slotProps.option[displayKey]).join(' - ')
                    }}
                </div>
            </template>
        </AutoComplete>
    </div>
</template>
<style lang="css" scoped>
@import url('@/assets/style/field.css');
</style>
