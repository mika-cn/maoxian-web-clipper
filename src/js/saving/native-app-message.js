
// wrap connection

class NativeAppClient {
  constructor(runtimeAPI, typesToCache = []) {
    this.API = runtimeAPI;
    this.appName = 'maoxian_web_clipper_native';
    this.appErrorType = 'nativeApp.error';
    this.typesToCache = typesToCache;
    this.init();
  }

  init() {
    this.port = null;
    this.listeners = {};
    this.cache = {}; // Some responses can be cached.
    this.errors = []; // errors that send from Native App
  }

  reset() {
    this.init();
  }

  addListener(type, listener) {
    if (!this.listeners[type]) {
      this.listeners[type] = [];
    }
    if (this.listeners[type].indexOf(listener) == -1) {
      this.listeners[type].push(listener);
    }
  }

  hasListener(type, listener) {
    if (!this.listeners[type]) {
      return false
    } else {
      return this.listeners[type].indexOf(listener) > -1;
    }
  }

  removeListener(type, listener) {
    if (this.listeners[type]) {
      const idx = this.listeners[type].indexOf(listener);
      if (idx > -1) {
        this.listeners[type].splice(idx, 1);
      }
    }
  }

  sendMessage(msg) {
    this.connect();
    const cachedResponse = this.cache[msg.type];
    if (cachedResponse) {
      this.responseHandler(cachedResponse);
    } else {
      this.port.postMessage(msg);
    }
  }

  responseHandler(resp) {
    if (this.appErrorType == resp.type) {
      this.errors.push(resp.error);
      return;
    }
    if (this.listeners[resp.type]) {
      if (this.typesToCache.indexOf(resp.type) > -1) {
        this.cache[resp.type] = resp;
      }
      this.listeners[resp.type].forEach((it) => it(resp));
    }
  }

  // reset port when native application disconnected.
  disconnectHandler(port) {
    const errors = [...this.errors];

    let lastError;
    // Chromium
    if (this.API.lastError) {
      lastError = "NativeApp: DisconnectErr:" + this.API.lastError.message;
    }
    // Firefox
    if (port.error) {
      lastError = "NativeApp: DisconnectErr:" + port.error.message;
    }
    if (lastError) { errors.push(lastError) }

    const errMsg = errors.length > 0 ? errors.join("; ") : "Unknown Error";
    if (this.listeners.disconnect) {
      this.listeners.disconnect.forEach((it) => it(errMsg));
    }

    this.reset();
  }

  connect() {
    if(!this.port){
      this.port = this.API.connectNative(this.appName);
      this.port.onMessage.addListener(this.responseHandler.bind(this));
      this.port.onDisconnect.addListener(this.disconnectHandler.bind(this));
    }
  }

  disconnect(callback) {
    if (this.port) {
      // It will cause onDisconnect to be fired at the other end,
      // that is close the native application
      this.port.disconnect();
      this.reset();
    }
    callback();
  }

}


class NativeMessage {
  constructor(client, msg) {
    this.client = client;
    this.msg = msg;
  }

  send() {
    this.bindListener();
    return new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
      this.client.sendMessage(this.msg);
    });
  }

  bindListener() {
    const responseListener = this.onResponse.bind(this);
    const disconnectListener = this.onDisconnect.bind(this);
    this.responseListener = responseListener;
    this.disconnectListener = disconnectListener;
    this.client.addListener(this.msg.type, responseListener);
    this.client.addListener('disconnect', disconnectListener);
  }

  unbindListener() {
    if (this.client.hasListener(this.msg.type, this.responseListener)) {
      this.client.removeListener(this.msg.type, this.responseListener);
    }
    if (this.client.hasListener('disconnect', this.disconnectListener)) {
      this.client.removeListener('disconnect', this.disconnectListener);
    }
  }

  onResponse(resp) {
    this.unbindListener();
    this.resolve(resp);
  }

  onDisconnect(errMsg) {
    console.error(errMsg);
    this.unbindListener();
    this.reject(new Error(errMsg));
  }
}


// ===============================================

class DownloadMessage extends NativeMessage {
  onResponse(resp) {
    if (resp.taskFilename == this.msg.filename) {
      this.unbindListener();
      this.resolve(resp);
    }
  }
}


class RefreshHistoryMessage extends NativeMessage {

  constructor(client, msg) {
    super(client, msg);
    // FIXME
    // This clips variable may take lots of memory here.
    this.clippings = [];
    this.categories = [];
    this.tags = [];
  }


  onResponse(resp) {
    if (resp.ok) {
      this.clippings = this.clippings.concat(resp.clips);
      this.categories = this.categories.concat(resp.categories);
      this.tags = this.tags.concat(resp.tags);
      // Only new messages has 'completed' property
      if (!resp.hasOwnProperty('completed') || resp.completed) {
        this.unbindListener();
        this.resolve({
          ok: true,
          clippings: this.clippings,
          categories: this.categories,
          tags: this.tags,
          time: resp.time,
        });
      } else {
        // not completed
      }
    } else {
      this.unbindListener();
      this.resolve(resp);
    }
  }
}


export {
  NativeAppClient,
  NativeMessage,
  DownloadMessage,
  RefreshHistoryMessage,
}
