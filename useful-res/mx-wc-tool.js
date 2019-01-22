;
/*!
 * $version: 0.0.5
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
MxWc.Rule.parse = function(line) {
  const SEPARATOR = '||';
  const ruleStr = line.trim();
  if(ruleStr.startsWith('#')){
    // is a comment
    return null;
  } else {
    const r = ruleStr.split(SEPARATOR);
    switch(r.length) {
      case 2:
        return { type: 'C', host: r[0], path: '/', q: r[1] };
      case 3:
        return { type: 'C', host: r[0], path: r[1], q: r[2]};
      case 4:
        return { type: r[0], host: r[1], path: r[2], q: r[3]};
      default: return null;
    }
  }
}

MxWc.Rule.isMatch = function(rule) {
  if(rule){
    const isHostMatch = MxWc.Rule.matchHost(rule.host, window.location.host);
    const isPathMatch = MxWc.Rule.matchPath(rule.path, window.location.pathname);
    return isHostMatch && isPathMatch;
  } else {
    return false;
  }
}

MxWc.Rule.matchHost = function(ruleHost, currHost) {
  const index = ruleHost.indexOf('*');
  if( index > -1) {
    if(ruleHost.length === 1) {
      return true;
    } else {
      switch(index){
        case 0 :
          return currHost.endsWith(ruleHost.replace('*', ''));
        case ruleHost.length - 1 :
          return currHost.startsWith(ruleHost.replace('*', ''));
        default:
          console.error('Rule: host invalid:', ruleHost);
          return false
      }
    }
  } else {
    return ruleHost === currHost;
  }
}

MxWc.Rule.matchPath = function(rulePath, currPath) {
  return currPath.indexOf(rulePath) > -1
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

MxWc.matchRules = function(rules, matchFirstRule) {
  const r = [];
  if(matchFirstRule) {
    rules.some(function(rule) {
      const it = MxWc.Rule.parse(rule);
      if(MxWc.Rule.isMatch(it)){
        r.push(it);
        return true
      } else {
        return false
      }
    });
  } else {
    rules.forEach(function(rule) {
      const it = MxWc.Rule.parse(rule);
      if(MxWc.Rule.isMatch(it)){
        r.push(it);
      }
    });
  }
  return r;
}

MxWc.dispatchEvent = function(name, detail){
  const detailJson = JSON.stringify(detail)
  const ev = new CustomEvent(name, {detail: detailJson});
  console.log('emitEvent', name, detail);
  document.dispatchEvent(ev);
}


/*
 * ${action} action to perform
 * ${option}
 *   type:
 *     auto    => invoke when MaoXian is ready.
 *     trigger => invoke when MaoXian is enable.
 *   isMatchFirstRule: {boolean}
 */
MxWc.createCmd = function(action, option) {
  return function Cmd(){
    const state = {rules: [], performedTimes: 0};
    const Action = action;
    const type = option.type;
    const isMatchFirstRule = option.isMatchFirstRule;
    const isPerformOnce = option.isPerformOnce;

    // query matched rules (may cost a long time)
    function initRules(rules){
      return new Promise(function(resolve, _) {
        state.rules = MxWc.matchRules(rules, isMatchFirstRule);
        resolve(state.rules);
      });
    }

    function matchedRules(){
      return state.rules;
    }

    function perform(){
      if(isPerformOnce && state.performedTimes > 0){
        // Do nothing
      } else {
        console.log(Action.name, "PERFORM");
        Action.perform(state.rules);
        state.performedTimes++;
      }
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

    function unbindListener() {
      switch(type) {
        case 'trigger':
          document.removeEventListener('mx-wc.selecting', perform);
          document.removeEventListener('mx-wc.idle', undo);
          break;
        case 'auto':
          document.removeEventListener('mx-wc.ready', perform);
          break;
        default: break;
      }
    }

    function init(rules) {
      bindListener();
      return initRules(rules);
    }

    return {
      init: init,
      cancel: unbindListener
    }
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
MxWc.Cmd.Hide = MxWc.createCmd(MxWc.Action.Hide(), {
  type: 'trigger',
  isMatchFirstRule: false,
  isPerformOnce: false
});
MxWc.Cmd.Focus = MxWc.createCmd(MxWc.Action.Focus(), {
  type: 'trigger',
  isMatchFirstRule: true,
  isPerformOnce: true
})
MxWc.Cmd.Confirm = MxWc.createCmd(MxWc.Action.Confirm(), {
  type: 'trigger',
  isMatchFirstRule: true,
  isPerformOnce: true
})


MxWc.newHideCmd = function() {
  const cmd = new MxWc.Cmd.Hide();
  return cmd;
}

MxWc.newFocusCmd = function() {
  const cmd = new MxWc.Cmd.Focus();
  return cmd;
}

MxWc.newConfirmCmd = function() {
  const cmd = new MxWc.Cmd.Confirm();
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
  const Cmd = MxWc.createCmd(action, {
    type: 'auto',
    isMatchFirstRule: true,
    isPerformOnce: true
  });
  const cmd = new Cmd();
  return cmd;
};
