"use strict";

/*	CSS Selector Generator, v1.0.4
	by Riki Fridrich <riki@fczbkk.com> (http://fczbkk.com)
	https://github.com/fczbkk/css-selector-generator/

	bugfix: "doesn't work on NYTimes" #13 - "Compute selectors only when needed" #26
	by Boris Lykah
	https://github.com/lykahb/css-selector-generator/
*/

(function () {

	let root;
	let __indexOf = [].indexOf;

	/////////////////////////////////////////////////////////////////////////////////////////////
	///
	let CssSelectorGenerator = (function () {

		//////////////////////////////////////////////////////////////////////
		CssSelectorGenerator.prototype.default_options = {
			selectors: ['id', 'class', 'tag', 'nthchild']
		};

		//////////////////////////////////////////////////////////////////////
		function CssSelectorGenerator(options) {
			if (options == null) {
				options = {};
			}
			this.options = {};
			this.setOptions(this.default_options);
			this.setOptions(options);
		}

		//////////////////////////////////////////////////////////////////////
		CssSelectorGenerator.prototype.setOptions = function (options) {
			let key, _results, val;
			if (options == null) {
				options = {};
			}
			_results = [];
			for (key in options) {
				val = options[key];
				if (this.default_options.hasOwnProperty(key)) {
					_results.push(this.options[key] = val);
				} else {
					_results.push(void 0);
				}
			}
			return _results;
		};

		//////////////////////////////////////////////////////////////////////
		CssSelectorGenerator.prototype.isElement = function (element) {
			return !!((element != null ? element.nodeType : void 0) === 1);
		};

		//////////////////////////////////////////////////////////////////////
		CssSelectorGenerator.prototype.getParents = function (element) {
			let current_element, result;
			result = [];
			if (this.isElement(element)) {
				current_element = element;
				while (this.isElement(current_element)) {
					result.push(current_element);
					current_element = current_element.parentNode;
				}
			}
			return result;
		};

		//////////////////////////////////////////////////////////////////////
		CssSelectorGenerator.prototype.getTagSelector = function (element) {
			return this.sanitizeItem(element.tagName.toLowerCase());
		};

		//////////////////////////////////////////////////////////////////////
		CssSelectorGenerator.prototype.sanitizeItem = function (item) {
			let characters;
			characters = (item.split('')).map(function (character) {
				if (character === ':') {
					return "\\" + (':'.charCodeAt(0).toString(16).toUpperCase()) + " ";
				} else if (/[ !"#$%&'()*+,./;<=>?@\[\\\]^`{|}~]/.test(character)) {
					return "\\" + character;
				} else {
					return escape(character).replace(/\%/g, '\\');
				}
			});
			return characters.join('');
		};

		//////////////////////////////////////////////////////////////////////
		CssSelectorGenerator.prototype.getIdSelector = function (element) {
			let id, sanitized_id;
			id = element.getAttribute('id');
			if ((id != null) && (id !== '') && !(/\s/.exec(id)) && !(/^\d/.exec(id))) {
				sanitized_id = "#" + (this.sanitizeItem(id));
				if (element.ownerDocument.querySelectorAll(sanitized_id).length === 1) {
					return sanitized_id;
				}
			}
			return null;
		};

		//////////////////////////////////////////////////////////////////////
		CssSelectorGenerator.prototype.getClassSelectors = function (element) {
			let class_string, item, result;
			result = [];
			class_string = element.getAttribute('class');
			if (class_string != null) {
				class_string = class_string.replace(/\s+/g, ' ');
				class_string = class_string.replace(/^\s|\s$/g, '');
				if (class_string !== '') {
					result = (function () {
						let _i, _len, _ref, _results;
						_ref = class_string.split(/\s+/);
						_results = [];
						for (_i = 0, _len = _ref.length; _i < _len; _i++) {
							item = _ref[_i];
							_results.push("." + (this.sanitizeItem(item)));
						}
						return _results;
					}).call(this);
				}
			}
			return result;
		};

		//////////////////////////////////////////////////////////////////////
		CssSelectorGenerator.prototype.getAttributeSelectors = function (element) {
			let attribute, blacklist, _i, _len, _ref, _ref1, result;
			result = [];
			blacklist = ['id', 'class'];
			_ref = element.attributes;
			for (_i = 0, _len = _ref.length; _i < _len; _i++) {
				attribute = _ref[_i];
				if (_ref1 = attribute.nodeName, __indexOf.call(blacklist, _ref1) < 0) {
					result.push("[" + attribute.nodeName + "=" + attribute.nodeValue + "]");
				}
			}
			return result;
		};

		//////////////////////////////////////////////////////////////////////
		CssSelectorGenerator.prototype.getNthChildSelector = function (element) {
			let counter, _i, _len, parent_element, sibling, siblings;
			parent_element = element.parentNode;
			if (parent_element != null) {
				counter = 0;
				siblings = parent_element.childNodes;
				for (_i = 0, _len = siblings.length; _i < _len; _i++) {
					sibling = siblings[_i];
					if (this.isElement(sibling)) {
						counter++;
						if (sibling === element) {
							return ":nth-child(" + counter + ")";
						}
					}
				}
			}
			return null;
		};

		//////////////////////////////////////////////////////////////////////
		CssSelectorGenerator.prototype.testSelector = function (element, selector) {
			let is_unique, result;
			is_unique = false;
			if ((selector != null) && selector !== '') {
				result = element.ownerDocument.querySelectorAll(selector);
				if (result.length === 1 && result[0] === element) {
					is_unique = true;
				}
			}
			return is_unique;
		};

		//////////////////////////////////////////////////////////////////////
		CssSelectorGenerator.prototype.testUniqueness = function (element, selector) {
			let found_elements, parent;
			parent = element.parentNode;
			found_elements = parent.querySelectorAll(selector);
			return found_elements.length === 1 && found_elements[0] === element;
		};

		//////////////////////////////////////////////////////////////////////
		CssSelectorGenerator.prototype.testCombinations = function (element, items, tag) {
			let item, _i, _j, _len, _len1, _ref, _ref1;
			_ref = this.getCombinations(items);
			for (_i = 0, _len = _ref.length; _i < _len; _i++) {
				item = _ref[_i];
				if (this.testUniqueness(element, item)) {
					return item;
				}
			}
			if (tag != null) {
				_ref1 = items.map(function (item) {
					return tag + item;
				});
				for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
					item = _ref1[_j];
					if (this.testUniqueness(element, item)) {
						return item;
					}
				}
			}
			return null;
		};

		//////////////////////////////////////////////////////////////////////
		CssSelectorGenerator.prototype.getUniqueSelector = function (element) {
			let selector, tag_selector, _i, _len, _ref, selector_type, selectors;
			tag_selector = this.getTagSelector(element);
			_ref = this.options.selectors;
			for (_i = 0, _len = _ref.length; _i < _len; _i++) {
				selector_type = _ref[_i];
				switch (selector_type) {
					case 'id':
						selector = this.getIdSelector(element);
						break;
					case 'tag':
						if (tag_selector && this.testUniqueness(element, tag_selector)) {
							selector = tag_selector;
						}
						break;
					case 'class':
						selectors = this.getClassSelectors(element);
						if ((selectors != null) && selectors.length !== 0) {
							selector = this.testCombinations(element, selectors, tag_selector);
						}
						break;
					case 'attribute':
						selectors = this.getAttributeSelectors(element);
						if ((selectors != null) && selectors.length !== 0) {
							selector = this.testCombinations(element, selectors, tag_selector);
						}
						break;
					case 'nthchild':
						selector = this.getNthChildSelector(element);
				}
				if (selector) {
					return selector;
				}
			}
			return '*';
		};

		//////////////////////////////////////////////////////////////////////
		CssSelectorGenerator.prototype.getSelector = function (element) {
			let item, parents, result, selector, selectors, _i, _len;
			selectors = [];
			parents = this.getParents(element);
			for (_i = 0, _len = parents.length; _i < _len; _i++) {
				item = parents[_i];
				selector = this.getUniqueSelector(item);
				if (selector != null) {
					selectors.unshift(selector);
					result = selectors.join(' > ');
					if (this.testSelector(element, result)) {
						return result;
					}
				}
			}
			return null;
		};

		//////////////////////////////////////////////////////////////////////
		CssSelectorGenerator.prototype.getCombinations = function (items) {
			let i, j, _i, _j, _ref, _ref1, result;
			if (items == null) {
				items = [];
			}
			result = [[]];
			for (i = _i = 0, _ref = items.length - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
				for (j = _j = 0, _ref1 = result.length - 1; 0 <= _ref1 ? _j <= _ref1 : _j >= _ref1; j = 0 <= _ref1 ? ++_j : --_j) {
					result.push(result[j].concat(items[i]));
				}
			}
			result.shift();
			result = result.sort(function (a, b) {
				return a.length - b.length;
			});
			result = result.map(function (item) {
				return item.join('');
			});
			return result;
		};

		return CssSelectorGenerator;

	})();

	if (typeof define !== "undefined" && define !== null ? define.amd : void 0) {
		define([], function () { return CssSelectorGenerator; });
	} else {
		root = typeof exports !== "undefined" && exports !== null ? exports : this;
		root.CssSelectorGenerator = CssSelectorGenerator;
	}

}).call(this);
