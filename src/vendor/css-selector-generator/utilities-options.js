import { CSS_SELECTOR_TYPE, } from "./types.js";
import { getRootNode } from "./utilities-dom.js";
import { isEnumValue } from "./utilities-typescript.js";
import { showWarning } from "./utilities-messages.js";
export const DEFAULT_OPTIONS = {
    selectors: [
        CSS_SELECTOR_TYPE.id,
        CSS_SELECTOR_TYPE.class,
        CSS_SELECTOR_TYPE.tag,
        CSS_SELECTOR_TYPE.attribute,
    ],
    // if set to true, always include tag name
    includeTag: false,
    whitelist: [],
    blacklist: [],
    combineWithinSelector: true,
    combineBetweenSelectors: true,
    root: null,
    maxCombinations: Number.POSITIVE_INFINITY,
    maxCandidates: Number.POSITIVE_INFINITY,
    useScope: false,
    ignoreGeneratedClassNames: false,
};
/**
 * Makes sure the input is converted to a boolean value.
 */
export function sanitizeBoolean(input) {
    return !!input;
}
/**
 * Makes sure returned value is a list containing only valid selector types.
 * @param input
 */
export function sanitizeSelectorTypes(input) {
    if (!Array.isArray(input)) {
        return [];
    }
    return input.filter((item) => isEnumValue(CSS_SELECTOR_TYPE, item));
}
/**
 * Checks whether provided value is of type RegExp.
 */
export function isRegExp(input) {
    return input instanceof RegExp;
}
/**
 * Checks whether provided value is usable in whitelist or blacklist.
 * @param input
 */
export function isCssSelectorMatch(input) {
    return ["string", "function"].includes(typeof input) || isRegExp(input);
}
/**
 * Converts input to a list of valid values for whitelist or blacklist.
 */
export function sanitizeCssSelectorMatchList(input) {
    if (!Array.isArray(input)) {
        return [];
    }
    return input.filter(isCssSelectorMatch);
}
/**
 * Checks whether provided value is valid Node.
 * Uses nodeType check instead of instanceof to work across iframe boundaries.
 */
export function isNode(input) {
    return (input != null &&
        typeof input === "object" &&
        "nodeType" in input &&
        typeof input.nodeType === "number");
}
/**
 * Checks whether provided value is valid ParentNode.
 */
export function isParentNode(input) {
    const validParentNodeTypes = [
        Node.DOCUMENT_NODE,
        Node.DOCUMENT_FRAGMENT_NODE, // this includes Shadow DOM root
        Node.ELEMENT_NODE,
    ];
    return isNode(input) && validParentNodeTypes.includes(input.nodeType);
}
/**
 * Makes sure that the root node in options is valid.
 */
export function sanitizeRoot(input, element) {
    if (isParentNode(input)) {
        if (!input.contains(element)) {
            showWarning("element root mismatch", "Provided root does not contain the element. This will most likely result in producing a fallback selector using element's real root node. If you plan to use the selector using provided root (e.g. `root.querySelector`), it will not work as intended.");
        }
        return input;
    }
    const rootNode = element.getRootNode({ composed: false });
    if (isParentNode(rootNode)) {
        // Any document is a normal root, including an iframe's document or one
        // built by `DOMParser`. Comparing against the global `document` would
        // misreport those as Shadow DOM. Only a shadow root (or a detached
        // fragment) warrants the warning, and both are fragment nodes.
        if (rootNode.nodeType !== Node.DOCUMENT_NODE) {
            showWarning("shadow root inferred", "You did not provide a root and the element is a child of Shadow DOM. This will produce a selector using ShadowRoot as a root. If you plan to use the selector using document as a root (e.g. `document.querySelector`), it will not work as intended.");
        }
        return rootNode;
    }
    return getRootNode(element);
}
/**
 * Makes sure that the output is a number, usable as `maxResults` option in
 * powerset generator.
 */
export function sanitizeMaxNumber(input) {
    return typeof input === "number" ? input : Number.POSITIVE_INFINITY;
}
/**
 * Makes sure the options object contains all required keys.
 */
export function sanitizeOptions(element, custom_options = {}) {
    const options = Object.assign(Object.assign({}, DEFAULT_OPTIONS), custom_options);
    return {
        selectors: sanitizeSelectorTypes(options.selectors),
        whitelist: sanitizeCssSelectorMatchList(options.whitelist),
        blacklist: sanitizeCssSelectorMatchList(options.blacklist),
        root: sanitizeRoot(options.root, element),
        combineWithinSelector: sanitizeBoolean(options.combineWithinSelector),
        combineBetweenSelectors: sanitizeBoolean(options.combineBetweenSelectors),
        includeTag: sanitizeBoolean(options.includeTag),
        maxCombinations: sanitizeMaxNumber(options.maxCombinations),
        maxCandidates: sanitizeMaxNumber(options.maxCandidates),
        useScope: sanitizeBoolean(options.useScope),
        maxResults: sanitizeMaxNumber(options.maxResults),
        ignoreGeneratedClassNames: sanitizeBoolean(options.ignoreGeneratedClassNames),
    };
}
//# sourceMappingURL=utilities-options.js.map