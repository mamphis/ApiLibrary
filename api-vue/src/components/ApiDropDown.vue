<script setup lang="ts">
import Fuse from 'fuse.js';
import {
    AutoComplete,
    type AutoCompleteCompleteEvent,
    type AutoCompleteOptionSelectEvent,
} from 'primevue';
import { defineAsyncComponent, onMounted, ref, useTemplateRef, watch } from 'vue';
import type { ValueType } from '../types/helper';
import { nextTick } from 'vue';

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

const autoComplete = useTemplateRef<typeof AutoComplete & { $el: HTMLDivElement }>('inputField');

const fuse = new Fuse(props.list, {
    keys: props.displayValues as string[],
    threshold: 0.3,
    minMatchCharLength: 0,
});

watch(
    () => props.list,
    () => {
        fuse.setCollection(props.list);
    }
);

const filteredList = ref<Model[]>([]);

const search = (query: string) => {
    if (!query || query === '') {
        filteredList.value = props.list;
        return;
    }

    const result = fuse.search(query);
    filteredList.value = result.map((item) => item.item);
};

const onComplete = (event: AutoCompleteCompleteEvent) => {
    const { query } = event;

    search(query);
};

const onSelect = (event: AutoCompleteOptionSelectEvent) => {
    emits('validate', props.prop, event.value.id, event.value);
};

const focus = () => {
    autoComplete.value?.$el?.querySelector('input')?.focus();
    search('');
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
