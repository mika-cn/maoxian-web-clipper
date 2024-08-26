
import UserScript from './user-script.js';

function parseSourceCode(text) {
  const meta = {};
  let inMetaBlock = false;
  const lines = text.split('\n');
  for (const line of lines) {
    const it = line.trim();
    if (it == UserScript.METAS_START) {
      inMetaBlock = true;
      continue;
    }
    if (it == UserScript.METAS_END) { break }
    if (inMetaBlock) {
      const r = parseMetaLine(it);
      if (r.valid) { meta[r.key] = r.value }
    }
  }
  if (UserScript.isValid(meta)) {
    const script = Object.assign({}, meta, {code: text});
    return {ok: true, script}
  } else {
    return {ok: false}
  }
}


function parseMetaLine(line) {
  const r = line.match(/^\/\/\s*@([a-zA-Z]+)\s+(.+)\s*$/);
  if (r == null) {
    return {valid: false};
  } else {
    const [m, key, value] = r;
    return {valid: true, key, value};
  }
}

export default {parseSourceCode};
