import { CSS_SELECTOR_TYPE } from "./types.js";
export const SELECTOR_SEPARATOR = ", ";
// RegExp that will match invalid patterns that can be used in ID attribute.
export const INVALID_ID_RE = new RegExp([
    "^$", // empty or not set
    "\\s", // contains whitespace
].join("|"));
// RegExp that will match invalid patterns that can be used in class attribute.
export const INVALID_CLASS_RE = new RegExp([
    "^$", // empty or not set
].join("|"));
// Order in which a combined selector is constructed.
export const SELECTOR_PATTERN = [
    CSS_SELECTOR_TYPE.nthoftype,
    CSS_SELECTOR_TYPE.tag,
    CSS_SELECTOR_TYPE.id,
    CSS_SELECTOR_TYPE.class,
    CSS_SELECTOR_TYPE.attribute,
    CSS_SELECTOR_TYPE.nthchild,
];
//# sourceMappingURL=constants.js.map