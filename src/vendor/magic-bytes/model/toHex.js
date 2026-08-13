"use strict";
const hex = (num) => new Number(num).toString(16).toLowerCase();
const toHex = (num) => `0x${hex(num).length === 1 ? "0" + hex(num) : hex(num)}`;
const fromHex = (hex) => new Number(hex);

export default {fromHex, toHex}
