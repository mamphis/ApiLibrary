<script setup lang="ts">
import { useNotificationStore, type NotificationType } from '../stores/notification';
import { ref } from 'vue';

const { onSendNofification } = useNotificationStore();
let notifications = ref<Notification[]>([]);
let notificationId = 0;
class Notification {
    readonly maxTime = 5000;
    timeLeft = ref<number>(this.maxTime);

    private running = true;
    readonly id = ++notificationId;

    private previousTimestamp: number = 0;

    constructor(public readonly type: NotificationType, public readonly title: string, public readonly message?: string, public readonly onclick?: () => void) {
        requestAnimationFrame(this.update.bind(this));
    }

    update(timestamp: number) {
        if (this.previousTimestamp === 0) {
            this.previousTimestamp = timestamp;
        }

        let elapsed = timestamp - this.previousTimestamp;
        if (!this.running) {
            elapsed = 0;
        }

        this.previousTimestamp = timestamp;

        this.timeLeft.value -= elapsed;
        requestAnimationFrame(this.update.bind(this));

        if (this.timeLeft.value < 0) {
            setTimeout(() => {
                this.clear();
            }, 500);
        }
    }

    clear() {
        this.running = false;
        notifications.value = notifications.value.filter(n => n.id != this.id);
    }

    pause() {
        this.running = false;
    }

    continue() {
        this.running = true;
    }
}

onSendNofification((event) => {
    if (event.data) {
        notifications.value.push(new Notification(event.data.type, event.data.message.title, event.data.message.message, event.data.onclick) as any);
    }
});
</script>

<template>
    <div id="notification">
        <Transition v-for="notification in notifications" :key="notification.title">
            <div class="notification is-light" v-if="notification.timeLeft as number > 0"
                :class="'is-' + notification.type + (notification.onclick ? ' clickable' : '')"
                @mouseenter="notification.pause()" @mouseleave="notification.continue()"
                @click.prevent="notification.onclick?.()">
                <button class="delete" @click.prevent="notification.clear()"></button>
                <progress class="progress" :value="notification.timeLeft as number"
                    :max="notification.maxTime"></progress>
                <div class="notification-content">
                    <h2 class="notification-title">{{ notification.title }}</h2>
                    <p v-if="notification.message" class="notification-message">{{ notification.message }}</p>
                </div>
            </div>
        </Transition>
    </div>
</template>

<style scoped>
.v-leave-active {
    transition: opacity 0.5s ease;
}

.v-leave-to {
    opacity: 0;
}

#notification {
    position: absolute;
    z-index: 100;
    right: 0;
    top: 8px;
    min-width: 20%;
}

#notification .progress {
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

#notification>div {
    user-select: none;
}

#notification>div.clickable {
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

.notification.is-warning {
    background-color: #F57D1F60;
    border: 1px solid #F57D1F;
    color: var(--color-text);
}

.notification.is-warning progress::-webkit-progress-value {
    background-color: #af5815;
}

.notification.is-info {
    background-color: #068ea960;
    border: 1px solid #068DA9;
    color: var(--color-text);
}

.notification.is-info progress::-webkit-progress-value {
    background-color: #044f5e;
}

.notification.is-success {
    background-color: #007F7360;
    border: 1px solid #007F73;
    color: var(--color-text);
}

.notification.is-success progress::-webkit-progress-value {
    background-color: #0e5f57;
}
</style>