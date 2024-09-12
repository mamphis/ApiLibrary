## Usage

### Import Components

```typescript
// main.ts

import { createApp } from 'vue'
import ApiView from '@mamphis/api-vue';

import App from './App.vue'

const app = createApp(App);

app.use(ApiView);

app.mount('#app');
```

### Import css Styles
```css
/* main.css */

@import '@mamphis/api-vue/dist/style.css';
``` 

## Components
### ApiCard
Basic Wrapper to display fields inside.

- Properties
    - `title: string` - The title that is displayed in the header of the Card
    - `showBackButton: boolean = true` - Displays the "Back" button at the bottom of the card that fires the `@back` Event
- Emits
    - `@back`: Fires when the Back action is pressed
- Slots
    - default: All Fields and Content
    - `actions`: Bar below the title. Mainly to display custom buttons

#### Usage Example
```vue
<script setup lang="ts">
import { useUserStore } from '@/stores/userStore';
import type { ValueType } from '@/types/helper';
import { ApiCard, ApiField } from '@mamphis/api-vue';
import { storeToRefs } from 'pinia';

const userStore = useUserStore();
const { user } = storeToRefs(userStore);

const validate = async (key: string, value?: ValueType) => {
    user.value = await userStore.validate(key, value);
}

</script>

<template>
    <ApiCard v-if="user" title="Edit Profile">
        <ApiField @validate="validate" prop="email" v-model="user.email" label="E-Mail" readonly />
        <ApiField @validate="validate" prop="name" v-model="user.name" label="Name" />
    </ApiCard>
</template>
```

### ApiField

### ApiDropDown
A Special Type of ApiField that lets the user select a value from a provided list.

Types
```ts
type Model = {
    id: string;
    [key: string]: ValueType | Model,
}
```

- Props
    - `label: string` - The Label that will be shown when not in table mode
    - `prop: string` - The property-key that will be emitted when the value changes
    - `readonly?: boolean` - If the field is readonly
    - `list: Model[]` - The list of values that can be selected
    - `displayValues: Array<keyof Model>` - The keys of the model that will be displayed in the dropdown
    - `inTable?: boolean` - If the field is displayed in table mode
- Emits
    - `@validate(prop: string, id?: string, model?: Model)`: Fires when the value changes
- Model
    - `ValueType`: `string | number | boolean | Date | null`
- Exposes
    - `focus()`: Focuses the input field

#### Usage Example
```vue
<script setup lang="ts">
import { ApiDropDown } from '@mamphis/api-vue';
import { useVendorStore, type Vendor } from '@/stores/vendor';
import { storeToRefs } from 'pinia';
import { ref } from 'vue';

const invoiceHeader = ref({
    purchaseDate: new Date(),
    vendorId: '',
});

const vendorStore = useVendorStore();
vendorStore.fetchVendors();
const { vendors } = storeToRefs(vendorStore);
const vendor = ref<Vendor>(vendorStore.nil);

const onVendorValidate = async (prop: string, vendorId?: string) => {
    if (!vendorId) { return; }

    invoiceHeader.value.vendorId = vendorId;
    vendor.value = vendors.value.find(c => c.id === vendorId)!;
};
</script>

<template>
    <main v-if="invoiceHeader">
        <DropDown @validate="onVendorValidate" :list="vendors" :displayValues="['vendorNo', 'name']"
            v-model="vendor.vendorNo" prop="vendorId" label="Vendor No."></DropDown>
        <DropDown @validate="onVendorValidate" :list="vendors" :displayValues="['vendorNo', 'name']"
            v-model="vendor.name" prop="vendorId" label="Vendor Name"></DropDown>
    </main>
</template>
```

### ApiModal

### ApiSearchbar

### ApiNotification
Container that displays notifications to the user.

The container can be placed anywhere in the app. It will always be displayed at the top of the screen.

#### Usage Example
```vue

<template>
    <ApiNotification />

    <main>
        <!-- Your Content -->
    </main>
</template>
```

## Stores
### notification
Used to send notifications to the user.

```ts
type NotificationType = 'info' | 'success' | 'warning' | 'error';
type Message = {
    title: string;
    message?: string;
};
type sendNotification = (type: NotificationType, message: Message | string, onclick?: () => void) => void
```

#### Usage Example
```ts
import { useNotificationStore } from '@mamphis/api-vue';

const { sendNotification } = useNotificationStore();
sendNotification('info', { title: 'Saving Successfull', message: 'Successfully saved the entity' }, () => {
    // Navigate to Entity on Click
});
```

### storeFunctions
Used to call api functions.