import { sanitizeSelectorItem } from "./utilities-selectors.js";
import { INVALID_CLASS_RE } from "./constants.js";
import { getIntersection, createPatternMatcher } from "./utilities-data.js";
const WORD_LIKE_PATTERN = /^[a-z_-]{3,}$/i;
const CONSONANT_PATTERN = /[bcdfghjklmnpqrstvwxyz]{4,}/i;
/**
 * Checks if a class name appears to be human-readable (word-like)
 * rather than a generated hash from CSS-in-JS libraries.
 *
 * Heuristics:
 * 1. Must match basic pattern: letters, hyphens, and underscores, at least 3 chars
 * 2. Split on hyphens, underscores (one or more), or camelCase boundaries
 * 3. Each word segment must be > 2 characters
 * 4. No word can have 4+ consecutive consonants
 *
 * Examples:
 * - Word-like: "button", "nav", "nav-container", "userProfile", "block__element--modifier"
 * - Generated: "css-abc123", "sc-xyz", "abc", "xyz", "button_primary" (single underscore)
 */
export function isWordLikeClassName(className) {
    if (!WORD_LIKE_PATTERN.test(className)) {
        return false;
    }
    // Reject single underscores (only allow double underscores for BEM)
    if (className.includes("_") && !className.includes("__")) {
        return false;
    }
    // Reject common CSS-in-JS library prefixes
    if (/^(css|sc|jsx|emotion|makeStyles|MuiButton|MuiBox)-/i.test(className)) {
        return false;
    }
    // Split on hyphens, double-underscores, or camelCase boundaries (lowercase->uppercase)
    // This handles: kebab-case, BEM (block__element--modifier), camelCase, PascalCase
    const words = className
        .split(/--|__|[-]|(?<=[a-z])(?=[A-Z])/)
        .filter((word) => word.length > 0);
    // Must have at least one actual word (not just separators)
    if (words.length === 0) {
        return false;
    }
    // For single-word class names (no separators), require at least 4 chars
    // to avoid false positives with short hashes like "abc", "xyz"
    if (words.length === 1 && words[0].length < 4) {
        return false;
    }
    for (const word of words) {
        // Each word segment must be > 2 characters
        if (word.length <= 2) {
            return false;
        }
        // No word can have 4+ consecutive consonants
        if (CONSONANT_PATTERN.test(word)) {
            return false;
        }
    }
    return true;
}
/**
 * Get class selectors for an element.
 */
export function getElementClassSelectors(element, options) {
    var _a;
    const classNames = ((_a = element.getAttribute("class")) !== null && _a !== void 0 ? _a : "")
        .trim()
        .split(/\s+/)
        .filter((item) => !INVALID_CLASS_RE.test(item));
    let filteredClassNames = classNames;
    // Apply generated class name filtering if enabled
    if (options === null || options === void 0 ? void 0 : options.ignoreGeneratedClassNames) {
        // Check whitelist to preserve whitelisted generated classes
        const matchWhitelist = createPatternMatcher(options.whitelist);
        filteredClassNames = classNames.filter((className) => {
            const selector = `.${sanitizeSelectorItem(className)}`;
            // If whitelisted, always include
            if (matchWhitelist(selector)) {
                return true;
            }
            // Otherwise, check if it's word-like
            return isWordLikeClassName(className);
        });
    }
    return filteredClassNames.map((item) => `.${sanitizeSelectorItem(item)}`);
}
/**
 * Get class selectors matching all elements.
 */
export function getClassSelectors(elements, options) {
    const elementSelectors = elements.map((el) => getElementClassSelectors(el, options));
    return getIntersection(elementSelectors);
}
//# sourceMappingURL=selector-class.js.map