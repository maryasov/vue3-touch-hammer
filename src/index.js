import Component from './component';
import { customEvents, register } from './events';

const install = (app, options = {}) => {
  if (install.installed === true) return;
  install.installed = true;
  Component.config = install.config;
  app.component(options.name || 'v-touch', Component);
};

install.config = {};

// if (typeof window !== 'undefined' && window.Vue) {
//   window.Vue.use(install)
// }

const registerCustomEvent = (event, options) => {
  if (install.installed) {
    console.warn(`
      [vue-touch]: Custom Event '${event}' couldn't be added to vue-touch.
      Custom Events have to be registered before installing the plugin.
      `);
    return;
  }

  register(event, options);
};

// Plugin
const plugin = {
  // eslint-disable-next-line no-undef
  // version: VERSION,
  install,
  registerCustomEvent,
};

export default plugin;
export { Component as VTouch, customEvents };
