/**
 * Guard function that checks if provided `input` is an Element.
 */
export function isElement(input) {
    return (typeof input === "object" &&
        input !== null &&
        input.nodeType === Node.ELEMENT_NODE);
}
//# sourceMappingURL=utilities-iselement.js.map