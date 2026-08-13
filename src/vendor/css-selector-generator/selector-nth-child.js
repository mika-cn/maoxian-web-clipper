import { getIntersection } from "./utilities-data.js";
/**
 * Get nth-child selector for an element.
 */
export function getElementNthChildSelector(element, _options) {
    const parent = element.parentNode;
    const siblings = parent && "children" in parent ? parent.children : null;
    if (siblings) {
        for (let i = 0; i < siblings.length; i++) {
            if (siblings[i] === element) {
                return [`:nth-child(${String(i + 1)})`];
            }
        }
    }
    return [];
}
/**
 * Get nth-child selector matching all elements.
 */
export function getNthChildSelector(elements, options) {
    return getIntersection(elements.map((el) => getElementNthChildSelector(el, options)));
}
//# sourceMappingURL=selector-nth-child.js.map