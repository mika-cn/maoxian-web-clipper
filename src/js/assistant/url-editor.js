
import T from '../lib/tool.js';

// ========== edit file ==========

function editFile(urlOrPath, options) {
  const {type} = options;
  const {urlFolder, urlFile, urlTail} = sliceUrlByFile(urlOrPath);
  let optionKeys, fn;
  if (type == 'url.file.set-ext-suffix') {
    optionKeys = ['sep', 'suffix'];
    fn = setExtSuffix;
  }
  if (type == 'url.file.rm-ext-suffix') {
    optionKeys = ['sep'];
    fn = rmExtSuffix;
  }
  if (type == 'url.file.set-name-suffix') {
    optionKeys = ['sep', 'suffix', 'whiteList'];
    fn = setNameSuffix
  }
  if (type == 'url.file.rm-name-suffix') {
    optionKeys = ['sep', 'whiteList'];
    fn = rmNameSuffix;
  }
  const filename = fn(urlFile, T.sliceObj(options, optionKeys));
  return urlFolder + '/' + filename + urlTail;
}

function sliceUrlByFile(urlOrPath) {
  const input = decodeURI(urlOrPath);
  let urlBody, urlFolder, urlFile, urlTail = "";
  sliceHead(input, '?', (head, tail) => {
    urlBody = head;
    urlTail = '?' + tail;
  })

  if (!urlBody) {
    sliceHead(input, '#', (head, tail) => {
      urlBody = head;
      urlTail = '#' + tail;
    })
  }

  if (!urlBody) { urlBody = input }

  sliceTail(urlBody, '/', (head, tail) => {
    urlFolder = head;
    urlFile = tail;
  });

  return {urlFolder, urlFile, urlTail};
}


function setExtSuffix(filename, {sep, suffix}) {
  const sepIdx = filename.lastIndexOf(sep);
  if (sepIdx == 0 || sepIdx + 1 == filename.length)  { return filename }
  if (sepIdx == -1) { return filename + sep + suffix }
  return filename.substring(0, sepIdx) + sep + suffix;
}


function rmExtSuffix(filename, {sep}) {
  const sepIdx = filename.lastIndexOf(sep);
  const inTheMid = (sepIdx > 0 && sepIdx + 1 < filename.length);
  return (inTheMid ? filename.substring(0, sepIdx) : filename);
}


function setNameSuffix(filename, {sep, suffix, whiteList = []}) {
  const dotIdx = filename.lastIndexOf('.');
  if (dotIdx < 1) { return filename }
  const name = filename.substring(0, dotIdx);
  const sepIdx = name.lastIndexOf(sep);
  if (sepIdx == 0 || sepIdx + 1 == name.length) {
    // seperator is at the beginning or in the end.
    return filename
  }
  if (sepIdx == -1) {
    return name + sep + suffix + filename.substring(dotIdx);
  }
  const currSuffix = name.substring(sepIdx + 1);
  if (whiteList.length > 0 && whiteList.indexOf(currSuffix) == -1) {
    return name + sep + suffix + filename.substring(dotIdx);
  } else {
    // - whiteList is empty
    // - whiteList contains current suffix
    return name.substring(0, sepIdx) + sep + suffix + filename.substring(dotIdx);
  }
}


function rmNameSuffix(filename, {sep, whiteList}) {
  const dotIdx = filename.lastIndexOf('.');
  if (dotIdx < 1) { return filename }
  const name = filename.substring(0, dotIdx);
  const sepIdx = name.lastIndexOf(sep);
  if (sepIdx < 0 || sepIdx + 1 == name.length) {
    // - seperator is not exist
    // - seperator is at the beginning or in the end.
    return filename
  }
  const currSuffix = name.substring(sepIdx + 1);
  if (whiteList.length > 0 && whiteList.indexOf(currSuffix) == -1) {
    return filename;
  } else {
    return name.substring(0, sepIdx) + filename.substring(dotIdx);
  }
}

// =========== search ================

function sliceUrlBySearch(urlOrPath) {
  const input = decodeURI(urlOrPath);
  let rest = input;
  let urlBody, urlSearch, urlTail = "";

  sliceHead(input, '?', (head, tail) => {
    urlBody = head; rest = tail;
  });

  sliceHead(rest, '#', (head, tail) => {
    urlTail = '#' + tail;
    if (urlBody) {
      urlSearch = head;
    } else {
      urlBody = head;
    }
  });

  if (!urlBody) { urlBody = input }

  const searchObj = parseSearch(urlSearch || "");
  return {urlBody, searchObj, urlTail};
}


function editSearch(urlOrPath, changeObj, deleteNames) {
  const {urlBody, searchObj, urlTail} = sliceUrlBySearch(urlOrPath);
  const urlSearch = searchObj2str(searchObj, changeObj, deleteNames);
  return urlBody + urlSearch + urlTail;
}


function searchObj2str(obj, changeObj = {}, deleteNames = []) {
  const it = Object.assign(obj, changeObj);
  const deletedObj = deleteNames.reduce((obj, name) => {
    obj[name] = true;
    return obj;
  }, {});

  const querys = [];
  for (let name in it) {
    if (!deletedObj[name]) {
      querys.push(name + '=' + it[name]);
    }
  }
  if (querys.length > 0) {
    return '?' + querys.join('&');
  } else {
    return '';
  }
}

function parseSearch(search) {
  return search.split('&').reduce((obj, item) => {
    sliceHead(item, '=', (key, value) => {
      obj[key] = value;
    });
    return obj;
  }, {});
}




function sliceHead(str, sep, callback) {
  const idx = str.indexOf(sep);
  if (idx > -1) {
    const head = str.substring(0, idx);
    const tail = str.substring(idx + sep.length);
    callback(head, tail);
  }
}

function sliceTail(str, sep, callback) {
  const idx = str.lastIndexOf(sep);
  if (idx > -1) {
    const head = str.substring(0, idx);
    const tail = str.substring(idx + sep.length);
    callback(head, tail);
  }
}


export default { editFile, editSearch, }
