import Radar from '../src/index';

import type { RadarPlugin, RadarPluginContext } from '../src/plugin';

const capturePlugin = (name: string, version: string) => {
  let captured: RadarPluginContext | undefined;
  const plugin: RadarPlugin = {
    name,
    version,
    install(ctx) {
      captured = ctx;
    },
  };
  return { plugin, context: () => captured };
};

describe('registerPlugin', () => {
  describe('integration attribution', () => {
    it('should tag the context with the plugin that is installing', () => {
      const { plugin, context } = capturePlugin('autocomplete', '1.2.0');

      Radar.registerPlugin(plugin);

      expect(context()!.integration).toEqual({ name: 'autocomplete', version: '1.2.0' });
    });

    it('should give each plugin its own tag rather than a shared context', () => {
      const first = capturePlugin('maps', '1.2.0');
      const second = capturePlugin('fraud', '0.4.1');

      Radar.registerPlugin(first.plugin, second.plugin);

      expect(first.context()!.integration).toEqual({ name: 'maps', version: '1.2.0' });
      expect(second.context()!.integration).toEqual({ name: 'fraud', version: '0.4.1' });
      expect(first.context()).not.toBe(second.context());
    });
  });
});
