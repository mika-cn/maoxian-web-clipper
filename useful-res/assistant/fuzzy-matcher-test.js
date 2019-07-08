// node
const FuzzyMatcher = require("./fuzzy-matcher")

const match = function(url, pattern) {
  const r = FuzzyMatcher.matchUrl(url, pattern)
  if(r) {
    console.log('.')
  } else {
    console.log("ShouldMatch: ", url, pattern)
  }
}
const notMatch = function(url, pattern) {
  const r = FuzzyMatcher.matchUrl(url, pattern)
  if(r) {
    console.log("ShouldNotMatch: ", url, pattern)
  } else {
    console.log(".")
  }
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

console.log("Done!")
