import { ref } from "vue";
import { NotificationType } from "../../stores";

export class Notification {
    readonly maxTime = 5000;
    timeLeft = ref<number>(this.maxTime);
    isClosed = false;
    isClosing = false;

    private running = true;
    readonly id = Math.random();

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

        if (this.type === 'error') {
            elapsed = 0;
        }

        this.previousTimestamp = timestamp;

        this.timeLeft.value -= elapsed;

        if (this.timeLeft.value > 0) {
            requestAnimationFrame(this.update.bind(this));
        }

        if (this.timeLeft.value <= 0) {
            this.closeNotification.call(this);
        }
    }

    closeNotification() {
        this.isClosing = true;
        setTimeout(() => {
            this.clear.call(this);
        }, 500);
    }

    private clear() {
        this.running = false;
        this.isClosed = true;
    }

    pause() {
        this.running = false;
    }

    continue() {
        this.running = true;
    }
}