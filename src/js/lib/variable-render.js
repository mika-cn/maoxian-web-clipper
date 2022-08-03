
import T from './tool.js';

const Render = {}
Render.TimeVariables = ['$TIME-INTSEC',
  '$YYYY', '$YY', '$MM', '$DD',
  '$HH', '$mm', '$SS'
];

Render.FilenameVariables = Render.TimeVariables.concat([
  '$TITLE', '$FORMAT', '$DOMAIN']);

Render.AssetFilenameVariables = Render.TimeVariables.concat([
  '$DOMAIN', '$TITLE', '$MD5URL', '$FILENAME', '$EXT']);


Render['$TITLE'] = function(template, v) {
  return template.replace(/\$TITLE/mg, () => {
    return T.sanitizeFilename(v.title);
  });
}

Render.sanitizeTemplate = function(template) {
  // % is a special character in URL
  return template.replace(/%/mg, '_');
}

Render.getTimeVariableRender = function(variable) {
  return function(template, v) {
    const name = variable.replace('$', '');
    const re = new RegExp(variable.replace('$', '\\$'), 'mg');
    return template.replace(re, () => {
      return v.now.str[name];
    })
  }
}

Render.getDefaultRender = function(variable) {
  return function(template, v) {
    const name = T.toJsVariableName(variable.replace('$', ''));
    const re = new RegExp(variable.replace('$', '\\$'), 'mg');
    return template.replace(re, () => {
      return v[name];
    });
  }
}

Render.exec = function(template, v, variables) {
  let s = Render.sanitizeTemplate(template);
  let nowWrapped = false;
  variables.forEach((variable) => {
    let renderFn = Render[variable];
    if(!renderFn) {
      if (Render.TimeVariables.indexOf(variable) > -1) {
        if (!nowWrapped) {
          v.now = T.wrapNow(v.now);
          nowWrapped = true;
        }
        renderFn = Render.getTimeVariableRender(variable);
      } else {
        renderFn = Render.getDefaultRender(variable);
      }
    }
    s = renderFn(s, v);
  });
  return s;
}

export default Render;
