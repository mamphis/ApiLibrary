<script setup lang="ts">
import { Ref, ref, watch } from 'vue';


const {
    max,
    value,
    style,
} = defineProps<{
    max: number;
    value: Ref<number>;
    style: string;
}>();

const bar = ref<HTMLDivElement | null>(null);

watch(() => value, (newValue) => {
    if (bar.value) {
        bar.value.style.width = `${(newValue as unknown as number / (max === 0 ? 1 : max)) * 100}%`;
    }
});

</script>

<template>
    <div class="progress" :class="style">
        <div class="bar" ref="bar"></div>
    </div>
</template>

<style scoped>
.progress {
    position: absolute;
    bottom: 0;
    left: 0;
    height: 4px;
    transition: width 0.5s ease;
    width: 100%;
    appearance: none;
    border: none;
    border-radius: 2px;
    display: block;
    overflow: hidden;
    padding: 0;
    width: 100%;
}

.progress>.bar {
    height: 100%;
    width: 100%;
    transition: width 5ms ease;
}

.progress.error>.bar {
    background-color: #a71d1d;
}

.progress.warning>.bar {
    background-color: #af5815;
}

.progress.info>.bar {
    background-color: #002574;
}
.progress.success>.bar {
    background-color: #0e5f57;
}

</style>