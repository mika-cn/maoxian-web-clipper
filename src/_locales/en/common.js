(function (root, factory) {
  root.MxWcI18N_en = factory(root);
})(this, function(root, undefined) {
  const currValues = (root.MxWcI18N_en || {}).values || {};
  const values = {
    // clipping attributes
    "g.clipping.title": "Title",
    "g.clipping.path": "Path",
    "g.clipping.time": "Time",
    "g.clipping.category": "Category",
    "g.clipping.tag": "Tag",
    "g.clipping.tags": "Tags",
    "g.clipping.format": "Format",
    "g.clipping.original-url": "Original Url",
    "g.clipping.created-at": "Created At",

    // task attributes
    "g.task.clipId": "Clipping ID",
    "g.task.clip-id": "Clipping ID",
    "g.task.filename": "Filename",
    "g.task.timeout": "Timeout",
    "g.task.tries": "Maximum Tries",
    "g.task.createdAt": "Created Time",
    "g.task.filenameAndUrl": "Filename and Url",

    // button labels
    "g.btn.save": "Save",
    "g.btn.confirm": "Confirm",
    "g.btn.delete": "Delete",
    "g.btn.cancel": "Cancel",

    // labels
    "g.label.none": "None",
    "g.label.access": "Access",
    "g.label.warning": "Warning",

    // hints
    "g.hint.no-record": "No records",
    "g.hint.saved": "Saved!",
    "g.hint.update-success": "Update Success!",
    "g.hint.delete-success": "Delete Success!",

    // option values
    "g.option-value.html": "HTML",
    "g.option-value.md": "Markdown",

    // errors
    "g.error.value-invalid": "Value invalid",
    "g.error.not-a-number": "Input value is not a number",
    "g.error.not-in-allowed-range": "Input value is not in allowed range",

    "g.error.handler.not-enabled": "Handler is disabled",
    "g.error.handler.not-ready": "Handler is not ready",
    "g.error.handler.native-app.version": "Extension require the version of Native Application bigger than or equal to $requiredVersion, But current version is $currentVersion, please <a href='go.page:native-app#upgrade' target='_blank'>upgrade your native application</a>",
    "g.error.handler.native-app.install": "It seems like you haven't installed it correctly. (<a href='go.page:native-app' target='_blank'>How to install it</a>)",

  };
  return { values: Object.assign({}, currValues, values) }
});
