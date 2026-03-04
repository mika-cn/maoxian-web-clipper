"use strict";
(function (root, factory) {
  window.FrameTool = factory(root, root.browser)
})(this, function(root, ExtApi) {
  async function getId(frameWindow) {
    const frameId = ExtApi.runtime.getFrameId(frameWindow)
    return Promise.resolve(frameId);
  }

  return {getId};
});
