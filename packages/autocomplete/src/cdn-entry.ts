import { createAutocompletePlugin } from './index';

declare const Radar: typeof import('radar-sdk-js').default | undefined;

if (typeof Radar !== 'undefined' && Radar?.registerPlugin) {
  Radar.registerPlugin(createAutocompletePlugin());
}
