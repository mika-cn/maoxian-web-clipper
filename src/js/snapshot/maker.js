
import {NODE_TYPE, CSSRULE_TYPE}        from '../lib/constants.js';

function getDocumentNode(docUrl, baseUrl, childNodes = []) {
  return {
    name: '#document',
    type: NODE_TYPE.DOCUMENT,
    docUrl: docUrl,
    baseUrl: baseUrl,
  }
}

function getTextNode(text) {
  return {
    name: '#text',
    type: NODE_TYPE.TEXT,
    text: text,
  };
}

function getElementNode(name, attr, childNodes) {
  return Object.assign({name, attr, childNodes},
    {type: NODE_TYPE.ELEMENT});
}

function getCommentNode(comment) {
  return {
    name: '#comment',
    type: NODE_TYPE.COMMENT,
    text: comment,
  };
}

function getMetaNode(attr) {
  return {
    name: 'META',
    type: NODE_TYPE.ELEMENT,
    attr: attr
  }
}

function getCharsetMeta() {
  return getMetaNode({charset: 'utf-8'});
}

function getViewportMeta() {
  return getMetaNode({
    name: 'viewport',
    content: "width=device-width, initial-scale=1.0"
  });
}

function getTitleNode(title) {
  return {
    name: 'TITLE',
    type: NODE_TYPE.ELEMENT,
    childNodes: [getTextNode(title)],
  }
}

function getHeadNode(childNodes) {
  return {
    name: 'HEAD',
    type: NODE_TYPE.ELEMENT,
    childNodes: childNodes,
  }
}

function getDocTypeNode() {
  return {
    name: 'html',
    type: NODE_TYPE.DOCUMENT_TYPE,
  }
}

function getIndentNode(n, width=2) {
  let s = "\n", num = n * width;
  while(num-- > 0) { s += ' '}
  return getTextNode(s);
}

function getHtmlStrNode(html) {
  return {
    name: '__html_str__',
    type: NODE_TYPE.HTML_STR,
    html: html
  }
}

function getShadowDomLoader() {
  const html = `
  <script id="mx-wc-shadowDOM-loader">
    (() => {
      function loadSD(C) {
        [].forEach.call(C.querySelectorAll('template[shadowroot]'),
          (t) => {
            const mode = (t.getAttribute('shadowroot') || 'open');
            const shadowRoot = t.parentNode.attachShadow({mode});
            shadowRoot.appendChild(t.content);
            t.remove();
            loadSD(shadowRoot);
          });
      }
      loadSD(document);
    })();
  </script>
  `;
  return getHtmlStrNode(html);
}




function getStyleNode(attr = {}, cssRules) {
  return {
    name: 'STYLE',
    type: NODE_TYPE.ELEMENT,
    attr: attr,
    sheet: createStyleSheet(undefined, cssRules),
  }
}

function createStyleSheet(href, rules) {
  return {
    href: href,
    diabled: false,
    title: '',
    rules: rules,
  }
}


function getCssStyleRule(selectorText, styleObj) {
  return {
    type: CSSRULE_TYPE.STYLE,
    selectorText,
    styleObj
  }
}

function getCssMediaRule(conditionText, rules) {
  return {
    type: CSSRULE_TYPE.MEDIA,
    conditionText,
    rules,
  }
}


export default {
  getDocumentNode,
  getElementNode,
  getHtmlStrNode,
  getDocTypeNode,
  getCharsetMeta,
  getViewportMeta,
  getTitleNode,
  getHeadNode,
  getStyleNode,
  getIndentNode,
  getCommentNode,
  getShadowDomLoader,

  getCssStyleRule,
  getCssMediaRule,
}
