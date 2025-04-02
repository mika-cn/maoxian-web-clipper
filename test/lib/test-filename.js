
import H from '../helper.js'
import T from '../../src/js/lib/filename.js';

describe('Filename', () => {

  it('sanitize c++', () => {
    H.assertEqual(T.sanitize('x c++xx-C++'), 'x-c++xx-C++')
    H.assertEqual(T.sanitize('x`c++`x-'), 'x-c++-x')
  });

  it('use a generated name if empty', () => {
    const name = T.sanitize('');
    H.assertTrue(name.length > 0);
  });

  it('should remove zero width space', () => {
    const name = "Foo\u200BBar\u2060Baz";
    H.assertEqual(T.sanitize(name), 'FooBarBaz');
  });

  it('should truncate long name', () => {
    const n = 300;
    let name = '';
    for (let i = 0; i < n; i++) { name += 'a' }
    const r = T.sanitize(name);
    H.assertTrue(r.length < name.length)
  });

});
