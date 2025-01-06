import T           from '../lib/tool.js';
import {NODE_TYPE} from '../lib/constants.js';
import Svg         from '../lib/svg.js';
import Attribute   from './attribute.js';

/**
 * The problem: We need to save inline <svg>s as an <img> tags,
 * so that when we can save the content as markdown and don't
 * lost them (Turndown will treat inline svg nodes as normal node).
 * This is a must have feature, because one can use inline <svg>s to show
 * formulas, especially the popular formula library MathJax use it.
 *
 * But inline svgs are so fucking complicate with belowing feature:
 *   - can reference a node outside the <svg> node, using <use> tag (so external dependencies)
 *   - can reference a external <image> (again external dependencies)
 *   - can includes elements from a different XML namespace, using <foreignObject>.tag. WTF is this? So we can use any (X)HTML tags inside? even iframe? (Why they did this?)
 *   - can use <style> and <link> tag, and more worse, it will affect by stylesheets outside of <svg>. (Why?)
 *   - can use <script> (WTF, so one can write evil code inside a svg?)
 *
 * We only do belowing:
 *   - handle <use> tags, so that it don't use external elements anymore
 *   - handle <a>, <image>
 *   - treat <style> as a normal tag
 *   - remove <link> <script> ...
 */


async function takeSnapshotOfCurrNode(node, params) {
  const { win, blacklist = {} } = params;
  const snapshot = {name: node.nodeName, type: node.nodeType}

  switch(node.nodeType) {
    case NODE_TYPE.ELEMENT: {
      const upperCasedNodeName = node.nodeName.toUpperCase();
      if (blacklist[upperCasedNodeName]) {
        snapshot.ignore = true;
        snapshot.ignoreReason = 'onBlacklist';
        return {snapshot};
      }

      const {attrObj, mxAttrObj} = Attribute.handleNormalAndMxAttrs(node);
      snapshot.attr = attrObj;
      if (mxAttrObj) { snapshot.mxAttr = mxAttrObj }

      switch(upperCasedNodeName) {
        case 'MX-SVG-IMG': {
          const children = node.__mx_children;
          delete node.__mx_children
          node = undefined;
          return {snapshot, children, childParams: params};
        }
        case 'SVG': {

          // We don't handle nested inline SVG with shadowDOM bewteen.
          // because we don't even handle HTML tree inside inline SVG
          if (node.parentNode
          && (node.parentNode.closest instanceof Function)
          &&  node.parentNode.closest('svg')
          ) {
            snapshot.nestedSvg = true;
          }

          // wrap it if marked by mx attribute.
          if (mxAttrObj && mxAttrObj.saveAsImg) {
            if (node.__mx_wrapped) {
              // already wrapped
              delete node.__mx_wrapped;
            } else if (snapshot.nestedSvg) {
              // we don't save nested <svg>s as <img>
              snapshot.mxAttr.saveAsImg = false;
            } else {
              node.__mx_wrapped = true;
              const wrapper = win.document.createElement('mx-svg-img');
              wrapper.__mx_children = [node];
              // console.debug("wrap svg: ", wrapper, node, params);
              return await takeSnapshotOfCurrNode(wrapper, params);
            }
          }

          // find external defs and insert it inside svg
          const externalDefs = Svg.getExternalReferencedElems(node);
          let children;
          if (externalDefs.length > 0) {
            const defs = win.document.createElement('defs');
            defs.__mx_externalDefs = externalDefs;
            children = [defs, ...node.childNodes];
          } else {
            children = node.childNodes;
          }
          return {snapshot, children, childParams: params};
        }

        case 'DEFS': {
          let children;
          if (node.__mx_externalDefs) {
            children = node.__mx_externalDefs;
            delete node.__mx_externalDefs;
          } else {
            children = node.childNodes;
          }
          return {snapshot, children, childParams: params};
        }

        case 'FOREIGNOBJECT': {
          // FIXME
          // Do we really need to switch treeType to HTML
          // so we can take these (X)HTML snapshots?
          //
          // we currently only set blacklist
          // search domParams_svg for details
        }
        default: {
          return {snapshot, children: node.childNodes, childParams: params};
        }
      }
      break;
    }

    case NODE_TYPE.COMMENT:
    case NODE_TYPE.TEXT: {
      snapshot.text = node.data;
      break;
    }
    default: break;
  }

  return {snapshot};
}



export default {takeSnapshotOfCurrNode}
