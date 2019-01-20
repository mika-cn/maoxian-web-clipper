;
/*
 * $version: 0.0.3
 *
 */

var MxWc = (MxWc || {});


/*
 * Rule: $type||$host||$path||$q
 *
 * $type => C(css selector) or X(xpath)
 * $path => Url path prefix.
 * $q    => css selector Or Xpath
 */
MxWc.Rule = {};
MxWc.Rule.parse = function(ruleStr) {
  const SEPARATOR = '||';
  const r = ruleStr.trim().split(SEPARATOR);
  if(r.length === 4){
    return { type: r[0].trim(), host: r[1].trim(), path: r[2].trim(), q: r[3].trim()}
  } else {
    return null;
  }
}

MxWc.Rule.isMatch = function(rule, win) {
  if(rule){
    let isHostMatch = false;
    const index = rule.host.indexOf('*');
    if( index > -1) {
      if(rule.host.length === 1) {
        isHostMatch = true;
      } else {
        switch(index){
          case 0 :
            isHostMatch = win.location.host.endsWith(rule.host.replace('*', ''));
            break;
          case rule.host.length - 1 :
            isHostMatch = win.location.host.startsWith(rule.host.replace('*', ''));
            break;
          default:
            console.error('Rule: host invalid:', rule.host);
            isHostMatch = false;
        }
      }
    } else {
      isHostMatch = (rule.host === win.location.host);
    }
    return isHostMatch && win.location.pathname.indexOf(rule.path) > -1;
  } else {
    return false;
  }
}

MxWc.Rule.getTypeName = function(rule) {
  return rule.type === 'C' ? 'css' : 'xPath';
}


MxWc.queryElemsByRule = function(rule) {
  if(rule.type === 'C') {
    return MxWc.queryElemsByCss(rule.q);
  } else {
    return MxWc.queryElemsByXpath(rule.q);
  }
}


MxWc.queryElemsByCss = function(selector) {
  const elems = [];
  [].forEach.call(document.querySelectorAll(selector), function(elem) {
    elems.push(elem)
  });
  return elems;
}

MxWc.queryElemsByXpath = function(xpath) {
  const elems = [];
  const xpathResult = document.evaluate(
    xpath,
    document,
    null,
    XPathResult.ORDERED_NODE_ITERATOR_TYPE,
    null
  )
  let elem = xpathResult.iterateNext();
  while(elem){
    elems.push(elem);
    elem = xpathResult.iterateNext();
  }
  return elems;
}

MxWc.matchRules = function(rules) {
  const r = [];
  rules.forEach(function(rule) {
    const it = MxWc.Rule.parse(rule);
    if(MxWc.Rule.isMatch(it, window)){
      r.push(it);
    }
  });
  return r;
}

MxWc.dispatchEvent = function(name, detail){
  const detailJson = JSON.stringify(detail)
  const ev = new CustomEvent(name, {detail: detailJson});
  console.log('emitEvent', name, detail);
  document.dispatchEvent(ev);
}


/*
 * ${type}
 *   auto    => invoke when maoxian is ready.
 *   trigger => invoke when maoxian is enable.
 */
MxWc.createCmd = function(type, action) {
  return function Cmd(){
    const state = {rules: []};
    const Action = action;

    // query match rules
    function initRules(rules){
      state.rules = MxWc.matchRules(rules);
    }

    function perform(){
      console.log(Action.name, "PERFORM");
      Action.perform(state.rules);
    }

    function undo(){
      console.log(Action.name, "UNDO");
      if(Action.undo){
        Action.undo();
      }
    }

    function bindListener() {
      switch(type) {
        case 'trigger':
          document.addEventListener('mx-wc.selecting', perform);
          document.addEventListener('mx-wc.idle', undo);
          break;
        case 'auto':
          document.addEventListener('mx-wc.ready', perform);
          break;
        default: break;
      }
    }

    function init(rules) {
      initRules(rules);
      bindListener();
    }

    return {init: init}
  }
};


MxWc.Action = {}
/*
 * Set element's style 'display: none', perform && undo.
 */
MxWc.Action.Hide = function(){
  return {
    name: 'hide',
    state: {},
    init: function(){
      this.state.elems = [];
      this.state.originalDisplays = [];
    },
    perform: function(rules){
      const This = this;
      this.init();
      rules.forEach(function(rule){
        MxWc.queryElemsByRule(rule).forEach(function(elem){
          const style = window.getComputedStyle(elem);
          This.state.elems.push(elem);
          This.state.originalDisplays.push(style.display);
          elem.style.display = 'none';
        });
      });
    },
    undo: function(){
      const This = this;
      this.state.elems.forEach(function(elem, index){
        elem.style.display = This.state.originalDisplays[index];
      });
      this.init;
    }
  }
}

MxWc.Action.Focus = function(){
  return {
    name: 'focus',
    perform: function(rules) {
      const rule = rules[0];
      if(rule) {
        MxWc.dispatchEvent('mx-wc.focus-elem', {
          qType: MxWc.Rule.getTypeName(rule),
          q: rule.q
        });
      }
    }
  }
}

MxWc.Action.Confirm = function(){
  return {
    name: 'confirm',
    perform: function(rules) {
      const rule = rules[0];
      if(rule) {
        MxWc.dispatchEvent('mx-wc.confirm-elem', {
          qType: MxWc.Rule.getTypeName(rule),
          q: rule.q
        });
      }
    }
  }
}

MxWc.Cmd = {};
MxWc.Cmd.Hide = MxWc.createCmd('trigger', MxWc.Action.Hide())
MxWc.Cmd.Focus = MxWc.createCmd('trigger', MxWc.Action.Focus())
MxWc.Cmd.Confirm = MxWc.createCmd('trigger', MxWc.Action.Confirm())


MxWc.newHideCmd = function() {
  const cmd = new MxWc.Cmd.Hide();
  return cmd;
}

MxWc.newFocusCmd = function() {
  const cmd = new MxWc.Cmd.Focus();
  return cmd;
}

MxWc.newConfirmCmd = function() {
  const cmd =  new MxWc.Cmd.Confirm();
  return cmd;
}

MxWc.newClipCmd = function(options) {
  const action = {
    options: options,
    perform: function(rules) {
      const rule = rules[0];
      if(rule) {
        MxWc.dispatchEvent('mx-wc.clip-elem', {
          qType: MxWc.Rule.getTypeName(rule),
          q: rule.q,
          options: this.options
        });
      }
    }
  }
  const Cmd = MxWc.createCmd('auto', action);
  const cmd = new Cmd();
  return cmd;
};
