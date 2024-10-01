<script setup lang="ts">
import { computed } from 'vue';

const { title, showBackButton } = defineProps<{
    title: string,
    showBackButton?: boolean | undefined,
}>();

const backVisible = computed(() => !!showBackButton);

const emits = defineEmits<{
    (e: 'back'): void,
}>();
</script>

<template>
    <main>
        <div class="content">
            <div class="main-content">
                <h1 class="title">{{ title }}</h1>
                <div class="action-banner" v-if="$slots.actions">
                    <slot name="actions"></slot>
                </div>
                <slot></slot>
                <div class="factboxes" v-if="$slots.factboxes">
                    <slot name="factboxes"></slot>
                </div>
            </div>
            <div class="buttons">
                <button v-if="backVisible" @click="emits('back')">Back</button>
                <slot name="buttons"></slot>
            </div>
        </div>
    </main>
</template>


<style lang="css" scoped>
.action-banner {
    display: flex;
    margin-bottom: 1rem;
    margin-top: 0.5rem;
}

.action-banner :deep(button) {
    border-radius: 0px !important;
}

main {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.content {
    display: flex;
    flex: 1;
    flex-direction: row;
}

.main-content {
    display: flex;
    flex-direction: column;

    flex: 4;

    padding: 1rem;
}

.factboxes {
    display: flex;
    flex-direction: column;

    flex: 1;
    padding: 1rem;
}

.factboxes:empty {
    display: none;
}

.factboxes>* {
    border: 1px solid var(--color-border);
    margin-bottom: 1rem;
    padding: 0.5rem 0.25rem;

    border-radius: 0.25rem;
}
</style>