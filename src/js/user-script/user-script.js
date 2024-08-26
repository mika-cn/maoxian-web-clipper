
//===ScriptMetas==>
// @name "xxx"
// @version "0.1.1"
// @author Me
// @description
//<==ScriptMetas===


const METAS_START = '//===ScriptMetas==>';
const METAS_END   = '//<==ScriptMetas===';

function isValid(meta) {
  return (
       meta
    && meta.name
    && meta.version
    && meta.author
    && meta.description
  );
}

export default {isValid, METAS_START, METAS_END};
