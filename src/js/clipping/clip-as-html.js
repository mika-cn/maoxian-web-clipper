"use strict";

import {TREE_TYPE}  from '../lib/constants.js';
import T                     from '../lib/tool.js';
import DOMTool               from '../lib/dom-tool.js';
import Log                   from '../lib/log.js';
import Task                  from '../lib/task.js';
import SVG                   from '../lib/svg.js';
import Snapshot              from '../snapshot/snapshot.js';
import SnapshotMaker         from '../snapshot/maker.js';
import SnapshotNodeChange    from '../snapshot/change.js';
import CaptureTool           from '../capturer/tool.js';
import CapturerA             from '../capturer/a.js';
import CapturerPicture       from '../capturer/picture.js';
import CapturerImg           from '../capturer/img.js';
import CapturerAudio         from '../capturer/audio.js';
import CapturerVideo         from '../capturer/video.js';
import CapturerStyle         from '../capturer/style.js';
import CapturerLink          from '../capturer/link.js';
import CapturerCanvas        from '../capturer/canvas.js';
import CapturerIframe        from '../capturer/iframe.js';
import CapturerEmbed         from '../capturer/embed.js';
import CapturerObject        from '../capturer/object.js';
import CapturerApplet        from '../capturer/applet.js';
import CapturerStyleSheet    from '../capturer/stylesheet.js';

import CapturerSvg           from '../capturer-svg/svg.js';
import CapturerSvgA          from '../capturer-svg/a.js';
import CapturerSvgImage      from '../capturer-svg/image.js';
import CapturerMxSvgImg      from '../capturer-svg/mx-svg-img.js';

import StyleHelper           from './style-helper.js';


async function clip(elem, {config, info, storageInfo, i18nLabel, requestParams, pageMetas, frames, win, platform}) {
  Log.debug("html parser");

  const {clipId} = info;

  const calculatedStyle = StyleHelper.calcStyle(elem, win);

  if (config.htmlCustomBodyBgCssEnabled && config.htmlCustomBodyBgCssValue){
    calculatedStyle.bodyStyleObj['background-color'] = `${config.htmlCustomBodyBgCssValue} !important`;
  }

  const v = Object.assign({info, config}, calculatedStyle, i18nLabel, pageMetas)

  const snapshot = await takeSnapshot({elem, frames, requestParams, win, platform, v});

  const params = {
    saveFormat   : 'html',
    clipId       : clipId,
    frames       : frames,
    storageInfo  : storageInfo,
    elem         : elem,
    docUrl       : win.location.href,
    baseUrl      : win.document.baseURI,
    config       : config,
    requestParams : requestParams,
    win          : win,
    v: v,
  };

  const tasks = await captureAssets(snapshot, Object.assign({}, params, {
    needFixStyle: (elem.tagName.toUpperCase() !== 'BODY')
  }));
  Log.debug(snapshot);

  const iframeStorageInfo = Object.assign({}, params.storageInfo, {
    mainFileFolder: params.storageInfo.frameFileFolder,
  });

  const subHtmlHandler = {};
  subHtmlHandler.iframe = async function({snapshot, subHtml, ancestorDocs}) {
    const r = await CapturerIframe.capture(snapshot, {
      saveFormat: 'html',
      html: subHtml,
      clipId,
      storageInfo: (ancestorDocs.length > 1 ? iframeStorageInfo : storageInfo),
    });
    tasks.push(...r.tasks);
    return r.change.toObject();
  };

  subHtmlHandler.mxSvgImg = async function({snapshot, subHtml, ancestorDocs}) {
    const r = await CapturerMxSvgImg.capture(snapshot, {
      xml: subHtml,
      clipId,
      storageInfo: (ancestorDocs.length > 1 ? iframeStorageInfo : storageInfo),
    });
    tasks.push(...r.tasks);
    return r.change.toObject();
  }

  const html = await Snapshot.toHTML(snapshot, subHtmlHandler);

  const filename = T.joinPath(storageInfo.mainFileFolder, storageInfo.mainFileName)
  const mainFileTask = Task.createHtmlTask(filename, html, clipId);
  tasks.push(mainFileTask);

  return tasks;
}


async function takeSnapshot({elem, frames, requestParams, win, platform, v}) {
  const topFrame = frames.find((it) => it.frameId == 0);
  const frameInfo = {allFrames: frames, ancestors: [topFrame]}
  const extMsgType = 'frame.clipAsHtml.takeSnapshot';

  const removeUnusedRules = (v.config.htmlCaptureCssRules === 'saveUsed');
  const cssBox = Snapshot.createCssBox({removeUnusedRules, node: elem});

  const domParams_html = {
    frameInfo, extMsgType, cssBox,
    blacklist: {SCRIPT: true, LINK: true, STYLE: true, TEMPLATE: true},
  }

  const domParams            = Object.assign({}, domParams_html);
  const domParams_localFrame = Object.assign({}, domParams_html, {blacklist: {SCRIPT: true, TEMPLATE: true}});
  const domParams_shadow     = Object.assign({}, domParams_html, {blacklist: {SCRIPT: true, TEMPLATE: true}});
  const domParams_svg = {blacklist: {
    SCRIPT  : true,
    LINK    : true,
    PICTURE : true,
    CANVAS  : true,
    AUDIO   : true,
    VIDEO   : true,
    FRAME   : true,
    IFRAME  : true,
    OBJECT  : true,
    EMBED   : true,
    APPLET  : true,
  }};

  let elemSnapshot = await Snapshot.take(elem, {
    win, requestParams, platform,
    domParams,
    domParams_html,
    domParams_localFrame,
    domParams_shadow,
    domParams_svg,
  });

  Snapshot.appendClassName(elemSnapshot, 'mx-wc-selected');

  const headNodes = getHeadNodesOfHtmlDom(win);

  const headChildrenSnapshots = [];
  const domParams_style = Object.assign({}, domParams_html, {blacklist: {}});
  for (const node of headNodes) {
    headChildrenSnapshots.push(await Snapshot.take(node, {
      win, requestParams, platform,
      domParams: domParams_style,
    }));
  }

  // FIXME
  // If we have saved global defined elements inside each svg
  // we actually don't need to save these global svgs.
  const globalDefinedSVGNodes = SVG.getGlobalDefinedElements();
  const globalDefinedSVGSnapshots = [];
  for (const node of globalDefinedSVGNodes) {
    globalDefinedSVGSnapshots.push(await Snapshot.take(node, {
      win, requestParams, platform,
      domParams: {frameInfo, extMsgType, cssBox, ignoreHiddenElement: false}
    }));
  }

  const clippingInfoSnapshot = getClippingInformationSnapshot(v);
  const svgWrapperSnapshot = SnapshotMaker.getSvgSnapshotsWrapper(globalDefinedSVGSnapshots);

  const tailSnapshots = [clippingInfoSnapshot, svgWrapperSnapshot];

  if (elemSnapshot.name == 'BODY') {
    const clippingInfoCssRules = getClippingInformationCssRules(v.config);
    if (clippingInfoCssRules.length > 0) {
      headChildrenSnapshots.push(
        SnapshotMaker.getStyleNode({'class': 'mx-wc-style'}, clippingInfoCssRules)
      );
    }
    elemSnapshot.childNodes.push(...tailSnapshots);
    Snapshot.appendStyleObj(elemSnapshot, v.bodyStyleObj);

  } else {

    headChildrenSnapshots.push(getWrapperNodeStyleSnapshot(v));
    Snapshot.appendStyleObj(elemSnapshot, StyleHelper.getSelectedNodeStyle(elem, win));
    elemSnapshot = wrapOutermostElem(elem, elemSnapshot, tailSnapshots);
  }

  const headSnapshot = SnapshotMaker.getHeadNode([
    SnapshotMaker.getCharsetMeta(),
    SnapshotMaker.getViewportMeta(),
    SnapshotMaker.getTitleNode(v.info.title || win.document.title),
  ].concat(headChildrenSnapshots));

  const commentSnapshot = SnapshotMaker.getCommentNode(`OriginalSrc: ${v.info.link}`);

  const currLayerSnapshots = [elemSnapshot];
  if (elemSnapshot.name == 'BODY') {
    currLayerSnapshots.unshift(headSnapshot);
    currLayerSnapshots.unshift(commentSnapshot);
  }

  const result = Snapshot.takeAncestorsSnapshot(
    elem, currLayerSnapshots, cssBox, (ancestorNode, ancestorSnapshot) => {

      if (ancestorSnapshot.name == 'HTML') {

        Snapshot.appendStyleObj(ancestorSnapshot, v.htmlStyleObj);
        return [SnapshotMaker.getDocTypeNode(), ancestorSnapshot];

      } else if (ancestorSnapshot.name == 'BODY') {

        Snapshot.appendStyleObj(ancestorSnapshot, v.bodyStyleObj);
        return [
          commentSnapshot,
          headSnapshot,
          ancestorSnapshot,
        ];

      } else {
        // All the ancestor nodes that between the selected node
        // and the body node are wrapper nodes.

        const styleObj = StyleHelper.getWrapperStyleObj(ancestorSnapshot);
        if (styleObj) {
          Snapshot.appendStyleObj(ancestorSnapshot, styleObj);
        }
        ancestorSnapshot = wrapOutermostElem(ancestorNode, ancestorSnapshot, tailSnapshots);
        return [ancestorSnapshot];
      }
    });

  // assign styleScope to it's snapshot.
  result.cssBox.finalize();

  return await addShadowDomLoader2snapshot(result.snapshot);
}


function getHeadNodesOfHtmlDom(win) {
  const nodes = win.document.querySelectorAll(
    'link[rel*=icon],link[rel~=stylesheet],style');
  const r = [];
  for (const node of nodes) {
    if (node.closest('svg')) {
      // shouldn't hanle svg styles
    } else {
      r.push(node)
    }
  }
  return r;
}


function wrapOutermostElem(elem, snapshot, tailSnapshots) {
  const isOutermost = elem.parentNode && elem.parentNode.nodeName.toUpperCase() === 'BODY';
  if (isOutermost) {
    const wrapper = SnapshotMaker.getElementNode('DIV',
      {class: 'mx-wc-main'}, [snapshot, ...tailSnapshots]);
    return wrapper;
  } else {
    return snapshot;
  }
}


async function captureAssets(snapshot, params) {
  const {saveFormat, baseUrl, docUrl, clipId, config, needFixStyle} = params;

  const iframeStorageInfo = Object.assign({}, params.storageInfo, {
    mainFileFolder: params.storageInfo.frameFileFolder,
  });

  const tasks = [];

  const captureFn = async (node, {treeType = TREE_TYPE.HTML, ancestors, ancestorDocs, ancestorRoots}) => {

    if (node.change) {
      // processed
      return true;
    }

    const {baseUrl, docUrl} = ancestorDocs[0];
    if (baseUrl == undefined) {
      console.log(ancestorDocs[0])
    }

    let storageInfo, requestParams;
    if (ancestorDocs.length == 1) {
      storageInfo = params.storageInfo;
      requestParams = params.requestParams;
    } else {
      storageInfo = iframeStorageInfo;
      requestParams = params.requestParams.changeRefUrl(docUrl);
    }

    // result {change, tasks}
    let r;

    switch(treeType) {
      case TREE_TYPE.HTML: {
        r = await captureNodeAsset_HTML(node, {saveFormat, baseUrl, docUrl,
          storageInfo, clipId, config, requestParams, needFixStyle, ancestorRoots});
        break;
      }
      case TREE_TYPE.SVG: {
        r = await captureNodeAsset_SVG(node, {saveFormat, baseUrl, docUrl,
          storageInfo, clipId, config, requestParams, ancestorRoots});
        break;
      }
      default: break;
    }

    // handle attributes
    for (let attrName in node.attr) {
      // remove event listener
      if (attrName.startsWith('on')) {
        r.change.rmAttr(attrName);
      }
    }


    // handle inline style (styleObj)
    let inlineStyle = "";

    if (node.styleObj) {
      const params = Object.assign({ownerType: 'styleAttr', docBaseUrl: baseUrl}, {
        baseUrl, storageInfo, clipId,
        config, requestParams
      });

      const {cssText, tasks} = await CapturerStyleSheet.captureStyleObj(node.styleObj, params);
      r.tasks.push(...tasks);
      inlineStyle = cssText;
    }


    const changeObj = r.change.toObject();
    const styleParts = [];
    const changedStyle = T.styleObj2Str(changeObj.styleObj);

    if (inlineStyle != '')  {styleParts.push(inlineStyle)}
    if (changedStyle != '') {styleParts.push(changedStyle)}


    if (styleParts.length > 0) {
      changeObj.attr.style = styleParts.join(';');
    }

    node.change = changeObj;
    tasks.push(...r.tasks);

    return true;
  }

  await Snapshot.eachElement(snapshot, captureFn);
  return tasks;
}


/*
 * @return {Object} result {change, tasks}
 */
async function captureNodeAsset_SVG(node, params) {
  const {saveFormat, baseUrl, docUrl, clipId,
    storageInfo, requestParams, config} = params;
  let r = {change: new SnapshotNodeChange(), tasks: []};

  const upperCasedNodeName = node.name.toUpperCase();
  switch(upperCasedNodeName) {
    case 'A': {
      r = await CapturerSvgA.capture(node, {baseUrl, docUrl});
      break;
    }
    case 'IMAGE': {
      r = await CapturerSvgImage.capture(node, {saveFormat, baseUrl, clipId,
        storageInfo, requestParams, config});
      break;
    }
    case 'SVG': {
      r = await CapturerSvg.capture(node, {});
      break;
    }
    default: break;
  }
  return r;
}


/*
 * @return {Object} result {change, tasks}
 */
async function captureNodeAsset_HTML(node, params) {
  const {saveFormat, baseUrl, docUrl, storageInfo,
    clipId, config, requestParams, needFixStyle, ancestorRoots} = params;
  let r = {change: new SnapshotNodeChange(), tasks: []};

  const upperCasedNodeName = node.name.toUpperCase();
  switch(upperCasedNodeName) {
    case 'LINK': {
      const cssParams = Object.assign({needFixStyle}, ancestorRoots[0].styleScope);
      r = await CapturerLink.capture(node, {
        baseUrl, storageInfo, clipId,
        config, requestParams, cssParams,
      });
      break;
    }

    case 'STYLE': {
      const cssParams = Object.assign({needFixStyle}, ancestorRoots[0].styleScope);
      r = await CapturerStyle.capture(node, {
        baseUrl, storageInfo, clipId,
        config, requestParams, cssParams,
      });
      break;
    }

    case 'PICTURE': {
      r = await CapturerPicture.capture(node, {
        baseUrl, storageInfo, clipId, requestParams, config,
      });
      break;
    }

    case 'IMG': {
      r = await CapturerImg.capture(node, { saveFormat,
        baseUrl, storageInfo, clipId, requestParams, config,
      });
      break;
    }

    case 'A':
    case 'AREA': {
      r = await CapturerA.capture(node, {baseUrl, docUrl});
      break;
    }

    case 'BODY':
    case 'TABLE':
    case 'TH':
    case 'TD': {
      // background attribute (deprecated since HTML5)
      r = await CaptureTool.captureBackgroundAttr(node, {
        baseUrl, storageInfo, config, clipId, requestParams,
      });
      break;
    }

    case 'AUDIO': {
      r = await CapturerAudio.capture(node, {
        baseUrl, storageInfo, clipId, requestParams, config,
      });
      break;
    }

    case 'VIDEO': {
      r = await CapturerVideo.capture(node, {
        baseUrl, storageInfo, clipId, requestParams, config,
      });
      break;
    }

    case 'EMBED': {
      r = await CapturerEmbed.capture(node, {
        baseUrl, storageInfo, clipId, requestParams, config,
      });
      break;
    }

    case 'OBJECT': {
      r = await CapturerObject.capture(node, {
        baseUrl, storageInfo, clipId, requestParams, config,
      });
      break;
    }

    case 'APPLET': {
      r = await CapturerApplet.capture(node, {
        baseUrl, storageInfo, clipId, requestParams, config,
      });
      break;
    }

    case 'CANVAS': {
      r = await CapturerCanvas.capture(node, {
        saveFormat, storageInfo, clipId, requestParams,
      });
      break;
    }
    default: break;
  }

  return r;
}


function getWrapperNodeStyleSnapshot(v) {
  return SnapshotMaker.getStyleNode(
    {'class': 'mx-wc-style'},
    getWrapperNodeCssRules(v)
  );
}

function getWrapperNodeCssRules(v) {
  // Because the wrapper div could be styled by page stylesheets.
  // It could have the value "border-box" as box-sizing, and we want to
  // add padding to the wrapper, so if we don't add padding to
  // the max width, the rest width to the selected element would
  // be not enough (it's value will be v.elemWidth - 2 * wrapperPadding)
  //
  // We add padding to max-width to avoid overflow.
  const wrapperMaxWidth  = v.elemWidth + 2 * 15;
  const wrapperMinHeight = v.elemHeight;

  const rules = [
    SnapshotMaker.getCssStyleRule('body',
      StyleHelper.setImportantPriority({
        'padding-top': '20px',
      })
    ),

    // Using relative position and z-index
    // we create a stacking context to avoid
    // the negative layers become invisible
    // because of the wrapper has a background-color.
    SnapshotMaker.getCssStyleRule('.mx-wc-main',
      StyleHelper.setImportantPriority({
        'position'         : 'relative',
        'z-index'          : '0',
        'background-color' : v.outerElemBgCss,
        'margin'           : '0 auto',
        'max-width'        : `${wrapperMaxWidth}px`,
        'min-height'       : `${wrapperMinHeight}px`,
      })
    ),

    SnapshotMaker.getCssStyleRule('.mx-wc-main img',
      StyleHelper.setImportantPriority({
        'max-width': '100%',
      })
    ),

    SnapshotMaker.getCssMediaRule('(min-width: 768px)', [
      SnapshotMaker.getCssStyleRule('.mx-wc-main',
        StyleHelper.setImportantPriority({
          'padding': '15px 15px 80px 15px'
        })
      )
    ]),
    SnapshotMaker.getCssMediaRule('(max-width: 768px)', [
      SnapshotMaker.getCssStyleRule('.mx-wc-main',
        StyleHelper.setImportantPriority({
          'padding': '15px 3px 80px 3px'
        })
      )
    ]),
  ];

  return rules.concat(getClippingInformationCssRules(v.config));
}



async function addShadowDomLoader2snapshot(snapshot) {
  const added = new Map();
  await Snapshot.eachElement(snapshot, (node, {ancestors, ancestorDocs}) => {
    if (node.isShadowHost && ancestorDocs[0]) {
      const doc = ancestorDocs[0];
      if (added.get(doc)) {
        // added
      } else {
        const namePath = ['HTML', 'BODY'];
        // FIXME xhtml?
        Snapshot.accessNode(doc, namePath, (bodyNode) => {
          bodyNode.childNodes.push(SnapshotMaker.getShadowDomLoader());
        });
        added.set(doc, true);
      }
    }
    return true;
  });

  return snapshot;
}

// =============================================
// clipping information (metas)
// =============================================


function getClippingInformationCssRules(config) {
  if (config.htmlSaveClippingInformation) {
    return [
      SnapshotMaker.getCssStyleRule('.clipping-information',
        StyleHelper.setImportantPriority({
          'text-align'       : 'left',
          'margin-top'       : '20px',
          'background-color' : '#eeeeee',
          'padding'          : '15px',
          'border-radius'    : '4px',
          'color'            : '#333',
          'font-size'        : '14px',
          'line-height'      : '22px',
          'min-height'       : '50px',
          'height'           : 'auto',
        })
      ),

      SnapshotMaker.getCssStyleRule('.clipping-information a',
        StyleHelper.setImportantPriority({
          'color'           : 'blue',
          'text-decoration' : 'underline',
        })
      ),


      SnapshotMaker.getCssStyleRule('.clipping-information label',
        StyleHelper.setImportantPriority({
          'font-weight'    : 'normal',
          'display'        : 'inline',
          'text-transform' : 'none',
        })
      ),

      SnapshotMaker.getCssStyleRule('.clipping-information label > code',
        StyleHelper.setImportantPriority({
          'color'            : '#333',
          'padding'          : '2px 8px',
          'background-color' : 'rgba(200, 200, 200, 0.7)',
          'font-size'        : '14px',
        })
      ),
    ];
  } else {
    return [];
  }
}

/*
 * @param {Object} v value object
 * - {Object} info ~ clipping info
 * - {Object} config
 * - {String} i18n_* ~ translated string
 *
 * @return {Snapshot} it
 */
function getClippingInformationSnapshot(v) {
  let html = '';
  if(v.config.htmlSaveClippingInformation){
    let tagHtml = v.i18n_none;
    if(v.info.tags.length > 0) {
      tagHtml = T.map(v.info.tags, function(tag) {
        return "<code>" + tag + "</code>";
      }).join(", ");
    }
    let categoryHtml = v.i18n_none;
    if(v.info.category){
      categoryHtml = v.info.category;
    }
    html = `
      <hr />
      <!-- clipping information -->
      <div class="clipping-information">
        <label>${v.i18n_original_url}: <a href="${v.info.link}" target="_blank" referrerpolicy="no-referrer" rel="noopener noreferrer">${v.i18n_access}</a></label><br />
        <label>${v.i18n_created_at}: ${v.info.created_at}</label><br />
        <label>${v.i18n_category}: ${categoryHtml}</label><br />
        <label>${v.i18n_tags}: ${tagHtml}</label>
      </div>`;
  }
  return SnapshotMaker.getHtmlStrNode(html);
}



export default {clip};
