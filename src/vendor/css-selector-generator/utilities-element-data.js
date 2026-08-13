import { CSS_SELECTOR_TYPE, OPERATOR, } from "./types.js";
import { SELECTOR_PATTERN } from "./constants.js";
import { getElementSelectorsByType } from "./utilities-selectors.js";
/**
 * Creates data describing a specific selector.
 */
export function createElementSelectorData(selector) {
    return {
        value: selector,
        include: false,
    };
}
/**
 * Creates data describing an element within CssSelector chain.
 */
export function createElementData(element, selectorTypes, operator = OPERATOR.NONE) {
    const selectors = {};
    selectorTypes.forEach((selectorType) => {
        Reflect.set(selectors, selectorType, getElementSelectorsByType(element, selectorType).map(createElementSelectorData));
    });
    return {
        element,
        operator,
        selectors,
    };
}
/**
 * Constructs selector from element data.
 */
export function constructElementSelector({ selectors, operator, }) {
    let pattern = [...SELECTOR_PATTERN];
    // `nthoftype` already contains tag
    if (selectors[CSS_SELECTOR_TYPE.tag] &&
        selectors[CSS_SELECTOR_TYPE.nthoftype]) {
        pattern = pattern.filter((item) => item !== CSS_SELECTOR_TYPE.tag);
    }
    let selector = "";
    pattern.forEach((selectorType) => {
        var _a;
        const selectorsOfType = (_a = selectors[selectorType]) !== null && _a !== void 0 ? _a : [];
        selectorsOfType.forEach(({ value, include }) => {
            if (include) {
                selector += value;
            }
        });
    });
    return (operator + selector);
}
//# sourceMappingURL=utilities-element-data.js.map