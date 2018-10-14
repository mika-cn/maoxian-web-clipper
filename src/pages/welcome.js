
function initListener(){
  const elems = T.queryElems('.tab-link');
  T.each(elems, (elem) => {
    T.bind(elem, 'click', function(e){
      const link = e.target.getAttribute('link');
      e.preventDefault();
      ExtApi.createTab(link);
    });
  });
}

function getRenderV(){
  return {
    version: ENV.version,
    isChrome: MxWcLink.isChrome(),
    chromeExtensionDetailPageUrl: "chrome://extensions?id=" + MxWcLink.extensionId
  }
}

function init(){
  const v = getRenderV();
  const html = MxWcTemplate.welcomePage.render(v);
  T.firstElem('main').innerHTML = html;
  initListener();
}


init();
