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

### ApiDropDown

### ApiModal

### ApiSearchbar

### ApiNotification

### ApiField

## Stores
### notification
Used to send notifications to the user.

### storeFunctions
Used to call api functions.