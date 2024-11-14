"use strict";

import Log          from '../js/lib/log.js';
import T            from '../js/lib/tool.js';
import I18N         from '../js/lib/translation.js';
import ExtApi       from '../js/lib/ext-api.js';
import ExtMsg       from '../js/lib/ext-msg.js';
import MxWcStorage  from '../js/lib/storage.js';
import MxWcConfig   from '../js/lib/config.js';
import MxWcLink     from '../js/lib/link.js';
import MxWcTemplate from '../js/lib/template.js';
import Notify       from '../js/lib/notify.js';
import MxWcHandler  from '../js/lib/handler.js';


function listenMessage() {
  ExtMsg.listen('setting', function(msg) {
    return new Promise((resolve, reject) => {
      switch(msg.type) {
        case 'refresh-user-scripts':
          refreshUserScripts();
          resolve();
          break;
        default:
          reject(new Error(`setting.js: Unknown message: ${msg.type}`));
          break;

      }
    });
  });
}

// http://kb.mozillazine.org/Firefox_:_Issues_:_Links_to_Local_Pages_Don%27t_Work

function updateConfig(key, value) {
  const isUpdated = MxWcConfig.update(key, value);
  const BG_CARE_KEYS = [
    'autoRunContentScripts',
    'requestCacheCss',
    'requestCacheImage',
    'requestCacheWebFont',
  ];
  if (BG_CARE_KEYS.indexOf(key) > -1) {
    ExtMsg.sendToBackground({
      type: 'config.changed',
      body: {key, value}
    });
  }
  return isUpdated;
}

// ======================================
// init form inputs
// ======================================

function initSettingGeneral(config) {
  // control
  initCheckboxInput(config,
    'mouse-mode-enabled',
    'mouseModeEnabled',
  );

  initCheckboxInput(config,
    'select-save-format-on-menus',
    'selectSaveFormatOnMenus',
  );

  initCheckboxInput(config,
    'auto-input-last-category',
    'autoInputLastCategory',
  );

  initCheckboxInput(config,
    'auto-input-last-tags',
    'autoInputLastTags',
  );

  initCheckboxInput(config,
    'remember-selection',
    'rememberSelection',
  );

  // File url access
  initCheckboxInput(config,
    'file-scheme-access-input',
    'allowFileSchemeAccess'
  );

  // common clipping content
  initCheckboxInput(config,
    'save-domain-as-tag',
    'saveDomainAsTag'
  );

}

// section: HTML
function initSettingHtml(config) {
  initCheckboxInput(config,
    'html-save-clipping-information',
    'htmlSaveClippingInformation'
  );
  initCheckboxInput(config,
    'html-custom-body-bg-css-enabled',
    'htmlCustomBodyBgCssEnabled'
  );
  initColorInput(config,
    'html-custom-body-bg-css-value',
    'htmlCustomBodyBgCssValue'
  );

  initCheckboxInput(config,
    'html-compress-css',
    'htmlCompressCss'
  );

  initRadioInput(config,
    'html-capture-icon',
    'htmlCaptureIcon'
  );
  initRadioInput(config,
    'html-capture-css-rules',
    'htmlCaptureCssRules',
  );
  initRadioInput(config,
    'html-capture-web-font',
    'htmlCaptureWebFont'
  );
  initTextInput(config,
    'html-web-font-filter-list',
    'htmlWebFontFilterList'
  );
  initRadioInput(config,
    'html-capture-image',
    'htmlCaptureImage'
  );
  initRadioInput(config,
    'html-capture-css-image',
    'htmlCaptureCssImage'
  );
  initRadioInput(config,
    'html-capture-audio',
    'htmlCaptureAudio'
  );
  initRadioInput(config,
    'html-capture-video',
    'htmlCaptureVideo'
  );
  initRadioInput(config,
    'html-capture-applet',
    'htmlCaptureApplet'
  );
  initRadioInput(config,
    'html-capture-embed',
    'htmlCaptureEmbed'
  );
  initTextInput(config,
    'html-embed-filter',
    'htmlEmbedFilter'
  );
  initRadioInput(config,
    'html-capture-object',
    'htmlCaptureObject'
  );
  initTextInput(config,
    'html-object-filter',
    'htmlObjectFilter'
  );
}


// section: Markdown
function initSettingMarkdown(config) {
  // - markdown
  initTextInput(config,
    'markdown-template',
    'markdownTemplate'
  );
  initRadioInput(config,
    'markdown-option-heading-style',
    'markdownOptionHeadingStyle'
  );
  initRadioInput(config,
    'markdown-option-hr',
    'markdownOptionHr'
  );
  initRadioInput(config,
    'markdown-option-bullet-list-marker',
    'markdownOptionBulletListMarker'
  );
  initRadioInput(config,
    'markdown-option-code-block-style',
    'markdownOptionCodeBlockStyle'
  );
  initRadioInput(config,
    'markdown-option-fence',
    'markdownOptionFence'
  );
  initRadioInput(config,
    'markdown-option-em-delimiter',
    'markdownOptionEmDelimiter'
  );
  initRadioInput(config,
    'markdown-option-strong-delimiter',
    'markdownOptionStrongDelimiter'
  );
  initRadioInput(config,
    'markdown-option-link-style',
    'markdownOptionLinkStyle'
  );
  initRadioInput(config,
    'markdown-option-formula-block-wrapper',
    'markdownOptionFormulaBlockWrapper'
  );
}


// section: Storage
function initSettingStorage(config) {
  initOptionsInput(config,
    'storage-handler',
    'clippingHandler'
  );
}

function initSettingAssistant(config) {
  initCheckboxInput(config,
    'assistant-enabled',
    'assistantEnabled'
  );
  initCheckboxInput(config,
    'auto-update-public-plan',
    'autoUpdatePublicPlan'
  );
}

// section: handler-browser
function initSettingHandlerBrowser(config) {
  initCheckboxInput(config,
    'handler-browser-enabled',
    'handlerBrowserEnabled'
  );
}

// section: handler-native-app
function initSettingHandlerNativeApp(config) {
  initCheckboxInput(config,
    "handler-native-app-enabled",
    "handlerNativeAppEnabled",
  );
}

// section: handler-WizNotePlus
function initSettingHandlerWizNotePlus(config) {
  initCheckboxInput(config,
    "handler-wiz-note-plus-enabled",
    "handlerWizNotePlusEnabled",
  );
}

function initSettingSaveFormat(config){
  initOptionsInput(config,
    'save-format',
    'saveFormat'
  );
}

// local path relative
function initSettingPath(config) {

  initTextInput(config,
    'root-folder',
    'rootFolder'
  );

  initTextInput(config,
    'default-category',
    'defaultCategory'
  );

  initTextInput(config,
    'clipping-folder-name',
    'clippingFolderName'
  );

  initTextInput(config,
    'main-file-folder',
    'mainFileFolder',
  );

  initTextInput(config,
    'main-file-name',
    'mainFileName',
  );

  initTextInput(config,
    'asset-folder',
    'assetFolder'
  );

  initTextInput(config,
    'asset-file-name',
    'assetFileName',
  );

  initTextInput(config,
    'frame-file-folder',
    'frameFileFolder'
  );

  initTextInput(config,
    'frame-file-name',
    'frameFileName',
  );

  initCheckboxInput(config,
    'save-info-file',
    'saveInfoFile'
  );

  initTextInput(config,
    'info-file-folder',
    'infoFileFolder',
  );

  initTextInput(config,
    'info-file-name',
    'infoFileName',
  );

  initCheckboxInput(config,
    'save-title-file',
    'saveTitleFile'
  );

  initTextInput(config,
    'title-file-folder',
    'titleFileFolder',
  );

  initTextInput(config,
    'title-file-name',
    'titleFileName',
  );
}

// section: refresh history
function initRefreshHistory(config) {
  initOptionsInput(config,
    'refresh-history-handler',
    'refreshHistoryHandler'
  );

  initCheckboxInput(config,
    'auto-refresh-history',
    'autoRefreshHistory'
  );
}

// section: offline page
function initOfflinePage(config) {
  initOptionsInput(config,
    'offline-page-handler',
    'offlinePageHandler'
  );

  initCheckboxInput(config,
    'autogenerate-clipping-js',
    'autogenerateClippingJs'
  );
  initTextInput(config,
    'clipping-js-path',
    'clippingJsPath'
  );
}

function initSettingUserCommand(config) {
  initTextInput(config,
    'user-commands-text',
    'userCommandsText'
  );

  initTextInput(config,
    'shortcut-slot0',
    'shortcutSlot0'
  );
  initTextInput(config,
    'shortcut-slot1',
    'shortcutSlot1'
  );
  initTextInput(config,
    'shortcut-slot2',
    'shortcutSlot2'
  );
  initTextInput(config,
    'shortcut-slot3',
    'shortcutSlot3'
  );
  initTextInput(config,
    'shortcut-slot4',
    'shortcutSlot4'
  );
  initTextInput(config,
    'shortcut-slot5',
    'shortcutSlot5'
  );
  initTextInput(config,
    'shortcut-slot6',
    'shortcutSlot6'
  );
  initTextInput(config,
    'shortcut-slot7',
    'shortcutSlot7'
  );
  initTextInput(config,
    'shortcut-slot8',
    'shortcutSlot8'
  );
  initTextInput(config,
    'shortcut-slot9',
    'shortcutSlot9'
  );
}

function initSettingAdvanced(config) {

  initNumberInput(config,
    'request-timeout',
    'requestTimeout'
  );

  initNumberInput(config,
    'request-max-tries',
    'requestMaxTries'
  );

  initCheckboxInput(config,
    'communicate-with-third-party',
    'communicateWithThirdParty'
  );

  initCheckboxInput(config,
    'auto-run-content-scripts',
    'autoRunContentScripts'
  );

}

function initSettingResetAndBackup(config) {
  initCheckboxInput(config,
    'backup-setting-page-config',
    'backupSettingPageConfig'
  );

  initCheckboxInput(config,
    'backup-history-page-config',
    'backupHistoryPageConfig'
  );

  initCheckboxInput(config,
    'backup-assistant-data',
    'backupAssistantData'
  );

  initCheckboxInput(config,
    'backup-selection-data',
    'backupSelectionData'
  );

}

// ======================================
// init form input END
// ======================================

function setConfigKey(elem, key) {
  elem.setAttribute('data-config-key', key);
}

function getConfigKey(elem) {
  return elem.getAttribute('data-config-key');
}

function initCheckboxInput(config, elemId, configKey){
  const elem = T.findElem(elemId);
  elem.checked = config[configKey];
  setConfigKey(elem, configKey);
  T.bindOnce(elem, 'change', checkBoxChanged)
}

function checkBoxChanged(e) {
  const configKey = getConfigKey(e.target);
  updateConfig(configKey, e.target.checked);
}

function initSelectInput(config, elemId, configKey) {
  const elem = T.findElem(elemId);
  setConfigKey(elem, configKey);
  T.bindOnce(elem, 'change', selectInputChanged);
  selectSelectInput(elem, config[configKey]);
  updateBindedElemOfSelect(elem, config[configKey]);
}

function selectInputChanged(e) {
  const configKey = getConfigKey(e.target);
  updateConfig(configKey, e.target.value);
  updateBindedElemOfSelect(e.target, e.target.value);
}

function selectSelectInput(select, value) {
  const optionElems = T.queryElems('option', select);
  optionElems.forEach((it) => {
    if (it.value == value) {
      it.selected = true;
    }
  });
}

function updateBindedElemOfSelect(select, value) {
  const bindedElems = T.queryElems(`[data-bind-select=${select.id}]`);
  bindedElems.forEach((it) => {
    if (it.getAttribute('data-bind-value') == value) {
      it.classList.add('actived');
    } else {
      it.classList.remove('actived');
    }
  });
}


function initRadioInput(config, elemId, configKey){
  const elem = T.findElem(elemId);
  setConfigKey(elem, configKey);
  T.bindOnce(elem, 'change', radioInputChanged)
  checkRadioInput(elem, config[configKey]);
  updateBindedElemOfRadio(elem, config[configKey]);
}

function radioInputChanged(e) {
  const container = T.findParentById(e.target, e.target.name);
  const configKey = getConfigKey(container);
  updateConfig(configKey, e.target.value);
  updateBindedElemOfRadio(container, e.target.value);
}

function checkRadioInput(container, value) {
  const radioInputs = T.queryElems(`input[type=radio]`, container);
  radioInputs.forEach((it) => {
    if(it.value === value) {
      it.checked = true;
    }
  });
}

function updateBindedElemOfRadio(container, value) {
  const bindedElems = T.queryElems(`[data-bind-radio=${container.id}]`);
  bindedElems.forEach((it) => {
    if (it.getAttribute('data-bind-value') == value) {
      it.classList.add('actived');
    } else {
      it.classList.remove('actived');
    }
  });
}

function initTextInput(config, elemId, configKey){
  const elem = T.findElem(elemId);
  elem.value = config[configKey];
  setConfigKey(elem, configKey);
  validateInputElem(elem, configKey, config[configKey], (newValue) => {
    updateConfig(configKey, newValue);
  });
  T.bindOnce(elem, 'blur', saveTextValueByEvent);
}

function initColorInput(config, elemId, configKey) {
  const elem = T.findElem(elemId);
  elem.value = config[configKey];
  setConfigKey(elem, configKey);
  T.bindOnce(elem, 'change', saveTextValueByEvent);
}

function saveTextValueByEvent(e) {
  const configKey = getConfigKey(e.target);
  let value = e.target.value;
  if (e.target.tagName.toUpperCase() != 'TEXTAREA') {
    value = value.trim();
  }
  e.target.value = value;
  validateInputElem(e.target, configKey, value, (newValue) => {
    if (updateConfig(configKey, newValue)){
      Notify.success(I18N.t('g.hint.update-success'));
    }
  });
}


function validateInputElem(elem, configKey, value, okCallback) {
  hideInputError(elem.id);
  const {ok, errI18n} = MxWcConfig.validate(configKey, value)
  if (ok) {
    if (okCallback) { okCallback(value) }
  } else {
    if (value.match(/^\s*$/)) {
      elem.value = MxWcConfig.getDefault()[configKey];
      if (okCallback) { okCallback(elem.value) }
    } else {
      showInputError(elem.id, errI18n);
    }
  }
}

function hideInputError(inputElemId) {
  const elem = T.queryElem('.input-error' + '.' + inputElemId)
  if (elem) {elem.classList.remove('show')}
}

function showInputError(inputElemId, errI18n) {
  const elem = T.queryElem('.input-error' + '.' + inputElemId)
  if (elem) {
    elem.children[0].innerText = I18N.t(errI18n);
    elem.classList.add('show');
  } else {
    Notify.error(I18N.t(errI18n));
  }
}


function initNumberInput(config, elemId, configKey) {
  const elem = T.findElem(elemId);
  elem.value = config[configKey];
  setConfigKey(elem, configKey);
  T.bindOnce(elem, 'change', NumberInputChanged)
}

function NumberInputChanged(e) {
  const elem = e.target;
  const configKey = getConfigKey(elem);
  const value = parseInt(elem.value.trim());
  if (isNaN(value)) {
    Notify.error(I18N.t('g.error.not-a-number'));
    return;
  }
  const min = parseInt(elem.min);
  const max = parseInt(elem.max);
  if (value < min || value > max) {
    Notify.error(I18N.t('g.error.not-in-allowed-range'));
    return;
  }
  elem.value = value.toString();
  if(updateConfig(configKey, value)){
    Notify.success(I18N.t('g.hint.update-success'));
  }
}

function initOptionsInput(config, elemId, configKey){
  const elem = T.findElem(elemId);
  setConfigKey(elem, configKey);
  T.bindOnce(elem, 'click', optionChanged);
  updateOptionsState(elem, config[configKey]);
}

function optionChanged(e) {
  if(e.target.tagName.toUpperCase() === 'A'){
    const elem = e.target.parentElement;
    const configKey = getConfigKey(elem);
    const value = e.target.getAttribute('data-value');
    updateConfig(configKey, value)
    updateOptionsState(elem, value)
  }
}

function updateOptionsState(elem, value) {
  let matched = false;
  T.each(elem.children, (option) => {
    const optionValue = option.getAttribute('data-value');
    if(optionValue === value){
      matched = true
      if(!option.classList.contains('active')) {
        option.classList.add('active');
        updatePageContentIfNeed(elem.id, value);
      }
    } else {
      option.classList.remove('active');
    }
  });
  if(!matched && elem.children.length > 0) {
    // If reach here (matched is false). It means the configured value is not in options.
    // So we choose first child as configured value.
    const firstValue = elem.children[0].getAttribute('data-value');
    const configKey = getConfigKey(elem);
    // We've got two config update here.
    // To avoid race condition, execute this update next tick.
    setTimeout(() => updateConfig(configKey, firstValue), 0)
    updateOptionsState(elem, firstValue);
  }
}

function updatePageContentIfNeed(elemId, value) {
  switch(elemId) {
    case 'storage-handler':
      storageHandlerChanged(value);
      break;
    case 'offline-page-handler':
      offlinePageHandlerChanged(value);
      break;
    case 'refresh-history-handler':
      refreshHistoryHandlerChanged(value)
      break;
  }
}

function storageHandlerChanged(value) {
  const sectionId = 'setting-storage';
  getHandlerStatusAndRenderNotice(sectionId, 'storage', value)
  .then(({isEnabled, handlerInfo, section}) => {
    T.queryElem('.save-format', section).classList.remove('active');
    T.queryElem('.local-path', section).classList.remove('active');
    if(isEnabled && handlerInfo.ready) {
      renderSaveFormat(section, handlerInfo.supportFormats);
      if(['Browser', 'NativeApp'].indexOf(value) > -1) {
        renderLocalPathOptions(section);
      }
    }
  });
}

function offlinePageHandlerChanged(value) {
  const sectionId = 'setting-offline-page';
  getHandlerStatusAndRenderNotice(sectionId, 'offline-page', value)
  .then(({isEnabled, handlerInfo, section}) => {
    const elem = T.queryElem('.detail', section);
    elem.classList.remove('active');
    if(isEnabled && handlerInfo.ready) {
      elem.classList.add('active');
    }
  });
}

function refreshHistoryHandlerChanged(value) {
  const sectionId = 'setting-refresh-history';
  getHandlerStatusAndRenderNotice(sectionId, 'refresh-history', value)
  .then(({isEnabled, handlerInfo, section}) => {
    const elem = T.queryElem('.detail', section);
    elem.classList.remove('active');
    if(isEnabled && handlerInfo.ready) {
      elem.classList.add('active');
    }
  });
}

function getHandlerStatusAndRenderNotice(sectionId, name, value) {
  return new Promise(function(resolve, reject) {
    const section = T.findElem(sectionId);
    const msgA = getNoticeMsg('info', [name, T.deCapitalize(value)]);
    const msgB = getNoticeMsg('warning', [name, T.deCapitalize(value)]);
    renderNoticeBox(section, 'info', msgA);
    renderNoticeBox(section, 'warning', msgB);
    MxWcHandler.isReadyByName(value)
    .then((result) => {
      const {ok, message, enabled, handlerInfo} = result;
      if(ok) {
        renderNoticeBox(section, 'danger', '$BLANK');
      } else {
        renderNoticeBox(section, 'danger', message);
      }
      resolve({
        isEnabled: enabled,
        handlerInfo: handlerInfo,
        section: section
      })
    });
  });
}

function renderLocalPathOptions(section) {
  const div = T.queryElem('.local-path', section);
  div.classList.add('active');
  MxWcConfig.load().then((config) => {
    initSettingPath(config);
  });
}

function renderSaveFormat(section, formats) {
  const div = T.queryElem('.save-format', section);
  div.classList.add('active');
  const html = MxWcTemplate.options.render({
    type: 'save-format',
    options: formats
  });
  const elem = T.queryElem('#save-format', section);
  T.setHtml(elem, html);
  MxWcConfig.load().then((config) => {
    initSettingSaveFormat(config)
  });
}


function getNoticeMsg(type, names) {
  return I18N.t('notice', type, ...names);
}

function renderNoticeBox(wrapper, type, msg) {
  const box = T.queryElem(`.${type}-box`, wrapper);
  if(msg === "$BLANK") {
    T.setHtml(box, '');
  } else {
    renderNotice(type, box, msg);
  }
}


// type: 'info', 'danger', 'warning'
function renderNotice(type, box, message) {
  const template = T.findElem('notice-tpl').innerHTML;
  const html = T.renderTemplate(template, {
    type: type,
    message: message
  });
  T.setHtml(box, html);
};


/* button click handlers */

function generateClippingJsNow(e) {
  ExtMsg.sendToBackground({
    type: 'generate.clipping.js'
  }).then((result) => {
    if(result.ok) {
      const label = T.findElem('last-generate-clipping-js-time');
      T.setHtml(label, result.time);
      Notify.success(I18N.t('label.generate-now-success'));
    } else {
      Notify.error(I18N.t(result.message))
    }
  });
  Notify.success(I18N.t('label.generate-now-msg-sent'));
}

function refreshHistoryNow(e) {
  ExtMsg.sendToBackground({
    type: 'history.refresh'
  }).then((result) => {
    if(result.ok) {
      const label = T.findElem('last-refresh-history-time');
      T.setHtml(label, result.time);
      Notify.success(I18N.t('label.refresh-now-success'));
    } else {
      Notify.error(I18N.t(result.message))
    }
  });
  Notify.success(I18N.t('label.refresh-now-msg-sent'));
}


function testDownloadRequest(e) {

  const section = T.findElem('setting-handler-browser');
  ExtMsg.sendToBackground({
    type: 'test.downloadRequest'
  }).then(
    () => {
      // success
      const msg = I18N.t('notice.success.download-request-test');
      renderNoticeBox(section, 'success', msg);
    },
    (errMsg) => {
      // render errors
      let msg = I18N.t('notice.danger.download-request-intercepted');
      msg = msg.replace('$MESSAGE', errMsg);
      renderNoticeBox(section, 'danger', msg);
    }
  );
}

async function resetToDefault(e) {
  const confirmed = window.confirm(I18N.t('label.reset-to-default-warning'));
  if (confirmed) {
    try {
      // reset config
      await MxWcConfig.reset();
      await resetAssistant();
      // reset selection's backend
      await ExtMsg.sendToBackend('selection', {type: 'reset'});
      Notify.success(I18N.t('label.reset-to-default-success'));
      renderSection('setting-reset-and-backup');
    } catch(e) {
      Notify.error(e.message);
    }
  }
}

function restoreFromFile(e) {
  const input = T.findElem('restore-file-picker');
  input.value = '';
  input.click();
}

function backupToFile(e) {
  ExtMsg.sendToBackground({type: 'backup-to-file'})
}

function handleRestoreFilePicker(e) {
  const input = e.target;
  const file = input.files[0];
  if ( file === undefined || file.name === '' ) { return; }
  if ( file.type.indexOf('json') == -1 ) { return; }
  const filename = file.name;
  const reader = new FileReader();
  reader.onload = function(ev) {
    const text = ev.target.result
    try {
      const {data} = JSON.parse(text);
      restoreData(data).then(
        () => {
          Notify.success(I18N.t('label.restore-from-file-success'));
          renderSection('setting-reset-and-backup');
        },
        (e) => {
          Notify.error(e.message);
        }
      ).catch((e) => {
        Notify.error(e.message);
      });
    } catch(e) {
      Notify.error(e.message);
    }
  }
  reader.readAsText(file);
}

async function restoreData(data) {
  const restoredData = {};
  let assistantData = false;
  let selectionData = false;
  for (let key in data) {
    if (key == 'config') {
      const migratedConfig = await ExtMsg.sendToBackground({
        type: 'migrate-config',
        body: data.config
      });
      restoredData[key] = migratedConfig;
    } else if (key.startsWith('history.page.cache')) {
      restoredData[key] = data[key];
    } else if (key.startsWith('assistant')) {
      restoredData[key] = data[key];
      assistantData = true;
    } else if (key.startsWith('selectionStore')) {
      restoredData[key] = data[key];
      selectionData = true;
    }
  }
  data = null;
  await MxWcStorage.setMultiItem(restoredData);

  // restart storage relative services
  const promises = [];
  if (assistantData) {
    promises.push(ExtMsg.sendToBackend('assistant', {type: 'restart'}));
  }
  if (selectionData) {
    promises.push(ExtMsg.sendToBackend('selection', {type: 'restart'}));
  }
  await Promise.all(promises);
}

function renderSection(id) {
  const container = T.queryElem('.content');
  const template = getSectionTemplate(id);
  let render = () => {};
  switch(id) {
    case 'setting-general':
      render = renderSectionGeneral;
      break;
    case 'setting-storage':
      render = renderSectionStorage;
      break;
    case 'setting-html':
      render = renderSectionHtml;
      break;
    case 'setting-markdown':
      render = renderSectionMarkdown;
      break;
    case 'setting-assistant':
      render = renderSectionAssistant;
      break;
    case 'setting-user-script':
      render = renderSectionUserScript;
      break;
    case 'setting-user-command':
      render = renderSectionUserCommand;
      break;
    case 'setting-handler-browser':
      render = renderSectionHandlerBrowser;
      break;
    case 'setting-handler-native-app':
      render = renderSectionHandlerNativeApp;
      break;
    case 'setting-handler-wiz-note-plus':
      render = renderSectionHandlerWizNotePlus;
      break;
    case 'setting-offline-page':
      render = renderSectionOfflinePage;
      break;
    case 'setting-refresh-history':
      render = renderSectionRefreshHistory;
      break;
    case 'setting-advanced':
      render = renderSectionAdvanced;
      break;
    case 'setting-reset-and-backup':
      render = renderSectionResetAndBackup;
      break;
    default:
      throw new Error("Unknown section " + id)
  }
  render(id, container, template);
}

/*
function getSectionRender(sectionId) {
  const fnName = 'renderSection' + T.capitalize(sectionID.replace('^setting-', ''));
  return this[fnName];
}
*/

function getSectionTemplate(sectionId) {
  const tplId = ["section",  sectionId, "tpl"].join("-");
  return T.findElem(tplId).innerHTML;
}


function renderSectionGeneral(id, container, template) {
  const html = T.renderTemplate(template, {
    host: window.location.origin
  });
  T.setHtml(container, html);
  MxWcConfig.load().then((config) => {
    initSettingGeneral(config);
  });
}

function renderSectionHtml(id, container, template) {
  const html = template;
  T.setHtml(container, html);
  MxWcConfig.load().then((config) => {
    initSettingHtml(config);
  });
}

function renderSectionMarkdown(id, container, template) {
  const html = template;
  T.setHtml(container, html);
  MxWcConfig.load().then((config) => {
    initSettingMarkdown(config);
  });
}

function renderSectionAdvanced(id, container, template) {
  const html = template;
  T.setHtml(container, html);
  MxWcConfig.load().then((config) => {
    initSettingAdvanced(config);
  });
}

function renderSectionResetAndBackup(id, container, template) {
  const html = template;
  T.setHtml(container, html);
  MxWcConfig.load().then((config) => {
    initSettingResetAndBackup(config);
  });
  bindClickListener('backup-to-file', backupToFile);
  bindClickListener('restore-from-file', restoreFromFile);
  bindClickListener('reset-to-default', resetToDefault);
  bindChangeListener('restore-file-picker', handleRestoreFilePicker);
}

function renderSectionStorage(id, container, template) {
  const html = template;
  T.setHtml(container, html);
  MxWcConfig.load().then((config) => {
    initSettingStorage(config);
  });
}


// ======================================
// Assistant begin
// ======================================
const AssistantDefault = {
  examplePlanText: "["
    + '\n  {'
    + '\n    "name" : "A example plan",'
    + '\n    "pattern" : "https://example.org/posts/**/*.html",'
    + '\n    "actions": ['
    + '\n      {"pick" : ".post"},'
    + '\n      {"hide" : [".post-btns", "div.comments"]}'
    + '\n    ]'
    + '\n  }'
    + '\n]',
  exampleGlobalPlanText: '{\n  "name": "the global plan",\n  "disabled": true\n}',
  defaultIndexUrl: MxWcLink.get('assistant.subscription.default.index'),
  defaultTagStatus: "",
}

function renderSectionAssistant(id, container, template) {
  const html = T.renderTemplate(template, {});
  T.setHtml(container, html);
  renderSubscriptions();
  MxWcStorage.get('assistant.global-plan.text', AssistantDefault.exampleGlobalPlanText).then((value) => {
    T.setElemValue('#global-plan', value);
  });
  MxWcStorage.get('assistant.custom-plan.text', AssistantDefault.examplePlanText).then((value) => {
    T.setElemValue('#custom-plans', value);
  });
  MxWcStorage.get('assistant.public-plan.subscription-text').then((value) => {
    const subscription = (value || AssistantDefault.defaultIndexUrl);
    T.setElemValue('#plan-subscription', subscription);
    if (!value) {
      MxWcStorage.set('assistant.public-plan.subscription-urls', [AssistantDefault.defaultIndexUrl]);
    }
  });
  MxWcStorage.get('assistant.default-tag-status', AssistantDefault.defaultTagStatus).then((value) => {
    T.setElemValue('#default-tag-status', value)
  });
  MxWcConfig.load().then((config) => {
    initSettingAssistant(config);
  });
  bindClickListener('update-public-plan-now', updatePublicPlans);
  bindClickListener('save-plan-subscription', savePlanSubscription);
  bindClickListener('save-custom-plan', saveCustomPlan);
  bindClickListener('save-global-plan', saveGlobalPlan);
  bindClickListener('save-default-tag-status', saveDefaultTagStatus);
}

function renderSubscriptions() {
  MxWcStorage.get('assistant.public-plan.subscriptions', [])
    .then((subscriptions) => {
      const elem = T.queryElem('.public-plan .subscription-list');
      if (subscriptions.length > 0) {
        const tpl = T.findElem('subscription-tpl').innerHTML;
        const html = T.map(subscriptions, (it) => {
          return T.renderTemplate(tpl, {
            name: it.name,
            size: it.size,
            version: it.latestVersion,
            t: btoa(it.url),
          });
        }).join('');
        T.setHtml(elem,  html);
      } else {
        T.setHtml(elem, '<tr><td colspan="4" i18n="g.hint.no-record" align="center"></td></tr>');
      }
    });
}

function savePlanSubscription(e) {
  const text = T.getElemValue('#plan-subscription');
  const urls = [];
  const errors = [];

  T.eachNonCommentLine(text, (lineText) => {
    try {
      const url = new URL(lineText);
      urls.push(lineText);
    } catch(e) {
      errors.push([e.message, T.escapeHtml(lineText)].join(": "));
    }
  });

  if (errors.length > 0) {
    Notify.error(errors.join('\n'));
  } else {
    MxWcStorage.set('assistant.public-plan.subscription-text', text);
    MxWcStorage.set('assistant.public-plan.subscription-urls', urls);
    Notify.success(I18N.t('g.hint.saved'));
  }
}

function updatePublicPlans(e) {
  MxWcStorage.get('assistant.public-plan.subscription-urls', []).then((urls) => {
    ExtMsg.sendToBackend('assistant', {
      type: 'update.public-plan',
      body: {urls: urls}
    }).then((result) => {
        const logs = [];
        result.forEach((it) => {
          if (it.ok) {
            const arr = [it.subscription.url];
            if (it.updated) {
              arr.push(" (updated)");
            } else {
              arr.push(" (up to date)");
            }
            logs.push(renderLog(arr.join('')));
          } else {
            logs.push(renderLog(it.message, true));
          }
        })

        const elem = T.findElem('update-public-plan-log');
        if (logs.length > 0) {
          logs.push(renderLog("Done! " + T.currentTime().time()));
        } else {
          logs.push("Not subscription");
        }
        T.setHtml(elem, logs.join(''));
        elem.classList.add('active');
        renderSubscriptions();
      })
  });
}

function renderLog(log, isError) {
  if (isError) {
    return `<div class="log failure">[failure] ${log}</div>`;
  } else {
    return `<div class="log success">&gt; ${log}</div>`;
  }
}

function saveGlobalPlan(e) {
  const elem = T.findElem('global-plan');
  try {
    const plan = JSON.parse(elem.value);
    if (plan.constructor == Object) {
      ExtMsg.sendToBackend('assistant', {
        type: 'save.global-plan',
        body: {planText: elem.value}
      }).then((result) => {
        if (result.ok) {
          Notify.success(I18N.t('g.hint.saved'));
        } else {
          Notify.error(result.message);
        }
      })
    } else {
      Notify.error(I18N.t('g.error.value-invalid'));
    }
  } catch(e) {
    Notify.error(I18N.t('g.error.value-invalid'));
  }
}

function saveDefaultTagStatus(e) {
  const elem = T.findElem('default-tag-status');
  if (elem) {
    const defaultTagStatus = elem.value.trim();
    MxWcStorage.set('assistant.default-tag-status', defaultTagStatus);
    Notify.success(I18N.t('g.hint.saved'));
  }
}

function saveCustomPlan(e) {
  const elem = T.findElem('custom-plans');
  try {
    const plans = JSON.parse(elem.value);
    if (plans instanceof Array) {
      ExtMsg.sendToBackend('assistant', {
        type: 'save.custom-plan',
        body: {planText: elem.value}
      }).then((result) => {
        if (result.ok) {
          Notify.success(I18N.t('g.hint.saved'));
        } else {
          Notify.error(result.message);
        }
      })
    } else {
      Notify.error(I18N.t('g.error.value-invalid'));
    }
  } catch(e) {
    Notify.error(I18N.t('g.error.value-invalid'));
  }
}

async function resetAssistant() {
  await resetGlobalPlan();
  await resetCustomPlan();
  await resetPublicPlan();
}

function resetGlobalPlan() {
  return ExtMsg.sendToBackend('assistant', {
    type: 'save.global-plan',
    body: {planText: AssistantDefault.exampleGlobalPlanText}
  });
}

function resetCustomPlan() {
  return ExtMsg.sendToBackend('assistant', {
    type: 'save.custom-plan',
    body: {planText: AssistantDefault.examplePlanText}
  });
}

function resetPublicPlan() {
  return MxWcStorage.remove([
    'assistant.public-plan.subscription-text',
    'assistant.public-plan.subscription-urls',
  ]).then(() => {
    ExtMsg.sendToBackend('assistant', {
      type: 'update.public-plan',
      body: {urls: []}
    });
  });
}

// ======================================
// Assistant end
// ======================================


function renderSectionUserScript(id, container, template) {
  const html = template;
  T.setHtml(container, html);
  const refreshBtn = T.findElem('refresh-user-scripts');
  T.bindOnce(refreshBtn, 'click', renderUserScripts);
  renderUserScripts();
}

function refreshUserScripts() {
  const elem = T.findElem('setting-user-script');
  if (elem) { renderUserScripts() }
}


function renderUserScripts() {
  MxWcStorage.get('user-script.scripts', []).then((scripts) => {
    const elem = T.queryElem('.user-script .user-script-list');
    if (scripts.length > 0) {
      const tpl = T.findElem('user-script-tpl').innerHTML;
      const html = T.map(scripts, (it) => {
        return T.renderTemplate(tpl, {
          name: it.name,
          version: it.version,
          author: it.author,
          description: it.description,
        });
      }).join('');
      T.setHtml(elem, html);
    } else {
      T.setHtml(elem, '<tr><td colspan="5" i18n="g.hint.no-record" align="center"></td></tr>');
    }
  });
}

function renderSectionUserCommand(id, container, template) {
  const html = template;
  T.setHtml(container, html);
  MxWcConfig.load().then((config) => {
    initSettingUserCommand(config);
  });
  renderShortcutSlotKey();
}

function renderShortcutSlotKey() {
  ExtApi.getAllCommands().then((commands) => {
    commands.forEach((command) => {
      if (command.shortcut) {
        const m = command.name.match(/^slot-(\d+)$/);
        if (m) {
          const id = `shortcut-slot${m[1]}-key`;
          const elem = T.findElem(id);
          if (elem) {
            elem.innerText = I18N.t('title.shortcut.binded') + ": " + command.shortcut;
          }
        }
      }
    });
  });
}

function renderSectionHandlerBrowser(id, container, template) {
  const html = template;
  T.setHtml(container, html);
  MxWcConfig.load().then((config) => {
    initSettingHandlerBrowser(config);
  });
  bindClickListener('test-download-request', testDownloadRequest);
}

async function renderSectionHandlerNativeApp(id, container, template) {
  const html = template;
  T.setHtml(container, html);
  MxWcConfig.load().then((config) => {
    initSettingHandlerNativeApp(config);
  });

  const granted = await renderNativeAppPermissions();
  if (granted) {
    renderNativeAppStatus();
  }
}

const NATIVE_APP_PERMISSIONS = {permissions: ["nativeMessaging"]};
async function renderNativeAppPermissions() {
  const granted = await browser.permissions.contains(NATIVE_APP_PERMISSIONS);

  const wrapper = T.queryElem('#setting-handler-native-app .permissions');
  const requestBtn = T.findElem('request-native-app-permissions');
  const removeBtn = T.findElem('remove-native-app-permissions');

  if (granted) {
    const msg = I18N.t('notice.success.permissions-granted');
    renderNoticeBox(wrapper, 'success', msg);
    renderNoticeBox(wrapper, 'danger', '$BLANK');
    hideElement(requestBtn);
    showElement(removeBtn);
    T.bindOnce(removeBtn, 'click', removeNativeAppPermissionsAndRerender);
  } else {
    const msg = I18N.t('notice.danger.native-app-permissions-not-granted');
    renderNoticeBox(wrapper, 'success', '$BLANK');
    renderNoticeBox(wrapper, 'danger', msg);
    showElement(requestBtn);
    hideElement(removeBtn);
    T.bindOnce(requestBtn, 'click', requestNativeAppPermissionsAndRerender);
  }

  return granted;
}


async function requestNativeAppPermissionsAndRerender() {
  const granted = await browser.permissions.request(NATIVE_APP_PERMISSIONS);
  if (granted) {
    // rerender
    renderNativeAppPermissions();
    renderNativeAppStatus();
  }
}


async function removeNativeAppPermissionsAndRerender() {
  const removed = await browser.permissions.remove(NATIVE_APP_PERMISSIONS);
  if (removed) {
    // disconnect Native App
    try {
      const message = {type: 'handler.native-app.disconnect'};
      await ExtMsg.sendToBackground(message);
    } catch(e){}
    // rerender
    renderNativeAppPermissions();
    hideNativeAppStatus();
  }
}


async function reloadNativeApp() {
  const message = {type: 'handler.native-app.disconnect'};
  await ExtMsg.sendToBackground(message);
  renderNativeAppStatus();
}

function hideNativeAppStatus() {
  const wrapper = T.queryElem('#setting-handler-native-app .status');
  renderNoticeBox(wrapper, 'danger', '$BLANK');// hide error msg
  hideElement('#setting-handler-native-app .item');
  hideElement('#native-app-reload');
  return wrapper;
}


async function renderNativeAppStatus() {
  const wrapper = hideNativeAppStatus();

  try {
    const info = await ExtMsg.sendToBackground({
      type: 'handler.get-info',
      body: {name: 'NativeApp'}
    })


    if(info.ready) {
      showNativeAppItem(
        '#setting-handler-native-app .item.app-version',
        info.version
      );

      if (info.rubyVersion) {
        showNativeAppItem(
          '#setting-handler-native-app .item.ruby-version',
          info.rubyVersion
        );
      }
    } else {
      // render errors
      let msg = I18N.t('notice.danger.native-app-not-ready');
      msg = msg.replace('$MESSAGE', info.message);
      renderNoticeBox(wrapper, 'danger', msg);
    }


    const result = await ExtMsg.sendToBackground({
      type: 'handler.native-app.getDownloadFolder'
    });


    if (result.ok) {
      showNativeAppItem(
        '#setting-handler-native-app .item.download-dir',
        result.downloadFolder
      );
    } else {
      console.debug("failed to getDownloadFolder: ", result.message);
    }


    const reloadBtn = T.findElem('native-app-reload');
    showElement(reloadBtn);
    T.bindOnce(reloadBtn, 'click', reloadNativeApp);
  } catch (e) {
    console.debug(e)
  }
}

function showNativeAppItem(wrapperSelector, value) {
  const wrapper = T.queryElem(wrapperSelector);
  if (wrapper) {
    const elem = T.queryElem('.value', wrapper);
    if (elem) {
      elem.innerHTML = `<code>${value}</code>`;
      showElement(wrapper);
    }
  }
}


// @param {String|Element} selector or element
function showElement(it) {
  accessElement(it, (elem) => elem.classList.remove('hidden'));
}


// @param {String|Element} selector or element
function hideElement(it) {
  accessElement(it, (elem) => elem.classList.add('hidden'));
}

function accessElement(it, action) {
  if (typeof it === 'string') {
    [].forEach.call(T.queryElems(it), action);
  } else {
    action(it);
  }
}

async function renderSectionHandlerWizNotePlus(id, container, template) {
  // Render html template
  const html = template;
  T.setHtml(container, html);
  MxWcConfig.load().then((config) => {
    initSettingHandlerWizNotePlus(config);
  });
  // Check the state of WizNotePlus
  const info = await ExtMsg.sendToBackground({
    type: 'handler.get-info',
    body: {name: 'WizNotePlus'}
  });
  // Notify the user
  const section = T.findElem(id);
  if(info.ready) {
    const msg = I18N.t("notice.danger.wiz-note-plus-ready");
    renderNoticeBox(section, 'info', msg);
  } else {
    let msg = I18N.t('notice.danger.wiz-note-plus-not-ready');
    msg = msg.replace('$MESSAGE', info.message);
    renderNoticeBox(section, 'danger', msg);
  }
}

function renderSectionOfflinePage(id, container, template) {
  MxWcStorage.get('lastGenerateClippingJsTime')
  .then((time) => {
    const html = T.renderTemplate(template, {
      lastGenerateClippingJsTime: (time || ''),
    });
    T.setHtml(container, html);
    MxWcConfig.load().then((config) => {
      initOfflinePage(config)
    });
    bindClickListener('generate-clipping-js-now', generateClippingJsNow);
  });
}

function renderSectionRefreshHistory(id, container, template) {
  MxWcStorage.get('lastRefreshHistoryTime')
  .then((time) => {
    const html = T.renderTemplate(template, {
      lastRefreshHistoryTime: (time || ''),
    });
    T.setHtml(container, html);
    MxWcConfig.load().then((config) => {
      initRefreshHistory(config)
    });
    bindClickListener('refresh-history-now', refreshHistoryNow);
  });
}

function bindClickListener(id, handler) {
  const elem = T.findElem(id);
  T.bindOnce(elem, 'click', handler);
}

function bindChangeListener(id, handler) {
  const elem = T.findElem(id);
  T.bindOnce(elem, 'change', handler);
}

function menuClicked(elem) {
  T.each(elem.parentNode.children, (menu) => {
    menu.classList.remove('active');
  });
  elem.classList.add('active');
  const sectionId = elem.href.split('#')[1];
  renderSection(sectionId);
}


function initSidebar(){
  const sidebar = T.queryElem('.sidebar');
  const sidebarFolder = T.queryElem('.sidebar-folder');
  T.bind(sidebarFolder, 'click', function(e) {
    if(e.target.classList.contains('active')) {
      e.target.classList.remove('active');
      // 9776 ☰
      T.setHtml(e.target, '&#9776;');
    } else {
      e.target.classList.add('active');
      T.setHtml(e.target, ">>");
    }
  }, true);
  T.bind(sidebar, 'click', function(e){
    const elem = e.target;
    if(elem.classList.contains('menu')) {
      menuClicked(elem);
    }
  });
}

function activeMenu() {
  const hash = (window.location.hash || "#setting-general");
  const menu = T.queryElem(`a[href="${hash}"]`);
  setTimeout(() => menuClicked(menu), 0)
}

function init(){
  listenMessage();
  I18N.i18nPage();
  initSidebar();
  MxWcLink.listen(document.body);
  activeMenu();
}

init();
