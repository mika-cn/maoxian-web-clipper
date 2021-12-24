

class WhiteSpaceGenerator {

  constructor({depth = 0, step, currIndent = ""}) {
    const n = step * depth;
    this.depth = depth;
    this.step = step;
    this.currIndent = (currIndent == undefined ? "".padStart(n) : currIndent);
    this.nextIndent = "".padStart(n + step);
  }

  get space() { return ' ' }
  get nLine() { return "\n" }// new line
  get indent0() { return this.currIndent }
  get indent1() { return this.nextIndent }

  indentN(extraDepth) {
    return this.currIndent + "".padStart(this.step * extraDepth);
  }

  // base on the current indent, move to next level.
  // returns a new instance
  nextLevel() {
    return new WhiteSpaceGenerator({
      depth: this.depth + 1,
      step: this.step,
      currIndent: this.nextIndent,
    });
  }

  // returns a new instance
  resetLevel() {
    return new WhiteSpaceGenerator({
      step: this.step,
    });
  }
}



class WhiteSpaceCompressor {
  constructor() { }

  get space() {return ''}
  get nLine() {return ''}
  get indent0() {return ''}
  get indent1() {return ''}

  indentN(extraDepth) {return ''}
  nextLevel() {return this}
  resetLevel() {return this}
}

function pad(v) { return (v == undefined || v === "") ? '' : ` ${v}` }
WhiteSpaceGenerator.prototype.pad = pad;
WhiteSpaceCompressor.prototype.pad = pad;

function create({step = 2, compress = false}) {
  return new (compress ? WhiteSpaceCompressor : WhiteSpaceGenerator)({step});
}

export default {create};
