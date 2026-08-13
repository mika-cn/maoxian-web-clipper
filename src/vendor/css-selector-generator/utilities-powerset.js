export function* powerSetGenerator(input = [], { maxResults = Number.POSITIVE_INFINITY } = {}) {
    let resultCounter = 0;
    let offsets = generateOffsets(1);
    while (offsets.length <= input.length && resultCounter < maxResults) {
        resultCounter += 1;
        const result = new Array(offsets.length);
        for (let index = 0; index < offsets.length; index++) {
            result[index] = input[offsets[index]];
        }
        yield result;
        offsets = bumpOffsets(offsets, input.length - 1);
    }
}
/**
 * Generates power set of input items.
 */
export function getPowerSet(input = [], { maxResults = Number.POSITIVE_INFINITY } = {}) {
    return Array.from(powerSetGenerator(input, { maxResults }));
}
/**
 * Helper function used by `getPowerSet`. Updates internal pointers.
 */
function bumpOffsets(offsets = [], maxValue = 0) {
    const size = offsets.length;
    if (size === 0) {
        return offsets;
    }
    // Find the right-most position that isn't already at the maximum value it
    // could hold while still leaving room for the strictly increasing
    // positions after it.
    let index = size - 1;
    while (index >= 0 && offsets[index] === maxValue - (size - 1 - index)) {
        index -= 1;
    }
    // Every position was already at its maximum: this was the last
    // combination of the current size, move on to the next size.
    if (index < 0) {
        return generateOffsets(size + 1);
    }
    // Increment the found position and reset everything after it to the
    // smallest increasing sequence that follows it.
    offsets[index] += 1;
    for (let i = index + 1; i < size; i++) {
        offsets[i] = offsets[i - 1] + 1;
    }
    return offsets;
}
/**
 * Generates array of size N, filled with numbers sequence starting from 0.
 */
function generateOffsets(size = 1) {
    const result = new Array(size);
    for (let index = 0; index < size; index++) {
        result[index] = index;
    }
    return result;
}
//# sourceMappingURL=utilities-powerset.js.map