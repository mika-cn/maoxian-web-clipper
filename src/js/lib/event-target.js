

const Lib = function() {
  this.listeners = {};
};
const _ = Lib;

_.prototype.listeners = null;

_.prototype.addEventListener = function(type, listener) {
  if (!(type in this.listeners)) {
    this.listeners[type] = [];
  }
  this.listeners[type].push(listener);
}

_.prototype.removeEventListener = function(type, listener) {
  if (!(type in this.listeners)) {
    return;
  }
  const stack = this.listeners[type];
  for (let i = 0, l = stack.length; i < l; i++) {
    if (stack[i] === listener){
      stack.splice(i, 1);
      return this.removeEventListener(type, listener);
    }
  }
}

// event {:type}
_.prototype.dispatchEvent = function(event) {
  if (!(event.type in this.listeners)) {
    return;
  }
  event.target = this;
  const stack = this.listeners[event.type];
  for (let i = 0, l = stack.length; i < l; i++) {
    stack[i].call(this, event);
  }
}

export default Lib;
