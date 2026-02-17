import Radar from 'radar-sdk-js';

import { createAutocompletePlugin } from './index';
export { RadarAutocompleteContainerNotFound } from './errors';

Radar.registerPlugin(createAutocompletePlugin());
