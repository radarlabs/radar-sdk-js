import Logger from '../logger';
import SearchAPI from '../api/search';

import { RadarAutocompleteContainerNotFound } from '../errors';
import type { RadarAutocompleteUIOptions, RadarAutocompleteConfig, RadarAutocompleteParams, Location } from '../types';

const CLASSNAMES = {
  WRAPPER: 'radar-autocomplete-wrapper',
  INPUT: 'radar-autocomplete-input',
  SEARCH_ICON: 'radar-autocomplete-search-icon',
  RESULTS_LIST: 'radar-autocomplete-results-list',
  RESULTS_ITEM: 'radar-autocomplete-results-item',
  RESULTS_MARKER: 'radar-autocomplete-results-marker',
  SELECTED_ITEM: 'radar-autocomplete-results-item-selected',
  POWERED_BY_RADAR: 'radar-powered',
  NO_RESULTS: 'radar-no-results',
};

const ARIA = {
  EXPANDED: 'aria-expanded',
};

const defaultAutocompleteOptions: RadarAutocompleteUIOptions = {
  container: 'autocomplete',
  debounceMS: 200, // Debounce time in milliseconds
  threshold: 3, // Minimum number of characters to trigger autocomplete
  limit: 8, // Maximum number of autocomplete results
  placeholder: 'Search address', // Placeholder text for the input field
  responsive: true,
  disabled: false,
  showMarkers: true,
  hideResultsOnBlur: true,
};

// determine whether to use px or CSS string
const formatCSSValue = (value: string | number) => {
  if (typeof value === 'number') {
    return `${value}px`;
  }
  return value;
};

const DEFAULT_WIDTH = 400;
const setWidth = (input: HTMLElement, options: RadarAutocompleteUIOptions) => {
  // if responsive and width is provided, treat it as maxWidth
  if (options.responsive) {
    input.style.width = '100%';
    if (options.width) {
      input.style.maxWidth = formatCSSValue(options.width);
    }
    return;
  }

  // if not responsive, set fixed width
  input.style.width = formatCSSValue(options.width || DEFAULT_WIDTH);
};

const setHeight = (resultsList: HTMLElement, options: RadarAutocompleteUIOptions) => {
  if (options.maxHeight) {
    resultsList.style.maxHeight = formatCSSValue(options.maxHeight);
    resultsList.style.overflowY = 'auto'; /* allow overflow when maxHeight is applied */
  }
};

const getMarkerIcon = (color: string = "#ACBDC8") => {
  const fill = color.replace('#', '%23');
  const svg = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.5704 6.57036C12.5704 4.11632 10.6342 2.11257 8.21016 2C8.14262 2 8.06757 2 8.00003 2C7.93249 2 7.85744 2 7.7899 2C5.35838 2.11257 3.42967 4.11632 3.42967 6.57036C3.42967 6.60037 3.42967 6.6379 3.42967 6.66792C3.42967 6.69794 3.42967 6.73546 3.42967 6.76548C3.42967 9.46717 7.09196 13.3621 7.4672 13.7598C7.61729 13.9174 7.84994 14 8.00003 14C8.15012 14 8.38277 13.9174 8.53286 13.7598C8.9156 13.3621 12.5704 9.46717 12.5704 6.76548C12.5704 6.72795 12.5704 6.69794 12.5704 6.66792C12.5704 6.6379 12.5704 6.60037 12.5704 6.57036ZM7.99252 8.28893C7.04693 8.28893 6.27395 7.52345 6.27395 6.57036C6.27395 5.61726 7.03943 4.85178 7.99252 4.85178C8.94562 4.85178 9.7111 5.61726 9.7111 6.57036C9.7111 7.52345 8.94562 8.28893 7.99252 8.28893Z" fill="${fill}"/>
  </svg>`.trim();
  return `data:image/svg+xml;charset=utf-8,${svg}`;
};


class AutocompleteUI {
  config: RadarAutocompleteConfig;
  isOpen: boolean;
  results: any[];
  highlightedIndex: number;
  debouncedFetchResults: (...args: any[]) => Promise<any>;
  near?: string;

  // DOM elements
  container: HTMLElement;
  inputField: HTMLInputElement;
  resultsList: HTMLElement;
  wrapper: HTMLElement;
  poweredByLink?: HTMLElement;

  // create a new AutocompleteUI instance
  public static createAutocomplete(autocompleteOptions: RadarAutocompleteUIOptions): AutocompleteUI {
    return new AutocompleteUI(autocompleteOptions);
  }

  constructor(options: Partial<RadarAutocompleteUIOptions> = {}) {
    this.config = Object.assign({}, defaultAutocompleteOptions, options) as RadarAutocompleteConfig;

    // setup state
    this.isOpen = false;
    this.debouncedFetchResults = this.debounce(this.fetchResults, this.config.debounceMS);
    this.results = [];
    this.highlightedIndex = -1;

    if (options.near) {
      if (typeof options.near === 'string') {
        this.near = options.near;
      } else {
        this.near = `${options.near.latitude},${options.near.longitude}`;
      }
    }

    // get container element
    let containerEL;
    if (typeof this.config.container === 'string') { // lookup container element by ID
      containerEL = document.getElementById(this.config.container);
    } else { // use provided element
      containerEL = this.config.container; // HTMLElement
    }
    if (!containerEL) {
      throw new RadarAutocompleteContainerNotFound(`Could not find container element: ${this.config.container}`);
    }
    this.container = containerEL;

    // create wrapper for input and result list
    this.wrapper = document.createElement('div');
    this.wrapper.classList.add(CLASSNAMES.WRAPPER);
    this.wrapper.style.display = this.config.responsive ? 'block' : 'inline-block';
    setWidth(this.wrapper, this.config);

    // result list element
    this.resultsList = document.createElement('ul');
    this.resultsList.classList.add(CLASSNAMES.RESULTS_LIST);
    setHeight(this.resultsList, this.config);

    if (containerEL.nodeName === 'INPUT') {
      // if an <input> element is provided, use that as the inputField,
      // and append the resultList to it's parent container
      this.inputField = containerEL as HTMLInputElement;

      // append to dom
      this.wrapper.appendChild(this.resultsList);
      (containerEL.parentNode as any).appendChild(this.wrapper);

    } else {
      // if container is not an input, create new input and append to container

      // create new input
      this.inputField = document.createElement('input');
      this.inputField.classList.add(CLASSNAMES.INPUT);
      this.inputField.placeholder = this.config.placeholder;
      this.inputField.type = 'text';
      this.inputField.disabled = this.config.disabled;

      // search icon
      const searchIcon = document.createElement('div');
      searchIcon.classList.add(CLASSNAMES.SEARCH_ICON);

      // append to DOM
      this.wrapper.appendChild(this.inputField);
      this.wrapper.appendChild(this.resultsList);
      this.wrapper.appendChild(searchIcon);
      this.container.appendChild(this.wrapper);
    }

    // setup event listeners
    this.inputField.addEventListener('input', this.handleInput.bind(this));
    this.inputField.addEventListener('keydown', this.handleKeyboardNavigation.bind(this));
    if (this.config.hideResultsOnBlur){
      this.inputField.addEventListener('blur', this.close.bind(this), true);
    }

    Logger.debug(`AutocompleteUI iniailized with options: ${JSON.stringify(this.config)}`);
  }

  public handleInput() {
    // Fetch autocomplete results and display them
    const query = this.inputField.value;
    if (query.length < this.config.threshold) {
      return;
    }

    this.debouncedFetchResults(query)
      .then((results: any[]) => {
        const onResults = this.config.onResults;
        if (onResults) {
          onResults(results);
        }
        this.displayResults(results);
      })
      .catch((error) => {
        Logger.warn(`Autocomplete ui error: ${error.message}`);
        const onError = this.config.onError;
        if (onError) {
          onError(error);
        }
      });
  }

  public debounce(fn: Function, delay: number) {
    let timeoutId: any;
    let resolveFn: any;
    let rejectFn: any;

    return (...args: any[]) => {
      clearTimeout(timeoutId);

      timeoutId = setTimeout(() => {
        const result = fn.apply(this, args);

        if (result instanceof Promise) {
          result
            .then((value) => {
              if (resolveFn) {
                resolveFn(value);
              }
            })
            .catch((error) => {
              if (rejectFn) {
                rejectFn(error);
              }
            });
        }
      }, delay);

      return new Promise((resolve, reject) => {
        resolveFn = resolve;
        rejectFn = reject;
      });
    };
  }

  public async fetchResults(query: string) {
    const { limit, layers, countryCode, expandUnits, onRequest } = this.config;

    const params: RadarAutocompleteParams = {
      query,
      limit,
      layers,
      countryCode,
      expandUnits,
    }

    if (this.near) {
      params.near = this.near;
    }

    if (onRequest) {
      onRequest(params);
    }

    const { addresses } = await SearchAPI.autocomplete(params);
    return addresses;
  }

  public displayResults(results: any[]) {
    // Clear the previous results
    this.clearResultsList();
    this.results = results;

    let marker: HTMLElement;
    if (this.config.showMarkers) {
      marker = document.createElement('img');
      marker.classList.add(CLASSNAMES.RESULTS_MARKER);
      marker.setAttribute('src', getMarkerIcon(this.config.markerColor));
    }

    // Create and append list items for each result
    results.forEach((result, index) => {
      const li = document.createElement('li');
      li.classList.add(CLASSNAMES.RESULTS_ITEM);

      // construct result with bolded label
      let listContent;
      if (result.formattedAddress.includes(result.addressLabel) && result.layer !== 'postalCode') {
        // if addressLabel is contained in the formatted address, bold the address label
        const regex = new RegExp(`(${result.addressLabel}),?`);
        listContent = result.formattedAddress.replace(regex, '<b>$1</b>');
      } else {
        // otherwise append the address or place label to formatted address
        const label = result.placeLabel || result.addressLabel;
        listContent = `<b>${label}</b> ${result.formattedAddress}`;
      }
      li.innerHTML = listContent;

      // prepend marker if enabled
      if (marker) {
        li.prepend(marker.cloneNode());
      }

      // add click handler to each result, use mousedown to fire before blur event
      li.addEventListener('mousedown', () => {
        this.select(index);
      });

      this.resultsList.appendChild(li);
    });

    this.open();

    if (results.length > 0) {
      const link = document.createElement('a');
      link.href = 'https://radar.com?ref=powered_by_radar';
      link.target = '_blank';
      this.poweredByLink = link;

      const poweredByText = document.createElement('span');
      poweredByText.textContent = 'Powered by';
      link.appendChild(poweredByText);

      const radarLogo = document.createElement('span');
      radarLogo.id = 'radar-powered-logo';
      link.appendChild(radarLogo);

      const poweredByContainer = document.createElement('div');
      poweredByContainer.classList.add(CLASSNAMES.POWERED_BY_RADAR);
      poweredByContainer.appendChild(link);
      this.resultsList.appendChild(poweredByContainer);
    } else {
      const noResultsText = document.createElement('div');
      noResultsText.classList.add(CLASSNAMES.NO_RESULTS);
      noResultsText.textContent = 'No results';

      this.resultsList.appendChild(noResultsText);
    }
  }

  public open() {
    if (this.isOpen) {
      return;
    }

    this.wrapper.setAttribute(ARIA.EXPANDED, 'true');
    this.resultsList.removeAttribute('hidden');
    this.isOpen = true;
  }

  public close(e?: FocusEvent) {
    if (!this.isOpen) {
      return;
    }

    // run this code async to allow link click to propagate before blur
    // (add 100ms delay if closed from link click)
    const linkClick = e && (e.relatedTarget === this.poweredByLink);
    setTimeout(() => {
      this.wrapper.removeAttribute(ARIA.EXPANDED);
      this.resultsList.setAttribute('hidden', '');
      this.highlightedIndex = -1;
      this.isOpen = false;
      this.clearResultsList();
    }, linkClick ? 100 : 0);
  }

  public goTo(index: number) {
    if (!this.isOpen || !this.results.length) {
      return;
    }

    // wrap around
    if (index < 0) {
      index = this.results.length - 1;
    } else if (index >= this.results.length) {
      index = 0;
    }

    const resultItems = this.resultsList.getElementsByTagName('li');

    if (this.highlightedIndex > -1) {
      // clear class names on previously highlighted item
      resultItems[this.highlightedIndex].classList.remove(CLASSNAMES.SELECTED_ITEM);
    }

    // add class name to newly highlighted item
    resultItems[index].classList.add(CLASSNAMES.SELECTED_ITEM);

    this.highlightedIndex = index;
  }

  public handleKeyboardNavigation(event: KeyboardEvent) {
    // fallback to deprecated "keyCode" if event.code not set
    const code = event.code !== undefined ? event.code : event.keyCode;

    // allow event to propagate if result list is not open
    if (!this.isOpen) {
      return;
    }

    switch (code) {
      // Next item
      case 'Tab':
      case 'ArrowDown':
      case 40:
        event.preventDefault();
        this.goTo(this.highlightedIndex + 1);
        break;

      // Prev item
      case 'ArrowUp':
      case 38:
        event.preventDefault();
        this.goTo(this.highlightedIndex - 1);
        break;

      // Select
      case 'Enter':
      case 13:
        this.select(this.highlightedIndex);
        break;

      // Close
      case 'Esc':
      case 27:
        this.close();
        break;
    }
  }

  public select(index: number) {
    const result = this.results[index];
    if (!result) {
      Logger.warn(`No autocomplete result found at index: ${index}`);
      return;
    }

    let inputValue;
    if (result.formattedAddress.includes(result.addressLabel)) {
      inputValue = result.formattedAddress;
    } else {
      const label = result.placeLabel || result.addressLabel;
      inputValue = `${label}, ${result.formattedAddress}`;
    }
    this.inputField.value = inputValue;

    const onSelection = this.config.onSelection;
    if (onSelection) {
      onSelection(result);
    }

    // clear results list
    this.close();
  }

  public clearResultsList() {
    this.resultsList.innerHTML = '';
    this.results = [];
  }

  // remove elements from DOM
  public remove() {
    Logger.debug('AutocompleteUI removed.');
    this.inputField.remove();
    this.resultsList.remove();
    this.wrapper.remove();
  }

  public setNear(near: string | Location) {
    if (near) {
      if (typeof near === 'string') {
        this.near = near;
      } else {
        this.near = `${near.latitude},${near.longitude}`;
      }
    }
    return this;
  }

  public setPlaceholder(placeholder: string) {
    this.config.placeholder = placeholder;
    this.inputField.placeholder = placeholder;
    return this;
  }

  public setDisabled(disabled: boolean) {
    this.config.disabled = disabled;
    this.inputField.disabled = disabled;
    return this;
  }

  public setResponsive(responsive: boolean) {
    this.config.responsive = responsive;
    if (responsive) {
      this.wrapper.style.display = 'block';
      this.inputField.style.width = '100%';
      this.inputField.style.maxWidth = formatCSSValue(this.config.width || DEFAULT_WIDTH);
    } else {
      this.wrapper.style.display = 'inline-block';
      this.inputField.style.width = formatCSSValue(this.config.width || DEFAULT_WIDTH);
      this.inputField.style.maxWidth = 'none';
    }
    return this;
  }

  public setWidth(width: number | string) {
    this.config.width = width;
    setWidth(this.wrapper, this.config);
    return this;
  }

  public setMaxHeight(height: number | string) {
    this.config.maxHeight = height;
    setHeight(this.resultsList, this.config);
    return this;
  }

  public setThreshold(threshold: number) {
    this.config.threshold = threshold;
    return this;
  }

  public setLimit(limit: number) {
    this.config.limit = limit;
    return this;
  }

  public setShowMarkers(showMarkers: boolean) {
    this.config.showMarkers = showMarkers;
    if (showMarkers === true) {
      const marker = document.createElement('img');
      marker.classList.add(CLASSNAMES.RESULTS_MARKER);
      marker.setAttribute('src', getMarkerIcon(this.config.markerColor));
      const resultItems = this.resultsList.getElementsByTagName('li');
      for (let i = 0; i < resultItems.length; i++) {
        const currentMarker = resultItems[i].getElementsByClassName(CLASSNAMES.RESULTS_MARKER)[0];
        if (!currentMarker) {
          resultItems[i].prepend(marker.cloneNode());
        }
      }
    } else {
      const resultItems = this.resultsList.getElementsByTagName('li');
      for (let i = 0; i < resultItems.length; i++) {
        const marker = resultItems[i].getElementsByClassName(CLASSNAMES.RESULTS_MARKER)[0];
        if (marker) {
          marker.remove();
        }
      }
    }
    return this;
  }

  public setMarkerColor(color: string) {
    this.config.markerColor = color;
    const marker = this.resultsList.getElementsByClassName(CLASSNAMES.RESULTS_MARKER);
    for (let i = 0; i < marker.length; i++) {
      marker[i].setAttribute('src', getMarkerIcon(color));
    }
    return this;
  }

  public setHideResultsOnBlur(hideResultsOnBlur: boolean) {
    this.config.hideResultsOnBlur = hideResultsOnBlur;
    if (hideResultsOnBlur === true) {
      this.inputField.addEventListener('blur', this.close.bind(this), true);
    } else {
      this.inputField.removeEventListener('blur', this.close.bind(this), true);
    }
    return this;
  }
}

export default AutocompleteUI;
