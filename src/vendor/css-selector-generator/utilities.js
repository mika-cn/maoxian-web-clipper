import { testSelector } from "./utilities-dom";
/**
 * Returns closest parent element that is common for all needle elements. Returns `null` if no such element exists.
 */
export function getCommonParent(needle) {
    // optimization for empty needle
    if (needle.length === 0) {
        return null;
    }
    // optimization for single element
    if (needle.length === 1) {
        return needle[0].parentElement;
    }
    // optimization for when any element has no parent, it means there is no common parent
    if (needle.some((element) => element.parentElement === null)) {
        return null;
    }
    let parent = needle[0].parentElement;
    while (parent) {
        // find common parent for multiple elements
        if (needle.every((element) => parent === null || parent === void 0 ? void 0 : parent.contains(element))) {
            return parent;
        }
        parent = parent.parentElement;
    }
    return null;
}
/**
 * Yields all common parents of the needle, starting with the one closest to the needle.
 */
export function* parentsGenerator(needle, root) {
    let parent = getCommonParent(needle);
    while (parent && (root === null || root === void 0 ? void 0 : root.contains(parent))) {
        yield parent;
        parent = parent.parentElement;
    }
}
/**
 * Yields all parents of the needle that when used as a root for selector, will only match the needle.
 */
export function* viableParentsGenerator(needle, needleSelector, root) {
    for (const parentCandidate of parentsGenerator(needle, root)) {
        if (testSelector(needle, needleSelector, parentCandidate)) {
            yield parentCandidate;
        }
    }
}
/**
 * Check whether needle selector within this parent will match only the needle.
 */
export function testParentCandidate(needle, needleSelector, parent) {
    const matchingElements = Array.from(parent.querySelectorAll(needleSelector));
    return (matchingElements.length > 0 &&
        matchingElements.every((element) => needle.contains(element)));
}
//# sourceMappingURL=utilities.js.map