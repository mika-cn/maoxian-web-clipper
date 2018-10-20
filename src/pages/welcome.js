
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
    lastHint: lastHint()
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
    let html = t('welcome.extra-2-firefox');
    html = html.replace('$allowFileUrlAccessLink',
      `<a href="${MxWcLink.get('faq-allow-access-file-urls')}" target="_blank">Allow Access File URLs</a>`
    );
    return html;
  }
}

function lastHint() {
  const linkHtml = `<a href=${MxWcLink.get('faq')} target='_blank'>FAQ</a>`;
  return t('welcome.last-hint').replace('$faqLink', linkHtml);
}

function init(){
  render();
  i18nPage();
  initListener();
}

init();
