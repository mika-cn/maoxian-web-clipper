import { sanitizeSelectorItem } from "./utilities-selectors.js";
import { INVALID_ID_RE } from "./constants.js";
import { testSelector } from "./utilities-dom.js";
/**
 * Get ID selector for an element.
 * */
export function getElementIdSelectors(element, _options) {
    var _a;
    const id = (_a = element.getAttribute("id")) !== null && _a !== void 0 ? _a : "";
    const selector = `#${sanitizeSelectorItem(id)}`;
    const rootNode = element.getRootNode({ composed: false });
    return !INVALID_ID_RE.test(id) && testSelector([element], selector, rootNode)
        ? [selector]
        : [];
}
/**
 * Get ID selector for an element.
 */
export function getIdSelector(elements, options) {
    return elements.length === 0 || elements.length > 1
        ? []
        : getElementIdSelectors(elements[0], options);
}
//# sourceMappingURL=selector-id.js.map