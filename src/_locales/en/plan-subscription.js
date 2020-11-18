(function (root, factory) {
  root.MxWcI18N_en = factory(root);
})(this, function(root, undefined) {
  const currValues = (root.MxWcI18N_en || {}).values || {};
  const values = {
    "page-title": "Subscription detail",
    "title.subscription": "Base Information",
    "title.plans": "Plans",
    "subscription.name": "Name",
    "subscription.version": "Version",
    "subscription.size": "Size",
    "subscription.url": "Url",
  };
  return { values: Object.assign({}, currValues, values) }
});
