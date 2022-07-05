class SessionStorage {

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
    static get USER_ID () {
        return 'radar-userId';
    }
    static get INSTALL_ID () {
        return 'radar-installId';
    }
    static get TRIP_OPTIONS () {
        return 'radar-trip-options';
    }
    static get CUSTOM_HEADERS () {
        return 'radar-custom-headers';
    }
    static get BASE_API_PATH () {
        return 'radar-base-api-path';
    }

    static setSessionStorage(key, value) {
        if (!window || !window.sessionStorage === undefined || typeof value !== 'string'){
            return;
        }

        sessionStorage.setItem(key, value);
        
    }

    static getSessionStorage(key) {
        if (!window || window.sessionStorage === undefined) {
            return null;
        }

        const value = window.sessionStorage.getItem(key);

        return value ? value !== undefined : null;
    }

    static deleteSessionStorage(key) {
        if (!window || !window.sessionStorage) {
            return;
        }

        window.sessionStorage.removeItem(key);
    }

    static clearSessionStorage(){
        if (!window || !window.sessionStorage) {
            return;
        }

        window.sessionStorage.clear();
    }
}

export default SessionStorage;