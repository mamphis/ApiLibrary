<script setup lang="ts">
import { ref } from 'vue';
import { useNotificationStore } from '../stores/notification';
import NotificationView from './notification/Notification.vue';
import { Notification } from './notification/notification';

type HorizontalPosition = 'left' | 'right';
type VerticalPosition = 'top' | 'bottom';
type Position = `${HorizontalPosition}-${VerticalPosition}`;

const props = defineProps<{
    position?: Position;
}>();

const position = props.position || 'right-top';

const { onSendNofification } = useNotificationStore();
let notifications = ref<Notification[]>();

onSendNofification((event) => {
    const { data } = event;
    if (data) {
        if (notifications.value) {
            const newNotification = new Notification(
                data.type,
                data.message.title,
                data.message.message,
                data.onclick
            );
            if (position.includes('-top')) {
                notifications.value = [...notifications.value, newNotification];
            } else {
                notifications.value = [newNotification, ...notifications.value];
            }
        } else {
            notifications.value = [
                new Notification(data.type, data.message.title, data.message.message, data.onclick),
            ];
        }
    }
});

const filterNotifications = (notificationId: number) => {
    if (notifications.value) {
        notifications.value = notifications.value.filter(
            (notification) => notification.id !== notificationId
        );
    }
};
</script>

<template>
    <div id="notification" :class="position">
        <NotificationView
            v-for="notification in notifications"
            :key="notification.id"
            :notification="notification"
            @close="filterNotifications"
        />
    </div>
</template>

<style scoped>
#notification {
    position: absolute;
    z-index: 100;
    right: 0;
    top: 8px;
    min-width: 20%;
}

#notification.left-top {
    left: 0;
    top: 8px;
}
#notification.left-bottom {
    left: 0;
    bottom: 8px;
}
#notification.right-top {
    right: 0;
    top: 8px;
}
#notification.right-bottom {
    right: 0;
    bottom: 8px;
}
</style>
