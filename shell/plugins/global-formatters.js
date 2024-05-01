/* eslint-disable no-console */
import Vue from 'vue';const components = require.context('@shell/components/formatter', false, /[A-Z]\w+\.(vue)$/);

const globalFormatters = {
  install: (Vue) => {
    components.keys().forEach((fileName) => {
      const componentConfig = components(fileName);
      const componentName = fileName.split('/').pop().split('.')[0];

      if (Vue.component(componentName)) {
        // eslint-disable-next-line no-console
        console.debug(`Skipping ${ componentName } install. Component already exists.`);
      } else {
        Vue.component(componentName, componentConfig.default || componentConfig);
      }
    });
  }
};

export default globalFormatters;

console.warn('The implicit addition of global formatters has been deprecated in Rancher Shell and will be removed in a future version. Make sure to invoke `Vue.use(globalFormatters)` to maintain compatibility.');

Vue.use(globalFormatters);
