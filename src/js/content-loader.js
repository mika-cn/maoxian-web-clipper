(()=>{
  const path = "/js/content.js";
  const abs_path = (browser || chrome).runtime.getURL(path);
  console.log(abs_path);
  import(abs_path).then((module) => {
    const m = module.default;
    m.run();
  }, (error) => {
    console.error(error.message);
    console.error(error.stack);
  });
})();
