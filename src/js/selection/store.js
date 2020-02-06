
;(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    // CJS
    module.exports = factory();
  } else {
    // browser or other
    root.MxWcSelectionStore = factory();
  }
})(this, function(undefined) {
  "use strict";

  function create(treeHash) {

    const ABSTRACT_ROOT = '__ROOT__';
    const state = {tree: null}

    function init(treeHash) {
      const h = treeHash || { name: ABSTRACT_ROOT, children: []}
      const root = Node.createFromHash(h);
      state.tree = new Tree(root);
    }

    function get(path) {
      const nodeNames = path2nodeNames(path);
      return state.tree.querySelections(nodeNames);
    }

    function set(path, selection) {
      const nodeNames = path2nodeNames(path);
      state.tree.addNode(nodeNames, selection);
    }

    function toHash() {
      return state.tree.toHash();
    }

    // debug only
    function print() {
      state.tree.print();
    }

    // =============================
    // private
    // =============================

    function Tree(root) {
      this.root = root;
      const _ = Tree;

      _.prototype.querySelections = function(nodeNames) {

        let parentNode = this.root;
        const selections = [];
        const lastIndex = nodeNames.length - 1;

        for (let index = 1; index < nodeNames.length; index++) {
          const isLastIndex = (index == lastIndex);
          const name = nodeNames[index];

          // find child that has same name in current layer.
          let child = parentNode.children.find((child) => {
            if (isLastIndex) {
              return child.name === name && child.isLeaf();
            } else {
              return child.name === name && !child.isLeaf();
            }
          })

          if (isLastIndex) {
            if (child) {
              // we found it.
              selections.push(child.selection);
            } else {
              for (let i = 0; i < parentNode.children.length; i++) {
                const currNode = parentNode.children[i];
                if (currNode.isLeaf()) {
                  // all leaf nodes are candidates
                  if (currNode.isVariable()) {
                    selections.unshift(currNode.selection);
                  } else if (index > 1){
                    // except first layer
                    selections.push(currNode.selection);
                  }
                }
              }
            }
            return selections;

          } else {

            if (!child) {
              // we couldn't found it through name.
              // try variable nodes.
              const candidates = [];
              for (let i = 0; i < parentNode.children.length; i++) {
                const currNode = parentNode.children[i];
                if ( currNode.isVariable() && currNode.childDepth() === lastIndex - index) {
                  const [distance, node] = currNode.findEdgeNodeOfVariableNode();
                  if (distance > 0) {
                    if (node.name === nodeNames[index + distance]) {
                      // apply current variable node.
                      child = currNode;
                      break;
                    } else if (node.isLeaf()) {
                      // variable node is followed by a leaf node.
                      // store it as candidate.
                      candidates.push(node.selection);
                    }
                  }
                }
              }
              if (!child && candidates.length > 0) {
                selections.push(...candidates);
              }

              if (!child && candidates.length == 0) {
                // we couldn't find it after all variable nodes was tested.
                // try to find node that can be treated as variable node.
                const _candidates = [];
                for (let i = 0; i < parentNode.children.length; i++) {
                  const currNode = parentNode.children[i];
                  if ( currNode.isNotVariable()
                    && currNode.hasOneChild()
                    && currNode.childDepth() === lastIndex - index
                  ) {
                    const node = currNode.children[0];
                    if (node.name === nodeNames[index + 1]) {
                      if (!node.isLeaf()) {
                        // treat current node as a variable node.
                        child = currNode;
                        break;
                      } else {
                        _candidates.push(node.selection);
                      }
                    }
                  }
                }
                if (!child && _candidates.length > 0) {
                  selections.push(..._candidates);
                }
              }
            }

            if (child) {
              parentNode = child;
            } else {
              return selections;
            }
          }
        }
      }

      _.prototype.addNode = function(nodeNames, selection) {

        let parentNode = this.root;
        const lastIndex = nodeNames.length - 1;
        const changes = [];

        for (let index = 1; index < nodeNames.length; index++) {
          const name = nodeNames[index];
          const isLastIndex = (index == lastIndex);

          // find child that has same name in current layer.
          let child = parentNode.children.find((child) => {
            if (isLastIndex) {
              return child.name === name && child.isLeaf();
            } else {
              return child.name === name && !child.isLeaf();
            }
          })

          if (isLastIndex) {
            if (child) {
              // we found it
              child.selection = selection;
            } else {
              // try variable node
              let variableNodeNotFound = true;
              for (let i = 0; i < parentNode.children.length; i++) {
                const currNode = parentNode.children[i];
                if ( currNode.isVariable()
                  && currNode.isLeaf()
                  && isSelectionEqual(currNode.selection, selection)
                ) {
                  variableNodeNotFound = false;
                  currNode.selection = selection;
                  break;
                }
              }

              // then normal node
              let normalNodeNotFound = true;
              if (variableNodeNotFound) {
                for (let i = 0; i < parentNode.children.length; i++) {
                  const currNode = parentNode.children[i];
                  if ( currNode.isNotVariable()
                    && currNode.isLeaf()
                    && isSelectionEqual(currNode.selection, selection)
                  ) {
                    normalNodeNotFound = false;
                    currNode.toVariableNode();
                    currNode.selection = selection;
                    changes.push(currNode);
                    break;
                  }
                }
              }

              if (variableNodeNotFound && normalNodeNotFound) {
                child = new Node(name, parentNode, selection);
                parentNode.children.push(child);
              }
            }

          } else {

            if (!child) {

              // try variable node
              for (let i = 0; i < parentNode.children.length; i++) {
                const currNode = parentNode.children[i];
                if (currNode.isVariable() && currNode.childDepth() === lastIndex - index) {
                  const [distance, node] = currNode.findEdgeNodeOfVariableNode();
                  if (distance > 0 && ( node.name === nodeNames[index + distance]
                      || node.isLeaf() && isSelectionEqual(node.selection, selection))
                  ) {
                    // apply current variable node.
                    child = currNode;
                    break;
                  }
                }
              }

              // then normal node
              if (!child) {
                for (let i = 0; i < parentNode.children.length; i++) {
                  const currNode = parentNode.children[i];
                  if ( currNode.isNotVariable()
                    && currNode.hasOneChild()
                    && currNode.childDepth() === lastIndex - index
                  ) {
                    const node = currNode.children[0];
                    if ((!node.isLeaf() && node.name === nodeNames[index + 1])
                      || node.isLeaf() && isSelectionEqual(node.selection, selection)
                    ) {
                      currNode.toVariableNode();
                      changes.push(currNode);
                      child = currNode;
                      break;
                    }
                  }
                }
              }

              if (!child) {
                child = new Node(name, parentNode);
                parentNode.children.push(child);
              }
            }

            parentNode = child;
          }
        }

        while (changes.length > 0) {
          this.merge(changes.pop());
        }
      }

      /*
       * if a node is change to a variable node.
       * try merge branches in the same parentNode.
       */
      _.prototype.merge = function(node) {

        // Find upward untill we find the node that has more than 1 child.
        // And record the distance from that node to our variable node.
        let parentNode = node.parentNode;
        let distance = 1;
        while (true) {
          // AbstractRoot, Do nothing
          if (!parentNode) { return; }
          if (parentNode.children.length > 1) {
            // Found
            break;
          } else {
            distance++;
            parentNode = parentNode.parentNode;
          }
        }

        if (distance !== 2) {
          // In this situation we don't need merge
          return;
        }

        const merges = [];
        parentNode.children.forEach((child) => {
          let n = distance - 1;
          let currNode = child;

          //FIXME n = 1
          while (n > 0) {
            if (currNode.children.length === 1) {
              currNode = currNode.children[0]
              n--;
            } else {
              break;
            }
          }

          if ( n == 0
            && node !== currNode
            && node.name === currNode.name
          ) {

            /**
             * compare their tail.
             */
            let nodeA = node;
            let nodeB = currNode;
            while (nodeA.children.length > 0 && nodeB.children.length > 0) {
              nodeA = nodeA.children[0];
              nodeB = nodeB.children[0];
              if (nodeA.name !== nodeB.name) {
                break;
              }
            }

            // reach leaf node and their selections are equal
            if ( nodeA.children.length == 0
              && nodeB.children.length == 0
              && isSelectionEqual(nodeA.selection, nodeB.selection)
            ) {
              merges.push(child);
            }

          }
        });

        // merge
        if (merges.length > 0) {
          node.parentNode.toVariableNode();
          merges.forEach((child) => {
            const index = parentNode.children.indexOf(child);
            if (index > -1) {
              parentNode.children.splice(index, 1);
            }
          })
        }

      }

      _.prototype.print = function() {
        this.root.print();
      }

      _.prototype.toHash = function() {
        return this.root.toHash();
      }

      function isSelectionEqual(a, b) {
        return a.selector === b.selector;
      }
    }

    function Node(name, parentNode, selection) {
      this.name = name;
      this.parentNode = parentNode;
      this.children = [];
      // only avariable in leaf node
      this.selection = selection;

      const _ = Node;

      _.prototype.isVariable = function() {
        return this.name === '$VARIABLE';
      }

      _.prototype.isNotVariable = function() {
        return this.name !== '$VARIABLE';
      }

      _.prototype.toVariableNode = function() {
        this.name = '$VARIABLE';
      }


      _.prototype.findEdgeNodeOfVariableNode = function() {
        let node = this;
        let distance = 0;
        while (true) {
          if (node.isVariable() && node.children.length > 0) {
            distance++;
            node = node.children[0];
          } else {
            break;
          }
        }
        return [distance, node];
      }

      _.prototype.hasOneChild = function() {
        return this.children.length == 1;
      }

      _.prototype.isLeaf = function() {
        return this.children.length == 0;
      }

      _.prototype.childDepth = function() {
        let currNode = this;
        let childDepth = 0;
        while (currNode.children.length > 0) {
          childDepth++;
          currNode = currNode.children[0];
        }
        return childDepth;
      }

      _.prototype.print = function(level = 0) {
        let pace = '  ';
        let prefix = '';
        let selection = this.selection ? `(${this.selection.selector})` : '';
        for (let i=0; i< level; i++) {
          prefix = prefix + pace;
        }
        console.log(prefix + this.name + selection);
        this.children.forEach((child) => {
          child.print(level + 1);
        });
      }

      _.prototype.toHash = function() {
        return {
          name: this.name,
          selection: this.selection,
          children: this.children.map((child) => {
            return child.toHash();
          })
        }
      }

    }

    // Is this recursive danger?
    Node.createFromHash = function(h, parentNode) {
      const node = new Node( h.name, parentNode, h.selection);
      if (parentNode) {
        parentNode.children.push(node);
      }
      h.children.forEach((it) => {
        Node.createFromHash(it, node);
      });
      return node;
    }

    function path2nodeNames(path) {
      const parts = path.trim().replace(/^\//, '').split('/');
      const result = [];
      parts.forEach((it, index) => {
        if (it.match(/^\d+$/)) {
          result.push('@NUMBER');
        } else if (index + 1 === parts.length && it === '') {
            result.push('@ROOT');
        } else {
            result.push(it);
        }
      });
      result.unshift(ABSTRACT_ROOT);
      return result;
    }

    init(treeHash);

    return {
      get: get,
      set: set,
      toHash: toHash,
      print: print,
    }
  }

  return {create: create}
});


