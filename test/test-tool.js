
const H = require('./helper.js');
const T = H.depJs('tool.js');
const assert = require('assert');

describe('Tool', () => {
  it("capitalize(str)", () => {
    assert.equal(T.capitalize('foo'), 'Foo');
    assert.equal(T.capitalize('FOO'), 'Foo');
    assert.equal(T.capitalize('foo-bar'), 'FooBar');
    assert.equal(T.capitalize('foo_bar'), 'FooBar');
  })

  it("deCapitalize(str)", () => {
    assert.equal(T.deCapitalize('FooBar'), 'foo-bar');
    assert.equal(T.deCapitalize('FooBar', '.'), 'foo.bar');
  })

  it("isExtensionUrl(url)", () => {
    assert(T.isExtensionUrl("moz-extension://abc/index"));
    assert(T.isExtensionUrl("chrome-extension://abc/index"));
    assert(!T.isExtensionUrl("http://example.org/index"));
  })

  it("calcPath(currDir, destDir)", () => {
    assert.equal(T.calcPath('a', 'a/b'), 'b')
    assert.equal(T.calcPath('a', ''), '../')
    assert.equal(T.calcPath('a/b', 'a'), '../')
    assert.equal(T.calcPath('a/b/c', 'a/b'), '../')
    assert.equal(T.calcPath('a/b/c', 'a'), '../../')
  })

  it("extractRgbStr(rgbStr)", () => {
    assert.equal(T.extractRgbStr('rgb(255, 255, 255)').length, 3);
    assert.equal(T.extractRgbStr('rgb(255,255,255)').length, 3);
    assert.equal(T.extractRgbStr('rgba(0,0,0,0)').length, 4);
    const [r, g, b] = T.extractRgbStr('rgb(1,2,3)');
    assert.equal(r, 1);
    assert.equal(g, 2);
    assert.equal(b, 3);
  });
})
