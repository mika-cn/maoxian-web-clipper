const libraryName = "CssSelectorGenerator";
/**
 * Convenient wrapper for `console.warn` using consistent formatting.
 */
export function showWarning(id = "unknown problem", ...args) {
    // eslint-disable-next-line no-console
    console.warn(`${libraryName}: ${id}`, ...args);
}
//# sourceMappingURL=utilities-messages.js.map