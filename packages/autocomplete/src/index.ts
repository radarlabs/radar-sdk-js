import '../styles/radar-autocomplete.css';
import AutocompleteUI from './autocomplete';
import version from './version';

import type { RadarAutocompleteUIOptions } from './types';
import type { RadarPlugin } from 'radar-sdk-js';

export type { RadarAutocompleteUIOptions, RadarAutocompleteConfig } from './types';

declare module 'radar-sdk-js' {
  interface RadarUI {
    autocomplete(options: Partial<RadarAutocompleteUIOptions>): AutocompleteUI;
  }
  namespace Radar {
    let ui: RadarUI; // eslint-disable-line no-unused-vars
  }
}

/**
 * create the Radar autocomplete plugin
 *
 * @returns a plugin that adds `Radar.ui.autocomplete()` method
 *
 * @example
 * ```ts
 * import { createAutocompletePlugin } from '@radarlabs/plugin-autocomplete';
 * Radar.registerPlugin(createAutocompletePlugin());
 * ```
 */
export function createAutocompletePlugin(): RadarPlugin {
  return {
    name: 'autocomplete',
    version,
    install(ctx) {
      const existing = ctx.Radar.ui || {};
      // NOTE(jasonl): we're merging with the existing ui namespace since other plugins also add to it like maps
      ctx.Radar.ui = {
        ...existing,
        autocomplete: (options: Partial<RadarAutocompleteUIOptions>) => new AutocompleteUI(options, ctx),
      };
    },
  };
}
