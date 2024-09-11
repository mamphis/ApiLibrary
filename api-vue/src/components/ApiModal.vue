<script setup lang="ts">
import { useSlots } from 'vue';


const visible = defineModel<boolean>('visible');
const hide = () => {
    visible.value = false;
};

const slots = useSlots();


</script>

<template>
    <div class="modal" v-if="visible">
        <div class="modal-background" @click="hide()"></div>
        <div class="modal-container">
            <span class="modal-close" @click="hide()"></span>

            <div class="modal-header" v-if="!!slots['header']">
                <slot name="header"></slot>
            </div>
            <div class="modal-content">
                <slot></slot>
            </div>
            <div class="modal-footer" v-if="!!slots['footer']">
                <slot name="footer"></slot>
            </div>
        </div>
    </div>
</template>

<style scoped>
.modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.modal-background {
    position: absolute;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.5);
}

.modal-container {
    position: relative;
    background-color: var(--color-background);
    padding: 1rem;
    border-radius: 5px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
    min-width: 50%;
    min-height: 50%;
}

.modal-header {
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
    margin: -1rem -1rem 1rem -1rem;
    padding: 1rem;
}


.modal-close {
    position: absolute;
    top: 10px;
    right: 10px;
    width: 20px;
    height: 20px;
    background-color: var(--color-button-hover);
    border-radius: 50%;
    cursor: pointer;
}

.modal-close::before,
.modal-close::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 2px;
    height: 60%;
    background-color: var(--color-text);
    transform: translate(-50%, -50%) rotate(45deg);
}

.modal-close::after {
    transform: translate(-50%, -50%) rotate(-45deg);
}

.modal-content {
    margin-top: 20px;
}
</style>