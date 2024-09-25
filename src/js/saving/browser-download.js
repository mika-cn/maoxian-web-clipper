
class Download {

  /**
   * @param {Object} downloadAPI => browser.downloads
   * @param {Object} options {:url, :filename, :saveAs ...}
   */
  constructor(downloadAPI, options) {
    this.API = downloadAPI;
    this.options = options;
  }

  download() {
    this.bindListener();
    return new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
      this.API.download(this.options).then(
        (downloadItemId) => {

          // TODO
          // find out why the onCreated event is triggered
          // after the download completed?
          //
          // service worker is so wried

          // // download item successfully create.
          // // validate ID
          // console.debug("<<<", this, this.options.url);
          // console.debug(">>>", this.id);
          // if (!this.id) {
          //   this.reject(new Error('Id should be assigned'));
          // } else if (this.id !== downloadItemId) {
          //   this.reject(new Error("Conflict, id is not equal."));
          // }
        },
        (errMsg) => {
          this.clean();
          this.reject(new Error(errMsg));
        }
      ).catch((error) => {
        this.clean();
        this.reject(error);
      });
    });
  }

  downloadCreated(downloadItem) {
    if (downloadItem.url !== this.options.url) {
      // This event is not triggerred by current object, ignore it.
      return;
    }

    // console.debug("SetId: ", downloadItem.id, this.options.url);
    this.id = downloadItem.id;

    if (downloadItem.filename) {
      // Firefox has filename on this event, but chrome hasn't.
      this.filename = downloadItem.filename;
    }
  }

  downloadChanged(delta) {

    if (!this.id || this.id !== delta.id) {
      // This event is not triggerred by current object, ignore it.
      return;
    }

    if (delta.filename && delta.filename.current) {
      // Chromium has filename on this event, but firefox hasn't.
      this.filename = delta.filename.current;
    }

    if (delta.state && delta.state.current) {
      switch(delta.state.current) {
        case 'in_progress':
          // do nothing.
          break;
        case 'interrupted':
          const errMsg = (delta.error.current || "")
          this.reject(new Error(errMsg));
          this.clean();
          break;
        case 'complete':
          // console.debug(this.id, this.filename);
          this.resolve({id: this.id, filename: this.filename});
          this.clean();
          break;
        default:
          break;
      }
    }

  }

  clean() {
    this.unbindListener();
    if (this.extraCleanFn
      && typeof this.extraCleanFn == 'function') {
      this.extraCleanFn()
    }
  }


  bindListener() {
    const createdListener = this.downloadCreated.bind(this);
    const changedListener = this.downloadChanged.bind(this);
    this.createdListener = createdListener;
    this.changedListener = changedListener;
    this.API.onCreated.addListener(createdListener);
    this.API.onChanged.addListener(changedListener);
  }

  unbindListener() {
    if (this.API.onCreated.hasListener(this.createdListener)) {
      this.API.onCreated.removeListener(this.createdListener);
    }
    if (this.API.onChanged.hasListener(this.changedListener)) {
      this.API.onChanged.removeListener(this.changedListener);
    }
    const noop = () => {};
    this.API.downloadCreated = noop;
    this.API.downloadChanged = noop;
  }

}

export default Download;
