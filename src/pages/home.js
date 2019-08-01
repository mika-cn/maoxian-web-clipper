;(function(root, factory) {
  factory(
    root.MxWcENV,
    root.MxWcLog,
    root.MxWcTool,
    root.MxWcI18N,
    root.MxWcConfig,
    root.MxWcLink
  );

})(this, function(ENV, Log, T, I18N, MxWcConfig, MxWcLink, undefined) {
  "use strict";

  function renderVersion(){
    T.setHtml(".version", ENV.version);
  }
  function renderExtensionLinks(){
    const names = [
      'setting',
      'history',
      'reset-history',
      'support'
    ]
    const links = names.map((name) => {
      return {
        linkI18n: "page." + name,
        descI18n: "desc." + name,
        href: MxWcLink.get('extPage.' + name)
      }
    });
    renderLinks('#extension-pages > .links', links);
  }

  function renderRemoteLinks() {
    const names = [
      'home',
      'faq',
      'native-app',
      'offline-page',
      'project.index',
      'project.issue',
    ];
    const links = names.map((name) => {
      return {
        linkI18n: "page.remote." + name,
        descI18n: "desc.remote." + name,
        href: MxWcLink.get(name)
      }
    });
    renderLinks('#remote-pages > .links', links);
  }

  function renderLinks(selector, links) {
    const linkTpl = T.findElem('link-tpl').innerHTML;
    const html = links.map((link) => {
      return T.renderTemplate(linkTpl, link);
    }).join('');
    T.setHtml(selector, html);
  }


  function init(){
    renderVersion();
    renderExtensionLinks();
    renderRemoteLinks();
    I18N.i18nPage();
  }

  init();
});
