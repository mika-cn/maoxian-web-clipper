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
  match('https://a.org', 'https://a.org')
  match('http://a.org', 'http*://a.org')
  match('https://a.org', 'http*://a.org')

  // host
  match('http://a.org', 'http://*.org');
  match('http://a.b.c.org', 'http://*.org');
  notMatch('http://a.com', 'http://*.org');

  // search
  match('http://a.org?A=1', 'http://a.org');
  notMatch('http://a.org', 'http://a.org?A=1');

  match('http://a.org?A=1', 'http://a.org?A=*');
  match('http://a.org?A=1&B=0', 'http://a.org?A=1');
  match('http://a.org?A=1&B=0', 'http://a.org?B=*&A=1');
  notMatch('http://a.org?A=1&B=0', 'http://a.org?!A=1');

  match('http://a.org?A=01', 'http://a.org?A=$d');
  notMatch('http://a.org?A=a1', 'http://a.org?A=$d');

  // frame
  match('http://a.org#f', 'http://a.org');
  notMatch('http://a.org', 'http://a.org#f');
  match('http://a.org#abc', 'http://a.org#ab*');


  // paths

  const prefix = function(it) {
    if (!it.startsWith('/')) {
      throw new Error("path should starts with '/'");
    }
    return `http://a.org${it}`
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

  // digital
  matchPath("/0123", "/$d");
  notMatchPath("/abc", "/$d");
  notMatchPath("/a123", "/$d");
  matchPath("/0123/a", "/$d/a");

  // pattern that ends with "/" (prefix pattern)
  matchPath("/", "/")
  matchPath("/a", "/");
  matchPath("/a/b/c", "/a/");

  // pattern that ends with "/a"
  notMatchPath("/", "/a")
  notMatchPath("/b", "/a")
  matchPath("/a", "/a")
  notMatchPath("/a/", "/a")

  // pattern that ends with "/*"
  matchPath("/", "/*")
  matchPath("/a", "/*")
  notMatchPath("/a/", "/*")
  notMatchPath("/a/b", "/*")
  notMatchPath("/a", "/a/*")
  matchPath("/a/b", "/a/*")

  // "*" in the middle
  matchPath("/a/b", "/*/b")
  notMatchPath("/a/b/c", "/*/b")
  matchPath("/a/b/c", "/a/*/c")

  // "*" in filename
  matchPath("/a.html", "/*.html")
  matchPath("/a.html", "/a.*")


  // "**" in the end, swallow everything
  matchPath("/", "/**")
  matchPath("/a", "/**")
  matchPath("/a/b/c", "/**")
  matchPath("/a/b/c", "/a/**")
  matchPath("/a/b/c", "/a/b/c/**")
  matchPath("/a/b/c", "/*/**")
  matchPath("/a/b/c", "/*/*/*/**")
  notMatchPath("/a/b/c", "/*/*/*/*/**")

  // "**" at the beginning
  matchPath("/a", "/**/*")
  matchPath("/a/b/c", "/**/*")
  notMatchPath("/a/b/c", "/**/x")
  notMatchPath("/a/b/c", "/**/*/*/*/*")
  matchPath("/a/b/c", "/**/c")
  matchPath("/a/b/c", "/**/*/c")
  matchPath("/a/b/c", "/**/*/*/c")
  notMatchPath("/a/b/c", "/**/*/*/*/c")
  matchPath("/a/b/c", "/**/*/b/*")
  matchPath("/a/b/c", "/**/*/b/c")


  const pattern = "/a/**/b/**/c"
  matchPath("/a/b/x/y/z/c", pattern)
  matchPath("/a/x/y/z/b/c", pattern)
  matchPath("/a/b/x/b/x/c", pattern)
  matchPath("/a/b/c", pattern)

  matchPath("/a/x/y/b/z/z/c", "/a/**/b/**/c")
  notMatchPath("/a/x/y/b/z/z/c", "/a/**/k/**/c")
  matchPath("/a/x/y/b/z/z/c", "/a/**/*/**/c")
  matchPath("/a/b", "/**/*/*/**")
  notMatchPath("/a/b", "/**/*/*/*/**")
});

