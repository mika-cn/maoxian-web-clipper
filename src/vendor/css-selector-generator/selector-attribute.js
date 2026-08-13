import { sanitizeSelectorItem } from "./utilities-selectors.js";
import { createPatternMatcher, getIntersection } from "./utilities-data.js";
// List of attributes to be ignored. These are handled by different selector types.
export const attributeBlacklistMatch = createPatternMatcher([
    "class",
    "id",
    // Angular attributes
    "ng-*",
]);
/**
 * Get simplified attribute selector for an element.
 */
export function attributeNodeToSimplifiedSelector({ name, }) {
    return `[${name}]`;
}
/**
 * Get attribute selector for an element.
 */
export function attributeNodeToSelector({ name, value, }) {
    return `[${name}='${value}']`;
}
/**
 * Checks whether an attribute should be used as a selector.
 */
export function isValidAttributeNode({ nodeName, nodeValue }, element) {
    // form input value should not be used as a selector
    const tagName = element.tagName.toLowerCase();
    if (["input", "option"].includes(tagName) && nodeName === "value") {
        return false;
    }
    // ignore Base64-encoded strings as 'src' attribute values (e.g. in tags like img, audio, video, iframe, object, embed).
    if (nodeName === "src" && (nodeValue === null || nodeValue === void 0 ? void 0 : nodeValue.startsWith("data:"))) {
        return false;
    }
    return !attributeBlacklistMatch(nodeName);
}
/**
 * Sanitize all attribute data. We want to do it once, before we start to generate simplified/full selectors from the same data.
 */
function sanitizeAttributeData({ nodeName, nodeValue }) {
    return {
        name: sanitizeSelectorItem(nodeName),
        value: sanitizeSelectorItem(nodeValue !== null && nodeValue !== void 0 ? nodeValue : undefined),
    };
}
/**
 * Get attribute selectors for an element.
 */
export function getElementAttributeSelectors(element, _options) {
    const validAttributes = Array.from(element.attributes)
        .filter((attributeNode) => isValidAttributeNode(attributeNode, element))
        .map(sanitizeAttributeData);
    return [
        ...validAttributes.map(attributeNodeToSimplifiedSelector),
        ...validAttributes.map(attributeNodeToSelector),
    ];
}
/**
 * Get attribute selectors matching all elements.
 */
export function getAttributeSelectors(elements, options) {
    const elementSelectors = elements.map((el) => getElementAttributeSelectors(el, options));
    return getIntersection(elementSelectors);
}
//# sourceMappingURL=selector-attribute.js.map