const H = require('./helper.js');
const DOMTool = H.depJs('lib/dom-tool.js');

const Log         = H.depJs('lib/log.js');
const Tool        = H.depJs('lib/tool.js');
const Asset       = H.depJs('lib/asset.js');
const Task        = H.depJs('lib/task.js');
const Template    = H.depJs('lib/template.js');
const ExtMsg      = H.depMockJs('ext-msg.js');

const CapturerFactory = H.depJs('capturer/iframe.js');


describe("Capture iframe", async () => {

  function getParams() {
    return {
      parentFrameId: 0,
      baseUrl: 'https://a.org/index.html',
      clipId: '001',
      saveFormat: 'html',
      storageInfo: {
        saveFolder: 'category-a/clipping-001',
      },
      frames: [
        {parentFrameId: 0, frameId: 1, url: 'https://a.org/frame-A.html'}
      ],
      config: {},
    }
  }

  it('capture srcdoc', async () => {
    const html = `<iframe srcdoc="<body>TEXT</body>"></iframe>`;
    const {node} = DOMTool.parseHTML(html);
    const params = getParams();
    const Capturer = CapturerFactory(Log, Tool, ExtMsg, Asset, Task, Template);
    const r = await Capturer.capture(node, params);
    H.assertEqual(r.tasks.length, 0);
    H.assertTrue(r.node.hasAttribute('data-mx-warn'));
  })

  async function captureInvalidIframeUrl(html) {
    const {doc, node} = DOMTool.parseHTML(html);
    const params = getParams();
    params.doc = doc;
    const Capturer = CapturerFactory(Log, Tool, ExtMsg, Asset, Task, Template);
    const r = await Capturer.capture(node, params);
    H.assertTrue(r.node.hasAttribute('data-mx-warn'));
    H.assertTrue(r.node.hasAttribute('data-mx-original-src'));
  }

  it('capture empty url', async () => {
    const html = `<iframe></iframe>`;
    await captureInvalidIframeUrl(html);
  });

  it('capture invalid iframe url', async () => {
    const html = `<iframe src="https://:invalid.org/iframe.html"></iframe>`;
    await captureInvalidIframeUrl(html);
  });

  it('capture web extension iframe', async () => {
    const url = 'moz-extension://klasdfbwerssdfasdf/iframe.html';
    const html = `<iframe src="${url}"></iframe>`;
    const {doc, node} = DOMTool.parseHTML(html);
    const params = getParams();
    params.doc = doc;
    const Capturer = CapturerFactory(Log, Tool, ExtMsg, Asset, Task, Template);
    const r = await Capturer.capture(node, params);
    H.assertEqual(r.tasks.length, 0);
    H.assertTrue(r.node.hasAttribute('data-mx-ignore-me'));
  })

  it('capture iframe that load failed', async() => {
    // imitate ExtMsg.sendToTab
    ExtMsg.mockFrameToHtmlStatic(undefined);
    const url = 'https://a.org/frame-A.html';
    const html = `<iframe src="${url}"></iframe>`;
    const {node} = DOMTool.parseHTML(html);
    const params = getParams();
    const Capturer = CapturerFactory(Log, Tool, ExtMsg, Asset, Task, Template);
    const r = await Capturer.capture(node, params);
    ExtMsg.clearMocks();
    H.assertEqual(r.tasks.length, 0);
    H.assertTrue(r.node.hasAttribute('data-mx-warn'));
    H.assertTrue(r.node.hasAttribute('data-mx-original-src'));
  });

  it('capture normal iframe - html', async () => {
    const frameHtml = '<framecontent></framecontent>';
    const url = 'https://a.org/frame-A.html';
    const html = `<iframe src="${url}" referrerpolicy="same-origin"></iframe>`;
    ExtMsg.mockFrameMsgUrls('frame.toHtml', {
      [url]: {
        title: 'frame title',
        elemHtml: frameHtml,
        tasks: []
      }
    });
    const {node} = DOMTool.parseHTML(html);
    const params = getParams();
    const Capturer = CapturerFactory(Log, Tool, ExtMsg, Asset, Task, Template);
    let r = await Capturer.capture(node, params);
    H.assertEqual(r.tasks.length, 1);
    H.assertFalse(r.node.hasAttribute('referrerpolicy'));

    // capture same frame html again
    const {node: nodeB} = DOMTool.parseHTML(html);
    r = await Capturer.capture(nodeB, params);
    H.assertEqual(r.tasks.length, 0);
    H.assertMatch(r.node.getAttribute('src'), /[^\/^.].frame.html/);
    ExtMsg.clearMocks();
  });

  it('capture normal iframe - markdown', async () => {
    const frameHtml = '<framecontent></framecontent>';
    const url = 'https://a.org/frame-A.html';
    const html = `<iframe src="${url}" ></iframe>`;
    ExtMsg.mockFrameMsgUrls('frame.toMd', {
      [url]: {
        title: 'frame title',
        elemHtml: frameHtml,
        tasks: []
      }
    });
    const {doc, node} = DOMTool.parseHTML(html);
    const params = getParams();
    params.doc = doc;
    params.saveFormat = 'md';
    const Capturer = CapturerFactory(Log, Tool, ExtMsg, Asset, Task, Template);
    let r = await Capturer.capture(node, params);
    console.log(r.node.outerHTML);
    H.assertEqual(r.tasks.length, 0);
    H.assertNotEqual(r.node.tagName, 'IFRAME');
    H.assertEqual(r.node.innerHTML, frameHtml);

    // capture same frame html again
    const {node: nodeB} = DOMTool.parseHTML(html);
    r = await Capturer.capture(nodeB, params);
    H.assertEqual(r.tasks.length, 0);
    H.assertNotEqual(r.node.tagName, 'IFRAME');
    H.assertEqual(r.node.innerHTML, frameHtml);
    ExtMsg.clearMocks();
  });


})
