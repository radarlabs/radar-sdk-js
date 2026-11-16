import * as maplibre from 'maplibre-gl';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileFunction } from 'node:vm';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL('../../../..', import.meta.url));
const modules = new Map();
globalThis.fetch = () => {
  throw new Error('This test must not use the network.');
};

/* Test helpers isolate rendering while preserving the SDK and MapLibre event implementations. */
function loadSource(file) {
  const filename = path.resolve(root, file);
  if (modules.has(filename)) return modules.get(filename).exports;
  const module = { exports: {} };
  modules.set(filename, module);
  const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  compileFunction(output, ['require', 'module', 'exports'], { filename })(
    (name) =>
      name === 'maplibre-gl'
        ? maplibre
        : name.startsWith('.')
          ? loadSource(path.relative(root, path.resolve(path.dirname(filename), `${name}.ts`)))
          : require(name),
    module,
    module.exports,
  );
  return module.exports;
}

function geometry(kind, id) {
  return {
    id,
    type: 'Feature',
    geometry:
      kind === 'polygon'
        ? {
            type: 'Polygon',
            coordinates: [
              [
                [1, 1],
                [1, 2],
                [2, 2],
                [1, 1],
              ],
            ],
          }
        : {
            type: 'LineString',
            coordinates: [
              [1, 1],
              [2, 2],
            ],
          },
    properties: {},
  };
}

const RadarMap = loadSource('packages/maps/src/RadarMap.ts').default;

/** Preserve real Radar methods and MapLibre event dispatch without requiring WebGL. */
function createMap(styleReady = true, fullyLoaded = styleReady) {
  const map = Object.create(RadarMap.prototype);
  map._features = [];
  map._markers = [];
  const sources = new Map();
  const layers = new Map();
  const canvas = { style: { cursor: '' } };
  map.loaded = () => fullyLoaded;
  map.isStyleLoaded = () => styleReady;
  map.getCanvas = () => canvas;
  map.addSource = (id, source) => {
    assert.ok(styleReady, 'Cannot attach a source before the style is ready.');
    assert.ok(!sources.has(id), `Source ${id} already exists.`);
    sources.set(id, source);
    return map;
  };
  map.getSource = (id) => sources.get(id);
  map.removeSource = (id) => sources.delete(id);
  map.addLayer = (layer) => layers.set(layer.id, layer);
  map.getLayer = (id) => layers.get(id);
  map.removeLayer = (id) => layers.delete(id);
  map.queryRenderedFeatures = () => [{}];
  const finishLoading = (fireStyleLoad = true, eventType = 'data') => {
    styleReady = true;
    fullyLoaded = true;
    map.fire(new maplibre.Event(eventType));
    map.fire(new maplibre.Event('render'));
    if (fireStyleLoad) {
      map.fire(new maplibre.Event('style.load'));
    }
  };
  return { map, sources, layers, finishLoading };
}

const scenario = process.argv[2];
const add = (map, kind, id) =>
  kind === 'polygon' ? map.addPolygon(geometry(kind, id)) : map.addLine(geometry(kind, id));
const click = (map) => map.fire(new maplibre.Event('click', { point: { x: 0, y: 0 }, originalEvent: {} }));
function enableMouseEvents(map) {
  globalThis.MouseEvent = class MouseEvent {
    constructor(type, options = {}) {
      this.type = type;
      Object.assign(this, { clientX: 0, clientY: 0 }, options);
    }
  };
  Object.assign(map.getCanvas(), {
    clientLeft: 0,
    clientTop: 0,
    offsetWidth: 100,
    offsetHeight: 100,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }),
  });
  map.unproject = () => ({ lng: 0, lat: 0 });
  return () =>
    map.fire(
      new maplibre.Event('mousemove', {
        point: { x: 0, y: 0 },
        originalEvent: new MouseEvent('mousemove'),
      }),
    );
}
/* End test helpers. */

switch (scenario) {
  case 'pending-polygon':
  case 'pending-line': {
    const { map, sources, layers, finishLoading } = createMap(false);
    add(map, scenario === 'pending-polygon' ? 'polygon' : 'line', 'route');
    map.clearFeatures();
    assert.equal(map.listens('data'), false);
    assert.equal(map.listens('render'), false);
    finishLoading();
    assert.equal(map.getFeatures().length, 0);
    assert.equal(sources.size, 0, 'A cleared feature must not add an untracked source later.');
    assert.equal(layers.size, 0);
    break;
  }
  case 'reused-id-listeners': {
    const { map } = createMap();
    const owners = [];
    for (let i = 0; i < 5; i++) {
      map.clearFeatures();
      const feature = add(map, 'line', 'route');
      feature.on('click', (event) => owners.push(event.feature));
    }
    click(map);
    assert.deepEqual(owners, map.getFeatures(), 'A click must only reach the current route.');
    break;
  }
  case 'pending-id-reuse': {
    const { map, sources, layers, finishLoading } = createMap(false);
    const old = add(map, 'polygon', 'route');
    old.remove();
    const current = add(map, 'line', 'route');
    finishLoading();
    assert.equal(sources.size, 1);
    assert.equal(layers.size, 2);
    assert.deepEqual(map.getFeatures(), [current]);
    assert.equal(sources.get('route').data.geometry.type, 'LineString');
    break;
  }
  case 'remove-twice': {
    const { map, sources } = createMap();
    const old = add(map, 'polygon', 'route');
    old.remove();
    const current = add(map, 'line', 'route');
    old.remove();
    assert.deepEqual(map.getFeatures(), [current]);
    assert.equal(sources.size, 1, 'A removed handle must not delete its replacement.');
    break;
  }
  case 'style-readiness': {
    const { map, sources, finishLoading } = createMap(false);
    add(map, 'polygon', 'zone');
    map.fire(new maplibre.Event('data'));
    assert.equal(sources.size, 0);
    finishLoading();
    assert.equal(sources.size, 1);
    break;
  }
  case 'style-already-ready': {
    const { map, sources } = createMap(true, false);
    add(map, 'polygon', 'zone');
    assert.equal(sources.size, 1, 'A ready style does not need to wait for unrelated tiles.');
    break;
  }
  case 'tiles-pending-after-style-load': {
    const { map, sources, finishLoading } = createMap(false);
    map.fire(new maplibre.Event('style.load'));
    add(map, 'line', 'route');
    map.fire(new maplibre.Event('data'));
    assert.equal(sources.size, 0);
    finishLoading(false);
    assert.equal(sources.size, 1, 'Source readiness must still attach a feature after style.load has fired.');
    break;
  }
  case 'ready-after-tile-error': {
    const { map, sources, finishLoading } = createMap(false);
    map.on('error', () => {});
    add(map, 'line', 'route');
    finishLoading(false, 'error');
    assert.equal(sources.size, 1, 'A settled tile error must not strand a feature waiting for data.');
    break;
  }
  case 'removed-during-dispatch': {
    const { map } = createMap();
    const called = [];
    const old = add(map, 'line', 'route');
    map.on('click', () => {
      old.remove();
      add(map, 'polygon', 'route');
    });
    old.on('click', () => called.push('removed'));
    click(map);
    assert.deepEqual(called, [], 'A copied callback must not invoke a removed feature.');
    assert.equal(map.getFeatures()[0].geometry.type, 'Polygon');
    break;
  }
  case 'removed-cursor-during-dispatch': {
    const { map } = createMap();
    const move = enableMouseEvents(map);
    const old = add(map, 'line', 'route');
    map.on('mousemove', () => {
      old.remove();
      add(map, 'polygon', 'route');
      map.getCanvas().style.cursor = 'crosshair';
    });
    old.on('click', () => {});
    move();
    assert.equal(
      map.getCanvas().style.cursor,
      'crosshair',
      'A removed cursor callback must not affect its replacement.',
    );
    break;
  }
  case 'removed-hovered-cursor': {
    const { map } = createMap();
    const move = enableMouseEvents(map);
    const feature = add(map, 'line', 'route');
    feature.on('click', () => {});
    move();
    assert.equal(map.getCanvas().style.cursor, 'pointer');
    feature.remove();
    move();
    assert.equal(map.getCanvas().style.cursor, '', 'Removing the hovered feature must release its pointer cursor.');
    break;
  }
  case 'overlapping-cursor-owners': {
    const { map } = createMap();
    const move = enableMouseEvents(map);
    map.getCanvas().style.cursor = 'grab';
    const first = add(map, 'line', 'route');
    const second = add(map, 'polygon', 'zone');
    first.on('click', () => {});
    second.on('click', () => {});
    move();
    first.remove();
    assert.equal(map.getCanvas().style.cursor, 'pointer', 'A surviving hovered feature still owns the pointer.');
    second.remove();
    assert.equal(map.getCanvas().style.cursor, 'grab', 'The last owner must restore the prior cursor.');
    break;
  }
  case 'external-cursor-change': {
    const { map } = createMap();
    const move = enableMouseEvents(map);
    const feature = add(map, 'line', 'route');
    feature.on('click', () => {});
    move();
    map.getCanvas().style.cursor = 'crosshair';
    feature.remove();
    assert.equal(map.getCanvas().style.cursor, 'crosshair', 'Removal must preserve a direct cursor change.');
    break;
  }
  case 'preserved-features': {
    const { map, sources, layers } = createMap();
    const removed = add(map, 'line', 'route');
    const kept = add(map, 'polygon', 'zone');
    const called = [];
    map.on('click', () => called.push('map'));
    kept.on('click', () => called.push('zone'));
    removed.remove();
    assert.deepEqual(map.getFeatures(), [kept]);
    assert.equal(sources.size, 1);
    assert.equal(layers.size, 2);
    click(map);
    assert.deepEqual(
      called.sort((a, b) => a.localeCompare(b)),
      ['map', 'zone'],
    );
    map.clearFeatures();
    assert.equal(sources.size, 0);
    assert.equal(layers.size, 0);
    break;
  }
  default:
    throw new Error(`Unknown scenario: ${scenario}`);
}

console.log(JSON.stringify({ scenario, status: 'passed', maplibre: require('maplibre-gl/package.json').version }));
