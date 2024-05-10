import * as _ from './_';

import Logger from '../logger';

const RADAR_LOCAL_LANGUAGE_EXPR = ['get', 'radar:name_local'];

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

const replaceAllValueInExpression = (expr: any, target: any[], value: any[]): any => {
  if (target.length !== value.length) {
    Logger.warn('replaceAllValueInExpression: Target and value arrays must be the same length');
    return expr;
  }

  const findIndex = target.findIndex((t) => _.deepEqual(t, expr));
  if (findIndex !== -1) {
    return value[findIndex];
  }

  if (Array.isArray(expr)) {
    return expr.map((e) => replaceAllValueInExpression(e, target, value));
  }

  return expr;
};

export const transformMapStyle = (styleJSON: any, options = { fallbackLanguage: 'en' }): any => {
  if (styleJSON?.metadata?.['radar:language'] === 'local') {
    const browserLanguages = getBrowserLanguages({ fallback: options.fallbackLanguage, format: 'ISO-639-1' });

    // construct expression ordered by language preference
    const localLanguageExpression: any[] = ['coalesce'];
    browserLanguages.forEach((l: any) => {
      localLanguageExpression.push(['get', `name_${l}`], ['get', `name:${l}`]);
    });

    const transformedLayers = styleJSON.layers.map((layer: any) => {
      if (layer.type === 'symbol' && layer.layout['text-field']) {
        layer.layout['text-field'] = replaceAllValueInExpression(
          layer.layout['text-field'],
          [RADAR_LOCAL_LANGUAGE_EXPR],
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