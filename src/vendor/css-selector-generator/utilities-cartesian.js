/**
 * Generates cartesian product out of input object.
 */
export function* cartesianProductGenerator(input = {}) {
    const entries = Object.entries(input);
    if (entries.length === 0)
        return;
    // Use iterative stack-based approach to yield results one at a time
    // This avoids recursion overhead while maintaining lazy evaluation
    const stack = [
        { index: entries.length - 1, partial: {} },
    ];
    while (stack.length > 0) {
        const item = stack.pop();
        if (!item)
            break;
        const { index, partial } = item;
        if (index < 0) {
            yield partial;
            continue;
        }
        const [key, values] = entries[index];
        // Push in reverse order so we process in correct order
        for (let i = values.length - 1; i >= 0; i--) {
            stack.push({
                index: index - 1,
                partial: Object.assign(Object.assign({}, partial), { [key]: values[i] }),
            });
        }
    }
}
//# sourceMappingURL=utilities-cartesian.js.map