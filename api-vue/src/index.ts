import { App } from 'vue';
import * as components from './components';
import PrimeVue from 'primevue/config';
import PrimeTheme from '@primeuix/themes/material';

function install(app: App) {
    for (const key in components) {
        // @ts-expect-error
        app.component(key, components[key]);
    }

    app.use(PrimeVue, {
        theme: {
            preset: PrimeTheme,
        },
    });
}

export default { install };

export * from './components';
export * from './stores';
