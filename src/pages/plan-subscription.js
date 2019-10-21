;(function(root, factory) {
  factory(
    root.MxWcENV,
    root.MxWcTool,
    root.MxWcI18N,
    root.MxWcStorage,
  );
})(this, function(ENV, T, I18N, Storage){
  "use strict";

  async function init() {
    const currUrl = new URL(window.location.href);
    const t = currUrl.searchParams.get('t');
    if (t) {
      const url = atob(t);
      const subscriptions = await Storage.get('assistant.public-plan.subscriptions');
      const subscription = subscriptions.find((it) => {
        return it.url === url;
      });
      if (subscription) {
        renderSubscription(subscription);
        const key = [
          'assistant.public-plan',
          subscription.name,
          'text'
        ].join('.');
        const text = await Storage.get(key);
        renderPlans(text);
      } else {
        // illegal url
      }
    } else {
      // illegal url
    }
  }

  function renderSubscription(it) {
    const elem = T.findElem('subscription');
    const tpl = T.findElem('subscription-tpl').innerHTML;
    const html = T.renderTemplate(tpl, {
      name: it.name,
      version: it.latestVersion,
      size: it.size,
      url: it.url
    });
    T.setHtml(elem, html);
  }

  function renderPlans(text) {
    const elem = T.findElem('plans-text');
    elem.textContent = text;
  }

  init();
  I18N.i18nPage();
});
