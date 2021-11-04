import H from '../helper.js';
import Lib from '../../src/js/assistant/fuzzy-matcher.js';

describe("Assistant fuzzyMatcher", () => {

  const match = function(url, pattern) {
    it(`${pattern} should match ${url}`, () => {
      H.assertTrue(Lib.matchUrl(url, pattern))
    })
  }

  const notMatch = function(url, pattern) {
    it(`${pattern} should not match ${url}`, () => {
      H.assertFalse(Lib.matchUrl(url, pattern))
    })
  }

  // scheme
  notMatch('http://a.org', 'https://a.org')
  match('https://a.org/a', 'https://a.org')

  // host
  match('http://a.org', 'http://*.org');
  notMatch('http://a.com', 'http://*.org');

  // search
  match('http://a.org?A=1', 'http://a.org');
  notMatch('http://a.org', 'http://a.org?A=1');

  match('http://a.org?A=1', 'http://a.org?A=*');
  match('http://a.org?A=1&B=0', 'http://a.org?A=1');
  match('http://a.org?A=1&B=0', 'http://a.org?B=*&A=1');
  notMatch('http://a.org?A=1&B=0', 'http://a.org?!A=1');

  // frame
  match('http://a.org#f', 'http://a.org');
  notMatch('http://a.org', 'http://a.org#f');
  match('http://a.org#abc', 'http://a.org#ab*');


  // paths

  const prefix = function(it) {
    return it.startsWith('/') ? `http://a.org${it}` : `http://a.org/${it}`;
  }

  const matchPath = function(path, pathPattern) {
    const url = prefix(path);
    const pattern = prefix(pathPattern);
    it(`${pattern} should match ${url}`, () => {
      H.assertTrue(Lib.matchUrl(url, pattern))
    })
  }

  const notMatchPath = function(path, pathPattern) {
    const url = prefix(path);
    const pattern = prefix(pathPattern);
    it(`${pattern} should not match ${url}`, () => {
      H.assertFalse(Lib.matchUrl(url, pattern))
    })
  }

  matchPath("/", "/")
  notMatchPath("/", "*")
  notMatchPath("/", "/*")
  matchPath("/a", "/*")
  matchPath("/a/b/c", "/")

  matchPath("/", "**")
  matchPath("a.html", "*")
  matchPath("a.html", "*.html")
  matchPath("a.html", "a.*")
  matchPath("a.html", "**")
  matchPath("/a.html", "*.html")
  matchPath("a.html", "/*.html")

  matchPath("a/b", "*/b")
  matchPath("a/b", "*/*")
  matchPath("a/b/", "a/")
  matchPath("a/b/", "a/*")
  matchPath("a/b/", "a/b") // ?
  notMatchPath("a/b/", "a/b/*")
  notMatchPath("a/", "a/b")

  matchPath("a/b/c", "**")
  matchPath("a/b/c", "**/*")
  notMatchPath("a/b/c", "**/*/*/*/*")
  matchPath("a/b/c", "**/c")
  matchPath("a/b/c", "**/*/c")
  matchPath("a/b/c", "**/*/*/c")
  notMatchPath("a/b/c", "**/*/*/*/c")
  matchPath("a/b/c", "**/*/b/*")
  matchPath("a/b/c", "**/*/b/c")

  matchPath("a/b/c", "*/**")
  matchPath("a/b/c", "a/**")
  matchPath("a/b/c", "*/*/**")
  matchPath("a/b/c", "*/*/*/**")
  matchPath("a/b/c", "a/b/c/**")
  notMatchPath("a/b/c", "a/b/c/*")
  notMatchPath("a/b/c", "*/*/*/*/**")

  const pattern = "a/**/b/**/c"
  matchPath("a/b/x/y/z/c", pattern)
  matchPath("a/x/y/z/b/c", pattern)
  matchPath("a/b/x/b/x/c", pattern)
  matchPath("a/b/c", pattern)

  matchPath("a/x/y/b/z/z/c", "a/**/b/**/c")
  matchPath("a/x/y/b/z/z/c", "a/**/*/**/c")
  notMatchPath("a/b", "**/*/*/a")
  matchPath("a/b", "**/*/*/**")
  notMatchPath("a/b", "**/*/*/*/**")
});

