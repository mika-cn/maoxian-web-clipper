import { isRegExp } from "./utilities-options.js";
import { showWarning } from "./utilities-messages.js";
/**
 * Creates array containing only items included in all input arrays.
 */
export function getIntersection(items = []) {
    const [firstItem = [], ...otherItems] = items;
    if (otherItems.length === 0) {
        return firstItem;
    }
    return otherItems.reduce((accumulator, currentValue) => {
        const currentSet = new Set(currentValue);
        return accumulator.filter((item) => currentSet.has(item));
    }, firstItem);
}
/**
 * Converts array of arrays into a flat array.
 */
export function flattenArray(input) {
    return [].concat(...input);
}
/**
 * Convert string that can contain wildcards (asterisks) to RegExp source.
 */
export function wildcardToRegExp(input) {
    return (input
        // convert all special characters used by RegExp, except an asterisk
        .replace(/[|\\{}()[\]^$+?.]/g, "\\$&")
        // convert asterisk to pattern that matches anything
        .replace(/\*/g, ".+"));
}
/**
 * Creates function that will test list of provided matchers against input.
 * Used for white/blacklist functionality.
 */
export function createPatternMatcher(list) {
    const matchFunctions = list.map((item) => {
        if (isRegExp(item)) {
            return (input) => item.test(input);
        }
        if (typeof item === "function") {
            return (input) => {
                const result = item(input);
                if (typeof result !== "boolean") {
                    showWarning("pattern matcher function invalid", "Provided pattern matching function does not return boolean. It's result will be ignored.", item);
                    return false;
                }
                return result;
            };
        }
        if (typeof item === "string") {
            const re = new RegExp("^" + wildcardToRegExp(item) + "$");
            return (input) => re.test(input);
        }
        showWarning("pattern matcher invalid", "Pattern matching only accepts strings, regular expressions and/or functions. This item is invalid and will be ignored.", item);
        return () => false;
    });
    return (input) => matchFunctions.some((matchFunction) => matchFunction(input));
}
//# sourceMappingURL=utilities-data.js.map