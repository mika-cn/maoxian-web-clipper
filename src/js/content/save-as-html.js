  "use strict";

  import T from '../lib/tool.js';
  import DOMTool from '../lib/dom-tool.js';
  import Log from '../lib/log.js';
  import ExtMsg from '../lib/ext-msg.js';
  import Task from '../lib/task.js';
  import Template from '../lib/template.js';
  import CaptureTool from '../capturer/tool.js';
  import CapturerA from '../capturer/a.js';
  import CapturerPicture from '../capturer/picture.js';
  import CapturerImg from '../capturer/img.js';
  import CapturerCss from '../capturer/css.js';
  import CapturerStyle from '../capturer/style.js';
  import CapturerLink from '../capturer/link.js';
  import CapturerIframe from '../capturer/iframe.js';
  import StyleHelper from './style-helper.js';

  /*
   * @param {Object} params
   */
  async function parse(params){
    Log.debug("html parser");
    const {storageInfo, elem, info, config} = params;

    const [mimeTypeDict, frames] = await Promise.all([
      ExtMsg.sendToBackground({type: 'get.mimeTypeDict'}),
      ExtMsg.sendToBackground({type: 'get.allFrames'}),
    ])

    const headerParams = {
      refUrl: window.location.href,
      userAgent: window.navigator.userAgent,
      referrerPolicy: config.requestReferrerPolicy,
    }

    const isBodyElem = elem.tagName.toUpperCase() === 'BODY';


    // 获取选中元素的html
    const {elemHtml, headInnerHtml, tasks} = await getElemHtml({
      clipId: info.clipId,
      frames: frames,
      storageInfo: storageInfo,
      elem: elem,
      docUrl: window.location.href,
      baseUrl: window.document.baseURI,
      mimeTypeDict: mimeTypeDict,
      config: config,
      headerParams: headerParams,
      needFixStyle: !isBodyElem,
    });

    // 将elemHtml 渲染进模板里，渲染成完整网页。
    const v = StyleHelper.getRenderParams(elem);
    const page = (isBodyElem ? 'bodyPage' : 'elemPage');
    v.info = info;
    v.headInnerHtml = headInnerHtml;
    v.elemHtml = elemHtml;
    v.config = config;
    const html = Template[page].render(v);
    const filename = T.joinPath(storageInfo.mainFileFolder, storageInfo.mainFileName)

    const mainFileTask = Task.createHtmlTask(filename, html, info.clipId);
    tasks.push(mainFileTask);

    return Task.changeUrlTask(tasks, (task) => {
      task['headers'] = CaptureTool.getRequestHeaders(
        task.url, headerParams);
      task['timeout'] = config.requestTimeout;
    });
  }

  async function getElemHtml(params){
    const topFrameId = 0, saveFormat = 'html';
    const {
      clipId,
      frames,
      storageInfo,
      elem,
      baseUrl,
      docUrl,
      mimeTypeDict,
      parentFrameId = topFrameId,
      config,
      headerParams,
      needFixStyle,
    } = params;
    Log.debug('getElemHtml', baseUrl);

    const KLASS = ['mx-wc', clipId].join('-');
    elem.classList.add('mx-wc-selected-elem');
    elem.classList.add(KLASS);
    DOMTool.markHiddenNode(window, elem);
    const docHtml = document.documentElement.outerHTML;
    elem.classList.remove('mx-wc-selected-elem');
    elem.classList.remove(KLASS);
    DOMTool.clearHiddenMark(elem);

    const {doc} = DOMTool.parseHTML(window, docHtml);
    let selectedNode = doc.querySelector('.' + KLASS);
    selectedNode.classList.remove(KLASS);
    Log.debug(selectedNode);
    selectedNode = DOMTool.removeNodeByHiddenMark(selectedNode);

    /**
     * @return {:node, :tasks}
     */
    const captureNode = async function (node) {
      let opts = {};
      let r = {node: node, tasks: []}
      switch (node.tagName.toUpperCase()) {
        case 'LINK':
          opts = {baseUrl, docUrl, storageInfo, clipId,
            mimeTypeDict, config, headerParams, needFixStyle};
          r = await CapturerLink.capture(node, opts);
          break;
        case 'STYLE':
          opts = {baseUrl, docUrl, storageInfo, clipId,
            mimeTypeDict, config, headerParams, needFixStyle};
          r = await CapturerStyle.capture(node, opts);
          break;
        case 'PICTURE':
          opts = {baseUrl, storageInfo, clipId, mimeTypeDict};
          r = await CapturerPicture.capture(node, opts);
          break;
        case 'IMG':
          opts = {saveFormat, baseUrl, storageInfo, clipId, mimeTypeDict};
          r = await CapturerImg.capture(node, opts);
          break;
        case 'A':
          opts = {baseUrl, docUrl};
          r = await CapturerA.capture(node, opts);
          break;
        case 'BODY':
        case 'TABLE':
        case 'TH':
        case 'TD':
          // background attribute (deprecated since HTML5)
          opts = {baseUrl, storageInfo, config, clipId, mimeTypeDict};
          r = CaptureTool.captureBackgroundAttr(node, opts);
          break;
        case 'AUDIO':
        case 'VEDIO':
        case 'EMBED':
        case 'OBJECT':
        case 'APPLET':
        case 'CANVAS':
          // Don't capture media nodes.
          node.setAttribute('data-mx-ignore-me', 'true');
          r.node = node;
          break;
        case 'IFRAME':
        case 'FRAME':
          opts = {saveFormat, baseUrl, doc, storageInfo,
            clipId, mimeTypeDict, config, parentFrameId, frames};
          r = await CapturerIframe.capture(node, opts);
          break;
        default: break;
      }

      // handle global attributes
      [].forEach.call(r.node.attributes, async (attr) => {
        const attrName = attr.name.toLowerCase();

        // remove event listener
        if (attrName.startsWith('on')) {
          r.node.removeAttribute(attrName);
        }

        // inline style
        if (attrName === 'style') {
          const {cssText, tasks} = await CapturerCss.captureText(
            Object.assign({
              text: attr.value
            }, {
              baseUrl, docUrl, storageInfo, clipId,
              mimeTypeDict, config, headerParams,
              needFixStyle
            })
          );
          r.node.setAttribute('style', cssText);
          r.tasks.push(...tasks);
        }

      })
      return r;
    }

    const taskCollection = [];
    const headNodes = doc.querySelectorAll('style, link');
    for (let i = 0; i < headNodes.length; i++) {
      const r = await captureNode(headNodes[i]);
      taskCollection.push(...r.tasks);
    }

    const childNodes = selectedNode.querySelectorAll('*');
    for (let i = 0; i < childNodes.length; i++) {
      const node = childNodes[i];
      if (['STYLE', 'LINK'].indexOf(node.tagName.toUpperCase()) > -1) {
        // processed
      } else {
        const r = await captureNode(node);
        taskCollection.push(...r.tasks);
      }
    }

    const r = await captureNode(selectedNode);
    taskCollection.push(...r.tasks);
    selectedNode = r.node;

    const headInnerHtml = [
      getNodesHtml(doc.querySelectorAll('link[rel*=icon]')),
      getNodesHtml(doc.querySelectorAll('link[rel~=stylesheet]')),
      getNodesHtml(doc.querySelectorAll('style')),
    ].join("\n");

    let elemHtml = "";
    if(elem.tagName.toUpperCase() === 'BODY') {
      elemHtml = dealBodyElem(selectedNode, elem);
    } else {
      elemHtml = dealNormalElem(selectedNode, elem);
    }
    return { elemHtml: elemHtml, headInnerHtml: headInnerHtml, tasks: taskCollection};
  }


  function dealBodyElem(node, originalNode) {
    node = removeUselessNode(node);
    return node.outerHTML;
  }

  function dealNormalElem(node, originalNode){
    node.style = StyleHelper.getSelectedNodeStyle(originalNode);
    node = removeUselessNode(node);
    return wrapToBody(originalNode, node.outerHTML);
  }

  function removeUselessNode(contextNode){
    return DOMTool.removeNodeBySelectors(contextNode, [
      'link',
      'style',
      'script',
      'template',
      '*[data-mx-ignore-me="true"]'
    ]);
  }

  /* wrap to body element */
  function wrapToBody(elem, html){
    let pElem = elem.parentElement;
    while(pElem && ['HTML', 'BODY'].indexOf(pElem.tagName.toUpperCase()) == -1){
      const tagName = pElem.tagName

      const attrs = [];
      T.each(pElem.attributes, function(attr){
        if(attr.name !== "style"){
          attrs.push([attr.name, attr.value]);
        }
      });
      attrs.push(['style', StyleHelper.getWrapperStyle(pElem)]);
      const attrHtml = T.map(attrs, function(pair){
        return `${pair[0]}="${pair[1]}"`;
      }).join(' ');
      html = `<${tagName} ${attrHtml}>${html}</${tagName}>`;
      pElem = pElem.parentElement;
    }
    return html;
  }


  function getNodesHtml(nodes) {
    const outerHtmls = [];
    [].forEach.call(nodes, (node) => {
      if (!node.hasAttribute('data-mx-ignore-me')) {
        outerHtmls.push(node.outerHTML);
      }
    });

    return outerHtmls.length === 0 ? '' : ['', ...outerHtmls, ''].join('\n');
  }

  const Html = {
    parse: parse,
    getElemHtml: getElemHtml
  }

  export default Html;
