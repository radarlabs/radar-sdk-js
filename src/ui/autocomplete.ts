import Logger from '../logger';
import SearchAPI from '../api/search';

import { RadarAutocompleteContainerNotFound } from '../errors';
import type { RadarAutocompleteUIOptions, RadarAutocompleteConfig, RadarAutocompleteParams } from '../types';

const CLASSNAMES = {
  WRAPPER: 'radar-autocomplete-wrapper',
  INPUT: 'radar-autocomplete-input',
  RESULTS_LIST: 'radar-autocomplete-results-list',
  RESULTS_ITEM: 'radar-autocomplete-results-item',
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
  disabled: false,
};

const defaultWidth = '400px';
const getWidth = (width?: string | number): string => {
  if (typeof width === 'number') {
    return `${width}px`;
  }
  return width || defaultWidth;
};

class AutocompleteUI {
  config: RadarAutocompleteConfig;
  isOpen: boolean;
  results: any[];
  highlightedIndex: number;
  debouncedFetchResults: (...args: any[]) => Promise<any>;

  // DOM elements
  container: HTMLElement;
  inputField: HTMLInputElement;
  resultsList: HTMLElement;
  wrapper: HTMLElement;


  // create a new AutocompleteUI instance
  public static createAutocomplete(autocompleteOptions: RadarAutocompleteUIOptions): AutocompleteUI {
    return new AutocompleteUI(autocompleteOptions);
  }

  constructor(options: Partial<RadarAutocompleteUIOptions> = {}) {
    this.config = Object.assign({}, defaultAutocompleteOptions, options) as RadarAutocompleteConfig;

    // lookup container element
    if (typeof this.config.container === 'string') {
      const containerEL = document.getElementById(this.config.container);
      if (!containerEL) {
        throw new RadarAutocompleteContainerNotFound(`Could not find element with id ${this.config.container}`);
      }
      this.container = containerEL;
    } else { // use provided element
      this.container = this.config.container; // HTMLElement
    }

    // state
    this.isOpen = false;
    this.debouncedFetchResults = this.debounce(this.fetchResults, this.config.debounceMS);
    this.results = [];
    this.highlightedIndex = -1;

    // input field element
    this.inputField = document.createElement('input');
    this.inputField.classList.add(CLASSNAMES.INPUT);
    this.inputField.placeholder = this.config.placeholder;
    this.inputField.type = 'text';
    this.inputField.disabled = this.config.disabled;
    this.inputField.style.width = getWidth(this.config.width);

    // result list element
    this.resultsList = document.createElement('ul');
    this.resultsList.classList.add(CLASSNAMES.RESULTS_LIST);

    // create wrapper and input field on DOM
    this.wrapper = document.createElement('div');
    this.wrapper.classList.add(CLASSNAMES.WRAPPER);
    this.wrapper.appendChild(this.inputField);
    this.wrapper.appendChild(this.resultsList);

    // event listeners
    this.inputField.addEventListener('input', this.handleInput.bind(this));
    this.inputField.addEventListener('blur', () => this.close(), true);
    this.inputField.addEventListener('keydown', this.handleKeyboardNavigation.bind(this));

    // append to DOM
    this.container.appendChild(this.wrapper);

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
    const { limit, layers } = this.config;

    const params: RadarAutocompleteParams = {
      query,
      limit,
      layers,
    }

    const { addresses } = await SearchAPI.autocomplete(params);
    return addresses;
  }

  public displayResults(results: any[]) {
    // Clear the previous results
    this.clearResultsList();
    this.results = results;

    // Create and append list items for each result
    results.forEach((result, index) => {
      const li = document.createElement('li');
      li.classList.add(CLASSNAMES.RESULTS_ITEM);
      li.textContent = result.formattedAddress;

      // add click handler to each result, use mousedown to fire before blur event
      li.addEventListener('mousedown', () => {
        this.select(index);
      });

      this.resultsList.appendChild(li);
    });

    this.open();

    if (results.length > 0) {
      const poweredByText = document.createElement('span');
      poweredByText.textContent = 'Powered by';

      const radarLogo = document.createElement('img');
      radarLogo.src = `data:image/svg+xml;charset=utf-8,<svg width="60" height="18" viewBox="0 0 60 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17.0007 12.8407H20.0471V9.01782H20.7639L22.9293 12.8407H26.1549L23.6013 8.42048C24.7213 7.98741 25.5277 7.13621 25.5277 5.61301V5.55328C25.5277 3.29835 23.9746 2.16341 21.1821 2.16341H17.0007V12.8407ZM20.0471 7.03168V4.46315H21.0477C22.0333 4.46315 22.5709 4.80661 22.5709 5.67275V5.73248C22.5709 6.59861 22.0631 7.03168 21.0327 7.03168H20.0471Z" fill="%23000257"/><path d="M29.2966 13.0199C30.551 13.0199 31.2379 12.4973 31.6112 11.9298V12.8407H34.2097V7.77835C34.2097 5.70261 32.8358 4.82155 30.6854 4.82155C28.5499 4.82155 27.0715 5.74741 26.952 7.62901H29.4608C29.5206 7.13621 29.7894 6.70315 30.5211 6.70315C31.3723 6.70315 31.5515 7.19595 31.5515 7.94261V8.12181H30.8048C28.2064 8.12181 26.6534 8.83861 26.6534 10.6754C26.6534 12.333 27.8928 13.0199 29.2966 13.0199ZM30.2224 11.213C29.5952 11.213 29.2966 10.9293 29.2966 10.4813C29.2966 9.83915 29.7744 9.63008 30.8496 9.63008H31.5515V10.1079C31.5515 10.7799 30.984 11.213 30.2224 11.213Z" fill="%23000257"/><path d="M38.6318 13.0199C39.8115 13.0199 40.6777 12.3778 41.0659 11.5714V12.8407H43.739V1.59595H41.0659V6.13568C40.6179 5.34421 39.8862 4.82155 38.6616 4.82155C36.8099 4.82155 35.3464 6.24021 35.3464 8.89835V9.01782C35.3464 11.7207 36.8249 13.0199 38.6318 13.0199ZM39.5726 10.9741C38.6467 10.9741 38.0643 10.3021 38.0643 8.98795V8.86848C38.0643 7.50955 38.6019 6.83755 39.6024 6.83755C40.588 6.83755 41.1406 7.53941 41.1406 8.85355V8.97301C41.1406 10.3021 40.5432 10.9741 39.5726 10.9741Z" fill="%23000257"/><path d="M47.5112 13.0199C48.7656 13.0199 49.4525 12.4973 49.8258 11.9298V12.8407H52.4242V7.77835C52.4242 5.70261 51.0504 4.82155 48.9 4.82155C46.7645 4.82155 45.2861 5.74741 45.1666 7.62901H47.6754C47.7352 7.13621 48.004 6.70315 48.7357 6.70315C49.5869 6.70315 49.7661 7.19595 49.7661 7.94261V8.12181H49.0194C46.421 8.12181 44.868 8.83861 44.868 10.6754C44.868 12.333 46.1074 13.0199 47.5112 13.0199ZM48.437 11.213C47.8098 11.213 47.5112 10.9293 47.5112 10.4813C47.5112 9.83915 47.989 9.63008 49.0642 9.63008H49.7661V10.1079C49.7661 10.7799 49.1986 11.213 48.437 11.213Z" fill="%23000257"/><path d="M53.9493 12.8407H56.6224V9.13728C56.6224 7.88288 57.5184 7.37515 59.1461 7.41995V4.92608C57.9365 4.91115 57.1152 5.41888 56.6224 6.58368V5.03061H53.9493V12.8407Z" fill="%23000257"/><path d="M11.4074 14.5L5.7037 0.5L0 14.5L5.7037 12.1148L11.4074 14.5Z" fill="%23000257"/></svg>`;

      const poweredByContainer = document.createElement('div');
      poweredByContainer.classList.add(CLASSNAMES.POWERED_BY_RADAR);
      poweredByContainer.appendChild(poweredByText);
      poweredByContainer.appendChild(radarLogo);

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
    this.resultsList.removeAttribute("hidden");
    this.isOpen = true;
    // emit event
  }

  public close() {
    if (!this.isOpen) {
      return;
    }

    this.wrapper.removeAttribute(ARIA.EXPANDED);
    this.resultsList.setAttribute("hidden", "");
    this.highlightedIndex = -1;
    this.isOpen = false;
    this.clearResultsList();
    // emit event
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

    switch (code) {
      case 40: // Down arrow
        event.preventDefault();
        this.goTo(this.highlightedIndex + 1);
        break;
      case 38: // Up arrow
        event.preventDefault();
        this.goTo(this.highlightedIndex - 1);
        break;
      case 13: // Enter
        this.select(this.highlightedIndex);
        break;
      case 9: // Tab
        this.select(this.highlightedIndex);
        break;
        // Esc
      case 27:
        this.close();
        break;
    }
  }

  public select(index: number) {
    const result = this.results[index];

    this.inputField.value = result.formattedAddress;

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
    this.inputField.remove();
    this.resultsList.remove();
    this.wrapper.remove();
  }
}

export default AutocompleteUI;
