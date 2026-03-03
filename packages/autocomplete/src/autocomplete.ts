import { RadarAutocompleteContainerNotFound } from './errors';

import type { RadarAutocompleteUIOptions, RadarAutocompleteConfig } from './types';
import type { RadarAutocompleteAddress, RadarAutocompleteParams, Location, RadarPluginContext } from 'radar-sdk-js';

const CLASSNAMES = {
  WRAPPER: 'radar-autocomplete-wrapper',
  INPUT: 'radar-autocomplete-input',
  SEARCH_ICON: 'radar-autocomplete-search-icon',
  RESULTS_LIST: 'radar-autocomplete-results-list',
  RESULTS_ITEM: 'radar-autocomplete-results-item',
  RESULTS_MARKER: 'radar-autocomplete-results-marker',
  SELECTED_ITEM: 'radar-autocomplete-results-item-selected',
  POWERED_BY_RADAR: 'radar-powered',
  POWERED_BY_RADAR_LOGO: 'radar-powered-logo',
  NO_RESULTS: 'radar-no-results',
  SR_ONLY: 'radar-autocomplete-sr-only',
} as const;

/** `id`s for different elements */
const IDENTIFIERS = {
  INSTRUCTIONS: 'instructions',
  RESULTS_LIST: 'results-list',
  RESULTS_ITEM: 'results-item',
} as const;

const defaultAutocompleteOptions: RadarAutocompleteUIOptions = {
  container: 'autocomplete',
  debounceMS: 200, // Debounce time in milliseconds
  minCharacters: 3, // Minimum number of characters to trigger autocomplete
  limit: 8, // Maximum number of autocomplete results
  placeholder: 'Search address', // Placeholder text for the input field
  responsive: true,
  disabled: false,
  showMarkers: true,
  hideResultsOnBlur: true,
  idPrefix: 'radar-autocomplete',

  // accessibility options
  ariaLabel: 'Search for an address', // Custom aria-label for input
  instructionsText: 'When results appear, use up and down arrow keys to navigate and Enter to select', // Instructions for screen readers
  announceResults: true, // Announce results count to screen readers
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

  // if not responsive, set fixed width and unset maxWidth
  input.style.width = formatCSSValue(options.width || DEFAULT_WIDTH);
  input.style.removeProperty('max-width');
};

const setHeight = (resultsList: HTMLElement, options: RadarAutocompleteUIOptions) => {
  if (options.maxHeight) {
    resultsList.style.maxHeight = formatCSSValue(options.maxHeight);
    resultsList.style.overflowY = 'auto'; /* allow overflow when maxHeight is applied */
  }
};

const getMarkerIcon = (color: string = '#ACBDC8') => {
  const fill = color.replace('#', '%23');
  const svg =
    `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Location marker">
    <path d="M12.5704 6.57036C12.5704 4.11632 10.6342 2.11257 8.21016 2C8.14262 2 8.06757 2 8.00003 2C7.93249 2 7.85744 2 7.7899 2C5.35838 2.11257 3.42967 4.11632 3.42967 6.57036C3.42967 6.60037 3.42967 6.6379 3.42967 6.66792C3.42967 6.69794 3.42967 6.73546 3.42967 6.76548C3.42967 9.46717 7.09196 13.3621 7.4672 13.7598C7.61729 13.9174 7.84994 14 8.00003 14C8.15012 14 8.38277 13.9174 8.53286 13.7598C8.9156 13.3621 12.5704 9.46717 12.5704 6.76548C12.5704 6.72795 12.5704 6.69794 12.5704 6.66792C12.5704 6.6379 12.5704 6.60037 12.5704 6.57036ZM7.99252 8.28893C7.04693 8.28893 6.27395 7.52345 6.27395 6.57036C6.27395 5.61726 7.03943 4.85178 7.99252 4.85178C8.94562 4.85178 9.7111 5.61726 9.7111 6.57036C9.7111 7.52345 8.94562 8.28893 7.99252 8.28893Z" fill="${fill}"/>
  </svg>`.trim();
  return `data:image/svg+xml;charset=utf-8,${svg}`;
};

/** address autocomplete UI widget with keyboard navigation and result display */
class AutocompleteUI {
  private ctx: RadarPluginContext;
  config: RadarAutocompleteConfig;
  isOpen: boolean;
  results: RadarAutocompleteAddress[];
  highlightedIndex: number;
  debouncedFetchResults: (query: string) => Promise<RadarAutocompleteAddress[] | null>;
  near?: string;
  private _blurClose: (event: FocusEvent) => void;
  private _debouncePromise: Promise<RadarAutocompleteAddress[] | null> | null = null;

  // DOM elements
  container: HTMLElement;
  inputField: HTMLInputElement;
  resultsList: HTMLElement;
  wrapper: HTMLElement;
  poweredByLink?: HTMLElement;
  srAnnouncements: HTMLElement;

  constructor(options: Partial<RadarAutocompleteUIOptions>, ctx: RadarPluginContext) {
    this.ctx = ctx;
    const { Logger } = this.ctx;
    this.config = Object.assign({}, defaultAutocompleteOptions, options) as RadarAutocompleteConfig;

    // setup state
    this.isOpen = false;
    this._blurClose = (event: FocusEvent) => {
      // Hide on blur only if focus is no longer on input field or "powered by radar" link
      // This prevents the dropdown from closing right away after tabbing from the input to the
      // powered-by link when config.hideResultsOnBlur is true
      if (event.relatedTarget !== this.inputField && event.relatedTarget !== this.poweredByLink) {
        this.close(event);
      }
    };
    this.debouncedFetchResults = this.debounce((query: string): Promise<RadarAutocompleteAddress[] | null> => {
      if (query.length < this.config.minCharacters) {
        // Null indicates that no results were fetched, semantically different from an empty array which indicates that no results were found
        return Promise.resolve(null);
      }

      return this.fetchResults(query);
    }, this.config.debounceMS);
    this.results = [];
    this.highlightedIndex = -1;

    // set threshold alias
    if (this.config.threshold !== undefined) {
      this.config.minCharacters = this.config.threshold;
      Logger.warn('AutocompleteUI option "threshold" is deprecated, use "minCharacters" instead.');
    }

    if (options.near) {
      if (typeof options.near === 'string') {
        this.near = options.near;
      } else {
        this.near = `${options.near.latitude},${options.near.longitude}`;
      }
    }

    // get container element
    let containerEL;
    if (typeof this.config.container === 'string') {
      // lookup container element by ID
      containerEL = document.getElementById(this.config.container);
    } else {
      // use provided element
      containerEL = this.config.container; // HTMLElement
    }
    if (!containerEL) {
      throw new RadarAutocompleteContainerNotFound(
        `Could not find container element: ${this.config.container as string}`,
      );
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
    this.resultsList.setAttribute('id', `${this.config.idPrefix}-${IDENTIFIERS.RESULTS_LIST}`);
    this.resultsList.setAttribute('role', 'listbox');
    this.resultsList.setAttribute('aria-label', 'Search results');
    this.resultsList.setAttribute('hidden', '');
    this.resultsList.setAttribute('aria-hidden', 'true');
    setHeight(this.resultsList, this.config);

    if (containerEL.nodeName === 'INPUT') {
      // if an <input> element is provided, use that as the inputField,
      // and append the resultList to it's parent container
      this.inputField = containerEL as HTMLInputElement;

      // append to dom
      this.wrapper.appendChild(this.resultsList);
      containerEL.parentNode?.appendChild(this.wrapper);
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

    // disable browser autofill
    this.inputField.setAttribute('autocomplete', 'off');

    // set aria roles
    this.inputField.setAttribute('role', 'combobox');
    this.inputField.setAttribute('aria-controls', `${this.config.idPrefix}-${IDENTIFIERS.RESULTS_LIST}`);
    this.inputField.setAttribute('aria-expanded', 'false');
    this.inputField.setAttribute('aria-haspopup', 'listbox');
    this.inputField.setAttribute('aria-autocomplete', 'list');
    this.inputField.setAttribute('aria-activedescendant', '');
    if (this.config.ariaLabel) {
      this.inputField.setAttribute('aria-label', this.config.ariaLabel);
    }

    if (this.config.instructionsText) {
      this.inputField.setAttribute('aria-describedby', `${this.config.idPrefix}-${IDENTIFIERS.INSTRUCTIONS}`);

      // screen reader instructions
      const srInstructions = document.createElement('div');
      srInstructions.id = `${this.config.idPrefix}-${IDENTIFIERS.INSTRUCTIONS}`;
      srInstructions.className = CLASSNAMES.SR_ONLY; // screen reader only class
      srInstructions.textContent = this.config.instructionsText;
      this.wrapper.appendChild(srInstructions);
    }

    this.srAnnouncements = document.createElement('div');
    this.srAnnouncements.setAttribute('aria-live', 'polite');
    this.srAnnouncements.setAttribute('role', 'status');
    this.srAnnouncements.className = CLASSNAMES.SR_ONLY;
    this.wrapper.appendChild(this.srAnnouncements);

    // setup event listeners
    this.inputField.addEventListener('input', this.handleInput.bind(this));
    this.inputField.addEventListener('keydown', this.handleKeyboardNavigation.bind(this));
    if (this.config.hideResultsOnBlur) {
      this.inputField.addEventListener('blur', this._blurClose, true);
    }
    this.inputField.addEventListener('focus', this.open.bind(this), true);

    Logger.debug('AutocompleteUI initialized with options', this.config);
  }

  /** handle input field changes and trigger debounced search */
  public handleInput() {
    const { Logger } = this.ctx;

    // Fetch autocomplete results and display them
    const query = this.inputField.value;

    // Debounced calls return the same Promise
    const debouncePromise = this.debouncedFetchResults(query);

    // Only attach handlers once
    if (this._debouncePromise !== debouncePromise) {
      this._debouncePromise = debouncePromise;
      this._debouncePromise
        .then((results) => {
          const onResults = this.config.onResults;
          // Do not report results if results were not fetched (happens when query size is smaller than config.minCharacters)
          // mainly kept for backwards-compatibility as previous implementations also did not report results when query size is smaller than config.minCharacters
          if (onResults && results !== null) {
            onResults(results);
          }
          if (results === null) {
            this.clearResultsList();
            this.close();
          } else {
            this.displayResults(results);
          }
        })
        .catch((error: Error) => {
          Logger.warn(`Autocomplete ui error: ${error.message}`);
          const onError = this.config.onError;
          if (onError) {
            onError(error);
          }
        });
    }
  }

  public debounce<TArgs extends unknown[], TReturn>(
    fn: (...args: TArgs) => Promise<TReturn>,
    delay: number,
  ): (...args: TArgs) => Promise<TReturn> {
    let timeoutId: ReturnType<typeof setTimeout>;
    let resolveFn: ((value: TReturn) => void) | null = null;
    let rejectFn: ((reason: unknown) => void) | null = null;
    let promise = new Promise<TReturn>((resolve, reject) => {
      resolveFn = resolve;
      rejectFn = reject;
    });

    return (...args: TArgs) => {
      clearTimeout(timeoutId);

      timeoutId = setTimeout(() => {
        // We're going to run the debounced function now, so if in the meantime the returned closure is called again,
        // we want it to wait on a new Promise rather than the current one which we are going to resolve
        const savedResolve = resolveFn;
        const savedReject = rejectFn;
        promise = new Promise<TReturn>((resolve, reject) => {
          resolveFn = resolve;
          rejectFn = reject;
        });

        fn(...args)
          .then((value) => {
            savedResolve?.(value);
          })
          .catch((error) => {
            savedReject?.(error);
          });
      }, delay);

      return promise;
    };
  }

  /**
   * fetch autocomplete results from the Radar API
   * @param query - the search query string
   * @returns matching addresses
   */
  public async fetchResults(query: string) {
    const { apis } = this.ctx;
    const { limit, layers, countryCode, expandUnits, mailable, lang, postalCode, onRequest } = this.config;

    const params: RadarAutocompleteParams = {
      query,
      limit,
      layers,
      countryCode,
      expandUnits,
      mailable,
      lang,
      postalCode,
    };

    if (this.near) {
      params.near = this.near;
    }

    if (onRequest) {
      onRequest(params);
    }

    const { addresses } = await apis.Search.autocomplete(params, 'autocomplete-ui');
    return addresses;
  }

  /**
   * render autocomplete results in the dropdown
   * @param results - array of address results to display
   */
  public displayResults(results: RadarAutocompleteAddress[]) {
    // Clear the previous results
    this.clearResultsList();
    this.results = results;

    // create status announcement for screen readers
    if (this.config.announceResults) {
      this.srAnnouncements.textContent = '';
      // Make screenreader re-read announcement if # of results is the same
      setTimeout(() => {
        if (results.length > 0) {
          this.srAnnouncements.textContent = `${results.length} result${results.length === 1 ? '' : 's'} available. Use arrow keys to navigate.`;
        } else {
          this.srAnnouncements.textContent = 'No results found.';
        }
      }, 250);
    }

    let marker: HTMLElement;
    if (this.config.showMarkers) {
      marker = document.createElement('img');
      marker.classList.add(CLASSNAMES.RESULTS_MARKER);
      marker.setAttribute('src', getMarkerIcon(this.config.markerColor));
      marker.setAttribute('aria-hidden', 'true'); // hide from screen readers when decorative
    }

    // Create and append list items for each result
    results.forEach((result, index) => {
      const li = document.createElement('li');
      li.classList.add(CLASSNAMES.RESULTS_ITEM);
      li.setAttribute('role', 'option');
      li.setAttribute('id', `${this.config.idPrefix}-${IDENTIFIERS.RESULTS_ITEM}-${index}`);
      li.setAttribute('aria-selected', 'false'); // default state

      // construct result with bolded label
      let listContent;
      if (result.formattedAddress?.includes(result.addressLabel!) && result.layer !== 'postalCode') {
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

    if (results.length === 0) {
      const noResultsText = document.createElement('div');
      noResultsText.classList.add(CLASSNAMES.NO_RESULTS);
      noResultsText.textContent = 'No results';

      this.resultsList.appendChild(noResultsText);
    }

    const link = document.createElement('a');
    link.href = 'https://radar.com?ref=powered_by_radar';
    link.target = '_blank';
    this.poweredByLink = link;
    if (this.config.hideResultsOnBlur) {
      link.addEventListener('blur', this._blurClose, true);
    }

    const poweredByText = document.createElement('span');
    poweredByText.textContent = 'Powered by';
    link.appendChild(poweredByText);

    const radarLogo = document.createElement('span');
    radarLogo.className = CLASSNAMES.POWERED_BY_RADAR_LOGO;
    radarLogo.textContent = 'Radar';
    link.appendChild(radarLogo);

    const poweredByContainer = document.createElement('div');
    poweredByContainer.classList.add(CLASSNAMES.POWERED_BY_RADAR);
    poweredByContainer.appendChild(link);
    this.resultsList.appendChild(poweredByContainer);

    this.open();
  }

  /** open the results dropdown */
  public open() {
    if (this.isOpen || this.resultsList.childNodes.length === 0) {
      return;
    }

    this.inputField.setAttribute('aria-expanded', 'true');
    this.resultsList.removeAttribute('hidden');
    this.resultsList.setAttribute('aria-hidden', 'false');
    this.isOpen = true;
  }

  /** close the results dropdown and clear highlighted state */
  public close(e?: FocusEvent) {
    if (!this.isOpen) {
      return;
    }

    // run this code async to allow link click to propagate before blur
    // (add 100ms delay if closed from link click)
    const linkClick = e && e.relatedTarget === this.poweredByLink;
    setTimeout(
      () => {
        this.inputField.setAttribute('aria-expanded', 'false');
        this.inputField.setAttribute('aria-activedescendant', '');
        this.resultsList.setAttribute('hidden', '');
        this.resultsList.setAttribute('aria-hidden', 'true');
        this.isOpen = false;
      },
      linkClick ? 100 : 0,
    );
  }

  /**
   * highlight a result by index with wrap-around navigation
   * @param index - the result index to highlight
   */
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
      resultItems[this.highlightedIndex]?.classList.remove(CLASSNAMES.SELECTED_ITEM);
      resultItems[this.highlightedIndex]?.setAttribute('aria-selected', 'false');
    }

    // add class name to newly highlighted item
    resultItems[index]?.classList.add(CLASSNAMES.SELECTED_ITEM);
    resultItems[index]?.setAttribute('aria-selected', 'true');

    // set aria active descendant
    this.inputField.setAttribute(
      'aria-activedescendant',
      `${this.config.idPrefix}-${IDENTIFIERS.RESULTS_ITEM}-${index}`,
    );

    // Make sure the selected item is visible (scroll into view if needed)
    resultItems[index]?.scrollIntoView({ block: 'nearest' });

    this.highlightedIndex = index;
  }

  public handleKeyboardNavigation(event: KeyboardEvent) {
    const key = event.key;

    // allow event to propagate if result list is not open
    if (!this.isOpen) {
      return;
    }

    switch (key) {
      // Next item
      case 'ArrowDown':
        event.preventDefault();
        this.goTo(this.highlightedIndex + 1);
        break;

      // Prev item
      case 'ArrowUp':
        event.preventDefault();
        this.goTo(this.highlightedIndex - 1);
        break;

      // Select
      case 'Enter':
        this.select(this.highlightedIndex);
        break;

      // Close
      case 'Escape':
      case 'Esc':
        event.preventDefault();
        this.close();
        this.inputField.focus(); // return focus to input
        break;
    }
  }

  /**
   * select a result by index and populate the input field
   * @param index - the result index to select
   */
  public select(index: number) {
    const { Logger } = this.ctx;
    const result = this.results[index];
    if (!result) {
      Logger.warn(`No autocomplete result found at index: ${index}`);
      return;
    }

    let inputValue;
    if (result.formattedAddress?.includes(result.addressLabel!)) {
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

    // Return focus to input after selection
    this.inputField.focus();

    // clear results list
    this.close();
  }

  /** clear the results list DOM and reset results array */
  public clearResultsList() {
    this.resultsList.innerHTML = '';
    this.results = [];
  }

  /** remove the autocomplete widget from the DOM */
  public remove() {
    const { Logger } = this.ctx;
    Logger.debug('AutocompleteUI removed.');
    this.inputField.remove();
    this.resultsList.remove();
    this.wrapper.remove();
  }

  /**
   * set the `near` location bias for autocomplete requests
   * @param near - location string, Location object, or null to clear
   * @returns this instance for chaining
   */
  public setNear(near: string | Location | undefined | null) {
    if (near === undefined || near === null) {
      this.near = undefined;
    } else if (typeof near === 'string') {
      this.near = near;
    } else {
      this.near = `${near.latitude},${near.longitude}`;
    }
    return this;
  }

  /**
   * set the input placeholder text
   * @param placeholder - new placeholder string
   * @returns this instance for chaining
   */
  public setPlaceholder(placeholder: string) {
    this.config.placeholder = placeholder;
    this.inputField.placeholder = placeholder;
    return this;
  }

  /**
   * set the disabled state of the input
   * @param disabled - whether to disable the input
   * @returns this instance for chaining
   */
  public setDisabled(disabled: boolean) {
    this.config.disabled = disabled;
    this.inputField.disabled = disabled;
    return this;
  }

  /**
   * toggle responsive width mode
   * @param responsive - whether to use responsive layout
   * @returns this instance for chaining
   */
  public setResponsive(responsive: boolean) {
    this.config.responsive = responsive;
    setWidth(this.wrapper, this.config);
    return this;
  }

  /**
   * set the widget width
   * @param width - width in px, CSS string, or null to reset
   * @returns this instance for chaining
   */
  public setWidth(width: number | string | null) {
    if (width === null) {
      this.config.width = undefined;
    } else if (typeof width === 'string' || typeof width === 'number') {
      this.config.width = width;
    }
    setWidth(this.wrapper, this.config);
    return this;
  }

  /**
   * set the max height of the results dropdown
   * @param height - height in px, CSS string, or null to reset
   * @returns this instance for chaining
   */
  public setMaxHeight(height: number | string | null) {
    if (height === null) {
      this.config.maxHeight = undefined;
    } else if (typeof height === 'string' || typeof height === 'number') {
      this.config.maxHeight = height;
    }
    setHeight(this.resultsList, this.config);
    return this;
  }

  /**
   * set the minimum character count to trigger autocomplete
   * @param minCharacters - character threshold
   * @returns this instance for chaining
   */
  public setMinCharacters(minCharacters: number) {
    this.config.minCharacters = minCharacters;
    this.config.threshold = minCharacters;
    return this;
  }

  /**
   * set the maximum number of results
   * @param limit - result count limit
   * @returns this instance for chaining
   */
  public setLimit(limit: number) {
    this.config.limit = limit;
    return this;
  }

  /**
   * set the language for autocomplete results
   * @param lang - language code or null to clear
   * @returns this instance for chaining
   */
  public setLang(lang: string | null) {
    if (lang === null) {
      this.config.lang = undefined;
    } else if (typeof lang === 'string') {
      this.config.lang = lang;
    }
    return this;
  }

  /**
   * set a postal code bias for autocomplete requests
   * @param postalCode - postal code string or null to clear
   * @returns this instance for chaining
   */
  public setPostalCode(postalCode: string | null) {
    if (postalCode === null) {
      this.config.postalCode = undefined;
    } else if (typeof postalCode === 'string') {
      this.config.postalCode = postalCode;
    }
    return this;
  }

  /**
   * toggle marker icons in result items
   * @param showMarkers - whether to show markers
   * @returns this instance for chaining
   */
  public setShowMarkers(showMarkers: boolean) {
    this.config.showMarkers = showMarkers;
    if (showMarkers) {
      const marker = document.createElement('img');
      marker.classList.add(CLASSNAMES.RESULTS_MARKER);
      marker.setAttribute('src', getMarkerIcon(this.config.markerColor));
      const resultItems = this.resultsList.getElementsByTagName('li');
      for (let i = 0; i < resultItems.length; i++) {
        const currentMarker = resultItems[i]?.getElementsByClassName(CLASSNAMES.RESULTS_MARKER)[0];
        if (!currentMarker) {
          resultItems[i]?.prepend(marker.cloneNode());
        }
      }
    } else {
      const resultItems = this.resultsList.getElementsByTagName('li');
      for (let i = 0; i < resultItems.length; i++) {
        const marker = resultItems[i]?.getElementsByClassName(CLASSNAMES.RESULTS_MARKER)[0];
        if (marker) {
          marker.remove();
        }
      }
    }
    return this;
  }

  /**
   * set the color of marker icons in result items
   * @param color - CSS color string
   * @returns this instance for chaining
   */
  public setMarkerColor(color: string) {
    this.config.markerColor = color;
    const marker = this.resultsList.getElementsByClassName(CLASSNAMES.RESULTS_MARKER);
    for (let i = 0; i < marker.length; i++) {
      marker[i]?.setAttribute('src', getMarkerIcon(color));
    }
    return this;
  }

  /**
   * toggle hiding results when input loses focus
   * @param hideResultsOnBlur - whether to hide on blur
   * @returns this instance for chaining
   */
  public setHideResultsOnBlur(hideResultsOnBlur: boolean) {
    this.config.hideResultsOnBlur = hideResultsOnBlur;
    if (hideResultsOnBlur) {
      this.inputField.addEventListener('blur', this._blurClose, true);
      this.poweredByLink?.addEventListener('blur', this._blurClose, true);
    } else {
      this.inputField.removeEventListener('blur', this._blurClose, true);
      this.poweredByLink?.removeEventListener('blur', this._blurClose, true);
    }
    return this;
  }
}

export default AutocompleteUI;
