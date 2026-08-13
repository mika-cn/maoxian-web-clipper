var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { getFallbackSelector } from "./selector-fallback.js";
import { sanitizeOptions } from "./utilities-options.js";
import { sanitizeSelectorNeedle, selectorGenerator, } from "./utilities-selectors.js";
import { getRootNode } from "./utilities-dom.js";
import { SELECTOR_SEPARATOR } from "./constants.js";
/**
 * Generates unique CSS selector for an element.
 */
export function getCssSelector(needle, custom_options = {}) {
    const options = Object.assign(Object.assign({}, custom_options), { maxResults: 1 });
    const generator = cssSelectorGenerator(needle, options);
    const firstResult = generator.next();
    return firstResult.value;
}
/**
 * Generates unique CSS selector for an element.
 */
export function* cssSelectorGenerator(needle, custom_options = {}) {
    var _a;
    const elements = sanitizeSelectorNeedle(needle);
    const options = sanitizeOptions(elements[0], custom_options);
    const root = (_a = options.root) !== null && _a !== void 0 ? _a : getRootNode(elements[0]);
    let foundResults = 0;
    for (const selector of selectorGenerator({
        elements,
        options,
        root,
        rootSelector: "",
    })) {
        yield selector;
        foundResults++;
        if (foundResults >= options.maxResults) {
            return;
        }
    }
    // if failed to find single selector matching all elements, try to find
    // selector for each standalone element and join them together
    if (elements.length > 1) {
        const { maxResults: _ignored } = custom_options, elementOptions = __rest(custom_options, ["maxResults"]);
        yield elements
            .map((element) => getCssSelector(element, elementOptions))
            .join(SELECTOR_SEPARATOR);
        foundResults++;
        if (foundResults >= options.maxResults) {
            return;
        }
    }
    const rootWasProvided = custom_options.root !== undefined;
    yield getFallbackSelector(elements, options.useScope || rootWasProvided ? root : undefined);
}
export default getCssSelector;
//# sourceMappingURL=index.js.map