function depJs(path) {
  return require(`../src/js/${path}`);
}

module.exports = {depJs: depJs};
