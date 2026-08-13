import { getElementParents, isShadowRoot } from "./utilities-dom.js";
import { SELECTOR_SEPARATOR } from "./constants.js";
import { CSS_SELECTOR_TYPE, OPERATOR } from "./types.js";
import { constructElementSelector, createElementData, } from "./utilities-element-data.js";
/**
 * Creates fallback selector for single element.
 */
export function getElementFallbackSelector(element, root) {
    const parentElements = getElementParents(element, root).reverse();
    const rootIsShadowRoot = isShadowRoot(root);
    const elementsData = parentElements.map((element, index) => {
        var _a;
        const elementData = createElementData(element, [CSS_SELECTOR_TYPE.nthchild], 
        // do not use child combinator for the first element in ShadowRoot
        rootIsShadowRoot && index === 0 ? OPERATOR.NONE : OPERATOR.CHILD);
        ((_a = elementData.selectors.nthchild) !== null && _a !== void 0 ? _a : []).forEach((selectorData) => {
            selectorData.include = true;
        });
        return elementData;
    });
    // Don't use :scope prefix for ShadowRoot since it doesn't work correctly
    const prefix = rootIsShadowRoot ? "" : root ? ":scope" : ":root";
    return [prefix, ...elementsData.map(constructElementSelector)].join("");
}
/**
 * Creates chain of :nth-child selectors from root to the elements.
 */
export function getFallbackSelector(elements, root) {
    return elements
        .map((element) => getElementFallbackSelector(element, root))
        .join(SELECTOR_SEPARATOR);
}
//# sourceMappingURL=selector-fallback.js.map