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

  it('capture invalid iframe url', async () => {
    const url = 'https://:invalid.org/iframe.html';
    const html = `<iframe src="${url}"></iframe>`;
    const {node} = DOMTool.parseHTML(html);
    const parentNode = node.parentNode;
    const params = getParams();
    const Capturer = CapturerFactory(Log, Tool, ExtMsg, Asset, Task, Template);
    const tasks = await Capturer.capture(node, params);
    const newNode = parentNode.children[0]
    H.assertTrue(newNode.hasAttribute('data-mx-warn'));
    H.assertTrue(newNode.hasAttribute('data-mx-original-src'));
  });

  it('capture web extension iframe', async () => {
    const url = 'moz-extension://klasdfbwerssdfasdf/iframe.html';
    const html = `<iframe src="${url}"></iframe>`;
    const {node} = DOMTool.parseHTML(html);
    const parentNode = node.parentNode;
    const params = getParams();
    const Capturer = CapturerFactory(Log, Tool, ExtMsg, Asset, Task, Template);
    const tasks = await Capturer.capture(node, params);
    H.assertEqual(tasks.length, 0);
    H.assertEqual(parentNode.children.length, 0);
  })

  it('capture iframe that load failed', async() => {
    ExtMsg.mock('frame.toHtml', () => {
      // imitate ExtMsg.sendToTab
      return Promise.resolve(undefined);
    });
    const url = 'https://a.org/frame-A.html';
    const html = `<iframe src="${url}"></iframe>`;
    const {node} = DOMTool.parseHTML(html);
    const parentNode = node.parentNode;
    const params = getParams();
    const Capturer = CapturerFactory(Log, Tool, ExtMsg, Asset, Task, Template);
    const tasks = await Capturer.capture(node, params);
    ExtMsg.clearMocks();
    H.assertEqual(tasks.length, 0);
    const newNode = parentNode.children[0];
    H.assertTrue(newNode.hasAttribute('data-mx-warn'));
    H.assertTrue(newNode.hasAttribute('data-mx-original-src'));
  });

  it('capture normal iframe - html', async () => {
    const frameHtml = '<framecontent></framecontent>';
    ExtMsg.mock('frame.toHtml', () => {
      return Promise.resolve({
        title: 'frame title',
        elemHtml: frameHtml,
        tasks: []
      });
    });
    const url = 'https://a.org/frame-A.html';
    const html = `<iframe src="${url}" referrerpolicy="same-origin"></iframe>`;
    const {node} = DOMTool.parseHTML(html);
    const params = getParams();
    const Capturer = CapturerFactory(Log, Tool, ExtMsg, Asset, Task, Template);
    const tasks = await Capturer.capture(node, params);
    H.assertEqual(tasks.length, 1);
    H.assertFalse(node.hasAttribute('referrerpolicy'));

    // capture same frame html again
    const {node: nodeB} = DOMTool.parseHTML(html);
    const tasksB = await Capturer.capture(nodeB, params);
    H.assertEqual(tasksB.length, 0);
    H.assertMatch(node.getAttribute('src'), /[^\/^.].frame.html/);
    ExtMsg.clearMocks();
  });

  it('capture normal iframe - markdown', async () => {
    const frameHtml = '<framecontent></framecontent>';
    ExtMsg.mock('frame.toMd', () => {
      return Promise.resolve({
        title: 'frame title',
        elemHtml: frameHtml,
        tasks: []
      });
    });
    const url = 'https://a.org/frame-A.html';
    const html = `<iframe src="${url}" ></iframe>`;
    const {node} = DOMTool.parseHTML(html);
    const parentNode = node.parentNode;
    const params = getParams();
    params.saveFormat = 'md';
    const Capturer = CapturerFactory(Log, Tool, ExtMsg, Asset, Task, Template);
    const tasks = await Capturer.capture(node, params);
    H.assertEqual(tasks.length, 0);
    const newNode = parentNode.children[0];
    H.assertNotEqual(newNode.tagName, 'IFRAME');
    H.assertEqual(newNode.innerHTML, frameHtml);

    // capture same frame html again
    const {node: nodeB} = DOMTool.parseHTML(html);
    const parentNodeB = nodeB.parentNode;
    const tasksB = await Capturer.capture(nodeB, params);
    H.assertEqual(tasksB.length, 0);
    const newNodeB = parentNodeB.children[0];
    //FIXME
    H.assertNotEqual(newNodeB.tagName, 'IFRAME');
    H.assertEqual(newNodeB.innerHTML, frameHtml);
    ExtMsg.clearMocks();
  });


})
