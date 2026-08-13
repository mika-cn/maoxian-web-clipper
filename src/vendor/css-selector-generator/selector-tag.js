import { sanitizeSelectorItem } from "./utilities-selectors.js";
import { flattenArray } from "./utilities-data.js";
/**
 * Get tag selector for an element.
 */
export function getElementTagSelectors(element, _options) {
    return [
        sanitizeSelectorItem(element.tagName.toLowerCase()),
    ];
}
/**
 * Get tag selector for list of elements.
 */
export function getTagSelector(elements, options) {
    const selectors = [
        ...new Set(flattenArray(elements.map((el) => getElementTagSelectors(el, options)))),
    ];
    return selectors.length === 0 || selectors.length > 1 ? [] : [selectors[0]];
}
//# sourceMappingURL=selector-tag.js.map