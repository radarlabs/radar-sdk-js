import * as _ from './_';

import Logger from '../logger';

import { RadarMapOptions } from '../types';

// NOTE(jasonl): ENSURE THIS STAYS IN SYNC WITH THE SERVER IMPLEMENTATION
const RADAR_LANGUAGE_EXPR = ['get', 'radar:name_client_language'];

/** get an array of languages set in the browser in RFC 5646 format */
const getBrowserLanguages = (options = { fallback: 'en', format: 'RFC-5646' }) => {
  let languagesRFC5646 = [options.fallback];
  if (navigator.languages.length > 0) {
    languagesRFC5646 = [...navigator.languages];
  } else if (navigator.language) {
    languagesRFC5646 = [navigator.language];
  }

  if (options.format === 'ISO-639-1') {
    // RFC 5646 format is always prefixed by the ISO 639-1 language code so we need to strip that out
    const languagesISO6391 = _.uniq(languagesRFC5646.map(l => l.split('-')[0]));
    return languagesISO6391;
  }

  return languagesRFC5646;
};

const replaceAllValuesInExpression = (expr: any, target: any[], value: any[]): any => {
  if (target.length !== value.length) {
    Logger.warn('replaceAllValueInExpression: Target and value arrays must be the same length');
    return expr;
  }

  const findIndex = target.findIndex((t) => _.deepEqual(t, expr));
  if (findIndex !== -1) {
    return value[findIndex];
  }

  if (Array.isArray(expr)) {
    return expr.map((e) => replaceAllValuesInExpression(e, target, value));
  }

  return expr;
};

export const transformMapStyle = (styleJSON: any, options: Pick<RadarMapOptions, 'languages' | 'navigatorFallbackLanguage'>): any => {
  let languages: string[] = [];

  // use browser language if style language is set to local
  if (styleJSON?.metadata?.['radar:language'] === 'local') {
    const fallbackLanguage = options.navigatorFallbackLanguage || 'en';
    languages = getBrowserLanguages({ fallback: fallbackLanguage, format: 'ISO-639-1' });
  }

  // client set language takes precedence
  if (options.languages) {
    languages = options.languages;
  }

  if (languages.length > 0) {
    // construct expression ordered by language preference
    const localLanguageExpression: any[] = ['coalesce'];
    languages.forEach((l: any) => {
      localLanguageExpression.push(['get', `name_${l}`], ['get', `name:${l}`]);
    });

    const transformedLayers = styleJSON.layers.map((layer: any) => {
      if (layer.type === 'symbol' && layer.layout['text-field']) {
        layer.layout['text-field'] = replaceAllValuesInExpression(
          layer.layout['text-field'],
          [RADAR_LANGUAGE_EXPR],
          [localLanguageExpression]
        );

        return layer;
      }

      return layer;
    });

    return { ...styleJSON, layers: transformedLayers };
  }

  return styleJSON;
};