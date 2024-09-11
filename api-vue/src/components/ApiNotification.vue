<script setup lang="ts">
import { ref } from 'vue';
import { useNotificationStore } from '../stores/notification';
import NotificationView from './notification/Notification.vue';
import { Notification } from './notification/notification';

const { onSendNofification } = useNotificationStore();
let notifications = ref<Notification[]>();

onSendNofification((event) => {
    const { data } = event;
    if (data) {
        if (notifications.value) {
            notifications.value = [...notifications.value, new Notification(data.type, data.message.title, data.message.message, data.onclick)];
        } else {
            notifications.value = [new Notification(data.type, data.message.title, data.message.message, data.onclick)];
        }
    }
});

const filterNotifications = (notificationId: number) => {
    if (notifications.value) {
        notifications.value = notifications.value.filter((notification) => notification.id !== notificationId);
    }
};

</script>

<template>
    <div id="notification">
        <NotificationView v-for="notification in notifications" :key="notification.id" :notification="notification"
            @close="filterNotifications" />
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
</style>