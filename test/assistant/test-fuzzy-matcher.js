import H from '../helper.js';
import FuzzyMatcher from '../../src/js/assistant/fuzzy-matcher.js';

describe("Assistant fuzzyMatcher", () => {
  const match = function(url, pattern) {
    it(`${pattern} should match ${url}`, () => {
      H.assertTrue(FuzzyMatcher.matchUrl(url, pattern))
    })
  }
  const notMatch = function(url, pattern) {
    it(`${pattern} should not match ${url}`, () => {
      H.assertFalse(FuzzyMatcher.matchUrl(url, pattern))
    })
  }

  match("/", "/")
  notMatch("/", "*")
  notMatch("/", "/*")
  match("/a", "/*")
  match("/a/b/c", "/")

  match("/", "**")
  match("a.html", "*")
  match("a.html", "*.html")
  match("a.html", "a.*")
  match("a.html", "**")
  match("/a.html", "*.html")
  match("a.html", "/*.html")

  match("a/b", "*/b")
  match("a/b", "*/*")
  match("a/b/", "a/")
  match("a/b/", "a/*")
  match("a/b/", "a/b") // ?
  notMatch("a/b/", "a/b/*")
  notMatch("a/", "a/b")

  match("a/b/c", "**")
  match("a/b/c", "**/*")
  notMatch("a/b/c", "**/*/*/*/*")
  match("a/b/c", "**/c")
  match("a/b/c", "**/*/c")
  match("a/b/c", "**/*/*/c")
  notMatch("a/b/c", "**/*/*/*/c")
  match("a/b/c", "**/*/b/*")
  match("a/b/c", "**/*/b/c")

  match("a/b/c", "*/**")
  match("a/b/c", "a/**")
  match("a/b/c", "*/*/**")
  match("a/b/c", "*/*/*/**")
  match("a/b/c", "a/b/c/**")
  notMatch("a/b/c", "a/b/c/*")
  notMatch("a/b/c", "*/*/*/*/**")

  const pattern = "a/**/b/**/c"
  match("a/b/x/y/z/c", pattern)
  match("a/x/y/z/b/c", pattern)
  match("a/b/x/b/x/c", pattern)
  match("a/b/c", pattern)

  match("a/x/y/b/z/z/c", "a/**/b/**/c")
  match("a/x/y/b/z/z/c", "a/**/*/**/c")
  notMatch("a/b", "**/*/*/a")
  match("a/b", "**/*/*/**")
  notMatch("a/b", "**/*/*/*/**")
});

