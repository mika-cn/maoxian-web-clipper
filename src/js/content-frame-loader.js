(()=>{
  const path = "/js/content-frame.js";
  const abs_path = (browser || chrome).runtime.getURL(path);
  console.log(abs_path);
  import(abs_path).then((module) => {
    const m = module.default;
    m.init();
  }, (error) => {
    console.error(error.message);
    console.error(error.stack);
  });
})();
