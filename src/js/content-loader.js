(()=>{
  let ApiRoot;
  if (typeof(browser) != 'undefined') {
    ApiRoot = browser;
  }
  else if (typeof(chrome) != 'undefined') {
    ApiRoot = chrome;
  } else {
    throw new Error("We couldn't find Browser Extension API root");
  }

  const path = "/js/content.js";
  const abs_path = ApiRoot.runtime.getURL(path);
  console.log(abs_path);
  import(abs_path).then((module) => {
    const m = module.default;
    m.run();
  }, (error) => {
    console.error(error.message);
    console.error(error.stack);
  });
})();
