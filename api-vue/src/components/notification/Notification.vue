<script lang="ts" setup>
import { ref, watch } from 'vue';
import { Notification } from './notification';
import Progress from './Progress.vue';

const emits = defineEmits<{
    (e: 'close', notificationId: number): void;
}>();

const { notification } = defineProps<{
    notification: Notification;
}>();

const visible = ref(true);

watch(() => notification, (notification) => {
    if (notification.isClosed) {
        emits('close', notification.id);
    }
    if (notification.isClosing) {
        visible.value = false;
    }
}, { deep: true });

const closeNotification = () => {
    notification.closeNotification.call(notification);
};
</script>

<template>
    <Transition>
        <div class="notification is-light" v-if="visible"
            :class="'is-' + notification.type + (notification.onclick ? ' clickable' : '')"
            @mouseenter="notification.pause()" @mouseleave="notification.continue()"
            @click.stop="notification.onclick?.()">
            <button class="delete" @click.stop="closeNotification()"></button>

            <Progress class="progress" :style="notification.type" :value="notification.timeLeft"
                :max="notification.maxTime" />
            <div class="notification-content">
                <h2 class="notification-title">{{ notification.title }}</h2>
                <p v-if="notification.message" class="notification-message">{{ notification.message }}</p>
            </div>
        </div>
    </Transition>
</template>

<style scoped>
.v-leave-active {
    transition: opacity 0.5s ease;
}

.v-leave-to {
    opacity: 0;
}

.notification:not(.is-error)>div {
    user-select: none;
}

.notification.is-error {
    background-color: #D32F2F60;
    border: 1px solid #D32F2F;
    color: var(--color-text);
}

.notification.is-warning {
    background-color: #F57D1F60;
    border: 1px solid #F57D1F;
    color: var(--color-text);
}

.notification.is-info {
    background-color: #068ea960;
    border: 1px solid #068DA9;
    color: var(--color-text);
}

.notification.is-success {
    background-color: #007F7360;
    border: 1px solid #007F73;
    color: var(--color-text);
}

.notification>div.clickable {
    cursor: pointer;
}

.notification {
    position: relative;
    margin: 8px;
    padding: 8px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
    transition: opacity 0.5s ease;
}

.notification .notification-title {
    margin: 0;
    font-size: 1.15rem;
}

.notification-content {
    margin: 8px;
}

.notification>button.delete {
    position: absolute;
    top: 4px;
    right: 4px;
    width: 20px;
    height: 20px;
    background-color: var(--color-button-hover);
    border-radius: 50%;
    cursor: pointer;
    min-width: 0px;
    padding: 0px;

    z-index: 110;
}

.notification>button.delete::before,
.notification>button.delete::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 2px;
    height: 60%;
    background-color: var(--color-text);
    transform: translate(-50%, -50%) rotate(45deg);
}

.notification>button.delete::after {
    transform: translate(-50%, -50%) rotate(-45deg);
}
</style>