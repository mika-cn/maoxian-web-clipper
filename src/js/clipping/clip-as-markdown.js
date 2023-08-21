"use strict";

import T                     from '../lib/tool.js';
import DOMTool               from '../lib/dom-tool.js';
import Log                   from '../lib/log.js';
import Task                  from '../lib/task.js';
import Snapshot              from '../snapshot/snapshot.js';
import SnapshotMaker         from '../snapshot/maker.js';
import SnapshotNodeChange    from '../snapshot/change.js';
import MdPluginCode          from '../lib/md-plugin-code.js';
import MdPluginMathJax       from '../lib/md-plugin-mathjax.js';
import MdPluginKatex         from '../lib/md-plugin-katex.js';
import MdPluginMathML2LaTeX  from '../lib/md-plugin-mathml2latex.js';
import MdPluginTable         from '../lib/md-plugin-table.js';
import MdPluginBlockLink     from '../lib/md-plugin-block-link.js';
import CaptureTool           from '../capturer/tool.js';
import CapturerA             from '../capturer/a.js';
import CapturerImg           from '../capturer/img.js';
import CapturerCanvas        from '../capturer/canvas.js';
import CapturerIframe        from '../capturer/iframe.js';
import CapturerTable         from '../capturer/table.js';

import TurndownService from 'turndown';
import * as TurndownPluginGfm from 'turndown-plugin-gfm';
import myTurndownPluginGfmTables from '../../vendor/my-turndown-plugin-gfm/table.js'

import Mustache from 'mustache';
Mustache.escape = (text) => text;

async function clip(elem, {config, info, storageInfo, i18nLabel, requestParams, pageMetas, frames, win, platform}){
  Log.debug("clip as markdown");

  const snapshot = await takeSnapshot({elem, frames, requestParams, win, platform});

  const {clipId} = info;

  const params = {
    saveFormat   : 'md',
    clipId       : clipId,
    frames       : frames,
    storageInfo  : storageInfo,
    elem         : elem,
    docUrl       : win.location.href,
    baseUrl      : win.document.baseURI,
    config       : config,
    requestParams: requestParams,
    win          : win,
  };

  const tasks = await captureAssets(snapshot, params);

  Log.debug(snapshot);

  const subHtmlHandler = async function({snapshot, subHtml, ancestorDocs}) {
    const r = await CapturerIframe.capture(snapshot, {
      saveFormat: 'md',
      html: subHtml,
      clipId,
      storageInfo,
    });
    tasks.push(...r.tasks);
    return r.change.toObject();
  };

  const elemHTML = await Snapshot.toHTML(snapshot, subHtmlHandler, {
    shadowDomRenderMethod: 'Tree',
  });

  const html = doExtraWork({html: elemHTML, win});

  Log.debug('generateMarkDown');
  let markdown = getTurndownService(config).turndown(html);

  const formulaBlockWrapper = getFormulaBlockWrapper(config.markdownOptionFormulaBlockWrapper);
  markdown = MdPluginMathJax.unEscapeMathJax(markdown, formulaBlockWrapper);
  markdown = MdPluginKatex.unEscapeKatex(markdown, formulaBlockWrapper);
  markdown = MdPluginMathML2LaTeX.unEscapeLaTex(markdown, formulaBlockWrapper);


  const trimFn = function() {
    return function(text, render) {
      return render(text).replace(/^[,，\s]/, '').replace(/[,，\s]*$/, '');
    }
  };

  const elemHasTitle = DOMTool.getElemTitle(win, elem, info.title).length > 0;
  const tObj = T.wrapDate(new Date(info.created_at));
  const view = Object.assign({trimFn}, {
    url: info.link,
    createdAt: info.created_at,
    content: (elemHasTitle ? markdown : `\n# ${info.title}\n\n${markdown}`),
    contentOnly: markdown,
    tagsNKeywords: T.unique(info.tags.concat(pageMetas.metaKeywords)),
  } , info, i18nLabel, pageMetas, tObj.str);
  try {
    markdown = Mustache.render(config.markdownTemplate, view);
  } catch(e) {
    // template may be invalid.
    console.error(e);
  }

  const filename = T.joinPath(storageInfo.mainFileFolder, storageInfo.mainFileName)
  const mainFileTask = Task.createMarkdownTask(filename, markdown, clipId);
  tasks.push(mainFileTask);

  return tasks;
}


async function takeSnapshot({elem, frames, requestParams, win, platform}) {
  const topFrame = frames.find((it) => it.frameId == 0);
  const frameInfo = {allFrames: frames, ancestors: [topFrame]}
  const extMsgType = 'frame.clipAsMd.takeSnapshot';
  const blacklist = {META: true, HEAD: true, LINK: true,
    STYLE: true, SCRIPT: true, TEMPLATE: true};

  let elemSnapshot = await Snapshot.take(elem, {
    frameInfo, requestParams, win, platform, extMsgType,
    blacklist: blacklist,
    shadowDom: {blacklist},
    localFrame: {blacklist},
  });

  Snapshot.appendClassName(elemSnapshot, 'mx-wc-selected');

  return elemSnapshot;
}



async function captureAssets(snapshot, params) {
  const {saveFormat, baseUrl, docUrl, clipId, config, storageInfo} = params;
  const tasks = [];
  const ancestors = [];
  const documentSnapshot = SnapshotMaker.getDocumentNode(docUrl, baseUrl);
  const ancestorDocs = [documentSnapshot];
  const ancestorParams = {ancestors, ancestorDocs};
  const captureFn = async (node, ancestors, ancestorDocs, ancestorRoots) => {
    if (node.change) {
      // processed
      return true;
    }

    const {baseUrl, docUrl} = ancestorDocs[0];
    let requestParams;
    if (ancestorDocs.length == 1) {
      requestParams = params.requestParams;
    } else {
      requestParams = params.requestParams.changeRefUrl(docUrl);
    }

    let r = {change: new SnapshotNodeChange(), tasks: []};
    switch(node.name) {
      case 'IMG':
        r = await CapturerImg.capture(node, { saveFormat,
          baseUrl, storageInfo, clipId, requestParams, config,
        });
        break;

      case 'A':
        r = await CapturerA.capture(node, {baseUrl, docUrl});
        break;

      case 'TABLE':
        r = await CapturerTable.capture(node, {saveFormat});
        break;

      case 'CANVAS':
        r = await CapturerCanvas.capture(node, {
          saveFormat, storageInfo, clipId, requestParams,
        });
        break;

      case 'IFRAME':
      case 'FRAME':
        // Frame's html will be captured when serialization
        break;
    }

    node.change = r.change.toObject();
    tasks.push(...r.tasks);

    return true;
  };

  await Snapshot.eachElement(snapshot, captureFn, ancestorParams);
  return tasks;
}

function doExtraWork({html, win}) {
  const r = DOMTool.parseHTML(win, `<div>${html}</div>`);
  const doc = r.doc;
  let selectedNode = r.node;
  selectedNode = MdPluginCode.handle(doc, selectedNode);
  selectedNode = MdPluginMathJax.handle(doc, selectedNode);
  selectedNode = MdPluginKatex.handle(doc, selectedNode);
  selectedNode = MdPluginMathML2LaTeX.handle(doc, selectedNode);
  selectedNode = MdPluginTable.handle(doc, selectedNode);
  selectedNode = MdPluginBlockLink.handle(doc, selectedNode);

  return selectedNode.outerHTML;
}

function getFormulaBlockWrapper(configValue) {
  switch (configValue) {
    case 'sameLine':
      return ["\n\n$$$", "$$$\n\n"];
    case 'padSameLine':
      return ["\n\n$$$ ", " $$$\n\n"];
    case 'multipleLine':
      return ["\n\n$$$\n", "\n$$$\n\n"];
    case 'mathCodeBlock':
      return ["\n\n```math\n", "\n...\n\n"];
    default:
      return ["\n\n$$$ ", " $$$\n\n"];
  }
}

function getTurndownService(config){

  const turndownOptions = {
    headingStyle       : config.markdownOptionHeadingStyle,
    hr                 : config.markdownOptionHr,
    bulletListMarker   : config.markdownOptionBulletListMarker,
    codeBlockStyle     : config.markdownOptionCodeBlockStyle,
    fence              : config.markdownOptionFence,
    emDelimiter        : config.markdownOptionEmDelimiter,
    strongDelimiter    : config.markdownOptionStrongDelimiter,
    linkStyle          : config.markdownOptionLinkStyle,
    linkReferenceStyle : config.markdownOptionLinkReferenceStyle,
    preformattedCode   : config.markdownOptionPreformattedCode,
  }

  // WARNING : This list should be reconsider very carefully.
  // @see blockElements and meaningfulWhenBlankElements in turndown project.
  const meaningfulWhenBlankBlockElements = [
    'TABLE', 'THEAD', 'TBODY', 'TFOOT', 'TH', 'TD',
    'IFRAME', 'SCRIPT',
    'AUDIO', 'VIDEO',
    'PRE',
  ];


  // most of blank block elements could be safely converted as empty string.
  turndownOptions.blankReplacement = (content, node) => {
    if (node.isBlock) {
      if (meaningfulWhenBlankBlockElements.indexOf(node.nodeName) > -1) {
        return '\n\n';
      } else {
        // in case this blank block element is inside anchor tags "<a>"
        return '';
      }
    } else {
      return '';
    }
  };


  const service = new TurndownService(turndownOptions);

  service.use([
    TurndownPluginGfm.strikethrough,
    TurndownPluginGfm.taskListItems,
    myTurndownPluginGfmTables,
  ]);

  service.addRule('ignoreTag', {
    filter: ['style', 'script', 'noscript', 'noframes', 'canvas', 'template'],
    replacement: function(content, node, options){return ''}
  })

  service.addRule('ignoreWrapper', {
    filter(node, options) {
      // marked element nodes
      return node.nodeType == 1 && node.hasAttribute('data-mx-ignore-me');
    },
    replacement(content, node, options) {
      return content;
    }
  });

  return service;
}

export default {clip};
