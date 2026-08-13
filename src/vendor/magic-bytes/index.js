"use strict";

import pattern_tree_1 from "./model/pattern-tree.js"
import toHex_1        from "./model/toHex.js"

const exports = {};
const patternTree = pattern_tree_1.createTree();
const filetypeinfo = (bytes) => {
    const tree = patternTree;
    const found = [];
    // Every offset is checked, and the offset-less patterns on top of them. A file
    // matching at one offset may well match at another one too - reporting only the
    // first hit would hide the remaining types from callers validating uploads.
    for (const k of Object.keys(tree.offset)) {
        const offset = toHex_1.fromHex(k);
        const offsetExceedsFile = offset >= bytes.length;
        if (offsetExceedsFile) {
            continue;
        }
        const node = tree.offset[k];
        found.push(...walkTree(offset, bytes, node));
    }
    if (tree.noOffset !== null) {
        found.push(...walkTree(0, bytes, tree.noOffset));
    }
    return unique(found);
};


// The nodes hold the only copy of their matches, so they are cloned on the way out.
// Handing out the originals lets a caller mutating a result corrupt every later
// detection in the process.
const unique = (found) => {
    const seen = new Set();
    const result = [];
    for (const guess of found) {
        const key = JSON.stringify([guess.typename, guess.mime, guess.extension]);
        if (seen.has(key)) {
            continue;
        }
        seen.add(key);
        result.push({ ...guess });
    }
    return result;
};

const walkTree = (index, bytes, node) => {
    let step = node;
    let guessFile = [];
    while (true) {
        if (index >= bytes.length) {
            return guessFile;
        }
        const currentByte = toHex_1.toHex(bytes[index]);
        if (step.bytes["?"] && !step.bytes[currentByte]) {
            step = step.bytes["?"];
        }
        else {
            step = step.bytes[currentByte];
        }
        if (!step) {
            return guessFile;
        }
        if (step && step.matches) {
            guessFile = step.matches.slice(0);
        }
        index += 1;
    }
};


const filetypename = (bytes) => filetypeinfo(bytes).map((e) => e.typename);

const filetypemime = (bytes) => filetypeinfo(bytes)
    .map((e) => (e.mime ? e.mime : null))
    .filter((x) => x !== null);

const filetypeextension = (bytes) => filetypeinfo(bytes)
    .map((e) => (e.extension ? e.extension : null))
    .filter((x) => x !== null);

const register = (typename, signature, additionalInfo, offset) => {
    pattern_tree_1.add(typename, signature, additionalInfo, offset);
};


export default filetypeinfo;
export {filetypename, filetypemime, filetypeextension, filetypeinfo, register}
