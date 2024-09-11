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
        <h1 class="title">{{ title }}</h1>
        <div class="action-banner">
            <slot name="actions"></slot>
        </div>
        <slot></slot>
        <div class="buttons">
            <button v-if="backVisible" @click="emits('back')">Back</button>
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
</style>