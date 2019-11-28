export let config = { d2: null };

export function t(...args) {
    const { d2 } = config;
    if (!d2) {
        throw new Error("d2 not initialized");
    } else {
        return d2.i18n.getTranslation(...args);
    }
}

export default { t, config };
