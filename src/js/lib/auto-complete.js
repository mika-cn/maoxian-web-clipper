
// depends on Awesomplete
//
// https://bugzilla.mozilla.org/show_bug.cgi?id=1408996
// fixed
//
// deprecated:
// save reference
// const Lib = { Awesomplete: Awesomplete }


/*
 * @param {Element} input
 * @param {Array} list - option list
 * @param {Object} options
 * @param {Boolean} options.multiple is multiple selection
 * @param {String} options.buttonCSSKlass
 */
function AutoComplete(input, list, options = {}) {
  const {
    multiple = false,
    buttonCSSKlass = 'auto-complete-btn',
    buttonTitle = 'open options',
  } = options;

  const defaultOptions = {
    autoFirst: true,
    minChars: 0,
    maxItems: 10000,
    list: (list || []),
    sort: false,
  };

  let role = 'none'; // 'autocomplete', 'select'
  let awesomplete;

  input.addEventListener('keydown', (e) => {
    // set role back to autoComplete
    tryActAsAutoComplete(awesomplete);
  });


  input.addEventListener('awesomplete-close', (e) => {
    // set role back to autoComplete
    // console.debug("Close....");
    tryActAsAutoComplete(awesomplete);
  });

  awesomplete = new Awesomplete(input, defaultOptions);
  // avoid focus by Tab
  awesomplete.ul.setAttribute('tabindex', '-1');

  if (list && list.length > 0) {
    addButton(awesomplete, buttonCSSKlass, buttonTitle);
  }

  // act as autoComplete by default
  actAsAutoComplete(awesomplete);


  function tryActAsSelect(it) {
    if (role == 'select') { return }

    const inputValue = it.input.value;
    const currInput = getCurrentInput(inputValue);

    // do nothing
    if (isEmptyStr(currInput)) { return }

    actAsSelect(it);
  }


  function tryActAsAutoComplete(it) {
    if (role == 'autoComplete') { return }
    actAsAutoComplete(it);
  }


  function actAsSelect(it) {
    role = 'select';
    it.filter = selectFilter;

    if (multiple) {
      it.replace = function(text) {
        const items = splitInputStr(this.input.value)
        if (items.indexOf(text.toString()) > -1) {
          // do nothing, already selected
        } else {
          const before = this.input.value;
          // append new text
          if (before.match(/[ ,，]{1}$/)) {
            // end with separator
            this.input.value = before + text + " ";
          } else {
            this.input.value = before + " " + text + " ";
          }
        }
      };
    }
  }


  function actAsAutoComplete(it) {
    role = 'autoComplete';
    if (multiple) {

      it.filter = function(text, inputValue) {
        return defaultFilter(text, getCurrentInput(inputValue));
      }

      it.item = function(text, inputValue) {
        return Awesomplete.ITEM(text, getCurrentInput(inputValue));
      }

      it.replace = function(text) {
        const items = splitInputStr(this.input.value)
        if (items.indexOf(text.toString()) > -1) {
          // do nothing, already selected
        } else {
          const before = this.input.value.match(/^.+[ ,，]{1}\s*|/)[0];
          this.input.value = before + text + " ";
        }
      }
    } else {
      it.filter = defaultFilter;
    }
  }


  function selectFilter(text, inputValue) {
    // display all options like select input.
    return true;
  }


  function defaultFilter(text, inputValue) {
    if (isEmptyStr(inputValue)) { return true }
    const candidate = text.toLowerCase();
    const currInput = getCurrentInput(inputValue).toLowerCase();
    return candidate.indexOf(currInput) > -1;
  }


  function getCurrentInput(inputValue) {
    if (multiple) {
      // return last part.
      return inputValue.match(/[^ ,，]*$/)[0];
    } else {
      return inputValue.trim();
    }
  }


  function addButton(it, cssKlass, title) {
    const btn = document.createElement('div');
    btn.classList.add(cssKlass);
    btn.setAttribute('title', title);
    btn.onclick = function() {
      tryActAsSelect(it);
      it.input.focus();
      it.evaluate();
    }
    it.container.append(btn);
  }


  function destroy() {
    awesomplete.destroy();
    awesomplete = undefined;
    role = 'none';
  }


  function splitInputStr(str) {
    str = str.replace(/^[ ,，]+/, '');
    str = str.replace(/[ ,，]+$/, '');

    if (str.length === 0) {
      return [];
    } else {
      str = str.trim().replace(/[ ,，]+/g, ',');
      const items = str.split(",").map((it) => it.trim());
      // unique
      return items.filter(function(value, index, self) {
        return self.indexOf(value) === index;
      });
    }
  }


  function isEmptyStr(str) {
    return str.match(/^\s*$/);
  }


  return {destroy};
}

export default AutoComplete;
