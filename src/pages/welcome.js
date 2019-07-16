
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



function render(){
  const template = T.findElem('welcome-page-tpl').innerHTML;
  const html = T.renderTemplate(template, {
    installationHint: installationHint(),
    extraStep1: extraStep1(),
    extraStep2: extraStep2(),
  });
  T.setHtml('.main', html);
}


function installationHint(){
  return t('welcome.installation-hint').replace('$version', "V" + ENV.version);
}

function extraStep1(){
  if(MxWcLink.isChrome()){
    return t('welcome.extra-1-chrome');
  } else {
    return t('welcome.extra-1-firefox');
  }
}

function extraStep2(){
  if(MxWcLink.isChrome()) {
    let html = t('welcome.extra-2-chrome');
    html = html.replace('$extensionLink',
      `<a href='' link='${"chrome://extensions?id=" + MxWcLink.extensionId}' class='tab-link'>chrome-extensions</a>`
    );
    return html;
  } else {
    return t('welcome.extra-2-firefox');
  }
}

function init(){
  render();
  initListener();
  MxWcLink.listen(document.body);
}

init();
