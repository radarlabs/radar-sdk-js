class Storage {

    // KEYS
    static get DESCRIPTION() {
        return 'radar-description';
    }
    static get DEVICE_ID() {
        return 'radar-deviceId';
    }
    static get DEVICE_TYPE() {
        return 'radar-deviceType';
    }
    static get METADATA() {
        return 'radar-metadata';
    }
    static get HOST() {
        return 'radar-host';
    }
    static get PUBLISHABLE_KEY() {
        return 'radar-publishableKey';
    }
    static get USER_ID() {
        return 'radar-userId';
    }
    static get INSTALL_ID() {
        return 'radar-installId';
    }
    static get TRIP_OPTIONS() {
        return 'radar-trip-options';
    }
    static get CUSTOM_HEADERS() {
        return 'radar-custom-headers';
    }
    static get BASE_API_PATH() {
        return 'radar-base-api-path';
    }

    static getStorage() {
        return (window && window.sessionStorage) || undefined;
    }

    static setItem(key, value) {
        const storage = this.getStorage();
        if (!storage) {
            return;
        }
        sessionStorage.setItem(key, value);
    }

    static getItem(key) {
        const storage = this.getStorage();
        if (!storage) {
            return null;
        }

        const value = storage.getItem(key);
        if (value !== undefined && value !== null) {
            return value;
        }
        return null;
    }

    static removeItem(key) {
        const storage = this.getStorage();
        if (!storage) {
            return null;
        }
        storage.removeItem(key);
    }

    static clear() {
        const storage = this.getStorage();
        if (!storage) {
            return null;
        }
        storage.clear();
    }
}

export default Storage;