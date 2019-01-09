
function renderBasicInformation() {
  const tpl = T.findElem('basic-information-tpl').innerHTML;
  const html = T.renderTemplate(tpl, {
    extensionVersion: ENV.version,
    minNativeAppVersion: ENV.minNativeAppVersion,
    logLevel: ENV.logLevel,
    isChromeExtension: MxWcLink.isChrome(),
    isMozExtension: MxWcLink.isFirefox()
  });
  T.setHtml("#basic-information > .content", html);
}

function renderRuntimeInformation() {
  const tpl = T.findElem('runtime-information-tpl').innerHTML;
  const html = T.renderTemplate(tpl, {
    os: ExtApi.platformInfo.os,
    arch: ExtApi.platformInfo.arch,
    nacl_arch: ExtApi.platformInfo.nacl_arch
  });
  T.setHtml("#runtime-information > .content", html);
}

function renderConfig() {
  const tpl = "<table><tbody>${config}</tbody></table>";
  MxWcConfig.load().then((config) => {
    let k = null;
    const rows = []
    for(k in config) {
      rows.push(`<tr><th>${k}</th><td>${config[k]}</td></tr>`);
    }
    const html = T.renderTemplate(tpl, {
      config: rows.join('')
    });
    T.setHtml('#configuration-information > .content', html);
  })
}

function init(){
  renderBasicInformation();
  renderConfig();
  setTimeout(() => {
    renderRuntimeInformation();
  }, 200);
}

init();
