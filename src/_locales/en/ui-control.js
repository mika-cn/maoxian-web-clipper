(function (root, factory) {
  root.MxWcI18N_en = factory(root);
})(this, function(root, undefined) {
  const currValues = (root.MxWcI18N_en || {}).values || {};
  const values = {
    //=====================================
    // entry(btn & hint)
    //=====================================
    "switch.title": "Switch (hotkey: c)",
    "hint.selecting": "Click or press 'Enter' to select.",
    "hint.selected": "Press 'Enter' to Confirm, Use arrow key to adjust",
    "hint.clipping": "Clipping...",
    "hint.clipped": "Clipped...",

    "hint.saving.started": "Start Save clipping...",
    "hint.saving.progress": "Progress...($finished/$total)",
    "hint.saving.completed": "Completed",

    //help
    "hotkey.help-message": "Help message, click screen to hide it.",
    "hotkey.left.intro": "Expand selection",
    "hotkey.right.intro": "Shrink selection",
    "hotkey.up.intro": "Select forward",
    "hotkey.down.intro": "Select backward",
    "hotkey.esc.intro": "Back to previous step",
    "hotkey.enter.intro": "Confirm selection",
    "hotkey.delete.intro": "Remove selected element",
    "hotkey.scroll.intro": "Click selection to scroll to top/bottom",
    "hotkey.adjust.intro": "Show arrow button",
    "hotkey.back.intro": "Back to previous buttons",
    "hotkey.help.intro": "Show this help messages",

    // form
    "save-format": "Format",
    "title": "Title",
    "category": "Category",
    "tags": "Tags",
    "hint.category": "Subcategory use '/', eg: It/js",
    "hint.tags": "Tag is seperate by space or comma",
  };
  return { values: Object.assign({}, currValues, values) }
});
