"use strict";

import T                     from '../lib/tool.js';
import DOMTool               from '../lib/dom-tool.js';
import Log                   from '../lib/log.js';
import Task                  from '../lib/task.js';
import Snapshot              from '../snapshot/snapshot.js';
import SnapshotMaker         from '../snapshot/maker.js';
import SnapshotNodeChange    from '../snapshot/change.js';
import CaptureTool           from '../capturer/tool.js';
import CapturerA             from '../capturer/a.js';
import CapturerPicture       from '../capturer/picture.js';
import CapturerImg           from '../capturer/img.js';
import CapturerStyle         from '../capturer/style.js';
import CapturerLink          from '../capturer/link.js';
import CapturerCanvas        from '../capturer/canvas.js';
import CapturerIframe        from '../capturer/iframe.js';
import CapturerStyleSheet    from '../capturer/stylesheet.js';
import StyleHelper           from './style-helper.js';
import RequestParams         from '../lib/request-params.js'


async function clip(elem, {info, storageInfo, config, i18nLabel, requestParams, frames, win}) {
  Log.debug("html parser");

  const {clipId} = info;

  const calculatedStyle = StyleHelper.calcStyle(elem, win);

  if (config.customBodyBgCssEnabled && config.customBodyBgCssValue){
    calculatedStyle.bodyBgCss = config.customBodyBgCssValue;
  }

  const v = Object.assign({info, config}, calculatedStyle, i18nLabel)

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

  const snapshot = await takeSnapshot({elem, frames, requestParams, win, v});

  const tasks = await captureAssets(snapshot, Object.assign({}, params, {
    needFixStyle: (elem.tagName.toUpperCase() !== 'BODY')
  }));
  console.log(snapshot);

  const iframeStorageInfo = Object.assign({}, params.storageInfo, {
    mainFileFolder: params.storageInfo.frameFileFolder,
  });

  const subHtmlHandler = function({snapshot, subHtml, ancestorDocs}) {
    const r = CapturerIframe.capture(snapshot, {
      saveFormat: 'html',
      html: subHtml,
      clipId,
      storageInfo: (ancestorDocs.length > 1 ? iframeStorageInfo : storageInfo),
    });
    tasks.push(...r.tasks);
    return r.change.toObject();
  };

  const html = Snapshot.toHTML(snapshot, subHtmlHandler);

  const filename = T.joinPath(storageInfo.mainFileFolder, storageInfo.mainFileName)
  const mainFileTask = Task.createHtmlTask(filename, html, clipId);
  tasks.push(mainFileTask);

  return tasks;
}


async function takeSnapshot({elem, frames, requestParams, win, v}) {
  const topFrame = frames.find((it) => it.frameId == 0);
  const frameInfo = {allFrames: frames, ancestors: [topFrame]}

  let elemSnapshot = await Snapshot.take(elem, {
    frameInfo, requestParams, win,
    blacklist: {SCRIPT: true, LINK: true, STYLE: true, TEMPLATE: true},
    shadowDom:    {blacklist: {SCRIPT: true, TEMPLATE: true}},
    srcdocFrame:  {blacklist: {SCRIPT: true, TEMPLATE: true}},
  });

  appendClassName2Snapshot(elemSnapshot, 'mx-wc-selected');

  const headNodes = win.document.querySelectorAll(
    'link[rel*=icon],link[rel~=stylesheet],style');

  const headChildrenSnapshots = [];
  for (const node of headNodes) {
    headChildrenSnapshots.push(await Snapshot.take(node, {
      frameInfo, requestParams, win,}));
  }

  if (elemSnapshot.name == 'BODY') {
    headChildrenSnapshots.push(
      SnapshotMaker.getStyleNode(
        {'class': 'mx-wc-style'},
        getClippingInformationCssRules(v.config)
      )
    );
    elemSnapshot.childNodes.push(getClippingInformationSnapshot(v));
    elemSnapshot.childNodes.push(getShadowDomLoaderSnapshot());

  } else {

    headChildrenSnapshots.push(getWrapperNodeStyleSnapshot(v));
    appendStyleObj2Snapshot(elemSnapshot, StyleHelper.getSelectedNodeStyle(elem, win));
    elemSnapshot = wrapOutermostElem(elem, elemSnapshot, v);
  }

  const headSnapshot = SnapshotMaker.getHeadNode([
    SnapshotMaker.getCharsetMeta(),
    SnapshotMaker.getViewportMeta(),
    SnapshotMaker.getTitleNode(win.document.title),
  ].concat(headChildrenSnapshots));

  const commentSnapshot = SnapshotMaker.getCommentNode(`OriginalSrc: ${v.info.link}`);

  const currLayerSnapshots = [elemSnapshot];
  if (elemSnapshot.name == 'BODY') {
    currLayerSnapshots.unshift(headSnapshot);
    currLayerSnapshots.unshift(commentSnapshot);
  }

  const snapshot = Snapshot.takeAncestorsSnapshot(
    elem, currLayerSnapshots, (ancestorNode, ancestorSnapshot) => {

      if (ancestorSnapshot.name == 'HTML') {

        appendStyleObj2Snapshot(ancestorSnapshot, v.htmlStyleObj);
        return [SnapshotMaker.getDocTypeNode(), ancestorSnapshot];

      } else if (ancestorSnapshot.name == 'BODY') {

        appendStyleObj2Snapshot(ancestorSnapshot, v.bodyStyleObj);
        ancestorSnapshot.childNodes.push(getShadowDomLoaderSnapshot());
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
          appendStyleObj2Snapshot(ancestorSnapshot, styleObj);
        }
        ancestorSnapshot = wrapOutermostElem(ancestorNode, ancestorSnapshot, v);
        return [ancestorSnapshot];
      }
    });

  return snapshot;
}


function wrapOutermostElem(elem, snapshot, v) {
  const isOutermost = elem.parentNode && elem.parentNode.nodeName === 'BODY';
  if (isOutermost) {
    const wrapper = SnapshotMaker.getElementNode('DIV',
      {class: 'mx-wc-main'}, [snapshot, getClippingInformationSnapshot(v)]);
    return wrapper;
  } else {
    return snapshot;
  }
}


// WARNING: this function will modify the snapshot.
function appendClassName2Snapshot(snapshot, name) {
  if (!snapshot.attr) {snapshot.attr = {}}
  const names = (snapshot.attr.class || '').split(/\s+/)
  names.push(name);
  snapshot.attr.class = names.filter((it) => it !== '').join(' ');
}

// WARNING: this function will modify the snapshot.
function appendStyleObj2Snapshot(snapshot, styleObj) {
  snapshot.styleObj = Object.assign(snapshot.styleObj || {}, styleObj);
}

async function captureAssets(snapshot, params) {
  const {saveFormat, baseUrl, docUrl, clipId, config, needFixStyle} = params;

  const iframeStorageInfo = Object.assign({}, params.storageInfo, {
    mainFileFolder: params.storageInfo.frameFileFolder,
  });

  const tasks = [];

  await Snapshot.eachElement(snapshot,
    async(node, ancestors, ancestorDocs) => {
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

      let r = {change: new SnapshotNodeChange(), tasks: []};
      switch(node.name) {
        case 'LINK':
          r = await CapturerLink.capture(node, {
            baseUrl, docUrl, storageInfo, clipId,
            config, requestParams, needFixStyle,
          });
          break;

        case 'STYLE':
          r = await CapturerStyle.capture(node, {
            baseUrl, docUrl, storageInfo, clipId,
            config, requestParams, needFixStyle,
          });
          break;

        case 'PICTURE':
          r = await CapturerPicture.capture(node, {
            aseUrl, storageInfo, clipId, requestParams
          });
          break;

        case 'IMG':
          r = await CapturerImg.capture(node, {
            saveFormat, baseUrl, storageInfo, clipId, requestParams
          });
          break;

        case 'A':
          r = await CapturerA.capture(node, {baseUrl, docUrl});
          break;

        case 'BODY':
        case 'TABLE':
        case 'TH':
        case 'TD':
          // background attribute (deprecated since HTML5)
          r = await CaptureTool.captureBackgroundAttr(node, {
            baseUrl, storageInfo, config, clipId, requestParams,
          });
          break;

        case 'AUDIO':
        case 'VEDIO':
        case 'EMBED':
        case 'OBJECT':
        case 'APPLET':
          // Don't capture media nodes.
          r.change.setProperty('ignore', true);
          r.change.setProperty('ignoreReason', 'mediaNode');
          break;

        case 'CANVAS':
          r = CapturerCanvas.capture(node, {
            saveFormat, storageInfo, clipId, requestParams,
          });
          break;
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
        const params = Object.assign({ownerType: 'styleAttr'}, {
          baseUrl, docUrl, storageInfo, clipId,
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
  );

  return tasks;
}


function getWrapperNodeStyleSnapshot(v) {
  return SnapshotMaker.getStyleNode(
    {'class': 'mx-wc-style'},
    getWrapperNodeCssRules(v)
  );
}

function getWrapperNodeCssRules(v) {
  const rules = [
    SnapshotMaker.getCssStyleRule('body',
      StyleHelper.setImportantPriority({
        'padding-top': '20px',
      })
    ),

    SnapshotMaker.getCssStyleRule('.mx-wc-main',
      StyleHelper.setImportantPriority({
        'box-sizing'       : 'content-box',
        'background-color' : v.outerElemBgCss,
        'margin'           : '0 auto',
        'max-width'        : `${v.elemWidth}px`,
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
          'max-height'       : '100px',
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

function getShadowDomLoaderSnapshot() {
  return SnapshotMaker.getShadowDomLoader();
}


export default {clip};
