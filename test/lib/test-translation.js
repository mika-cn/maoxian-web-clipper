import H from '../helper.js'
import I18N from '../../src/js/lib/translation.js';

function getLocaleEn() {
  return {
    "foo": "Foo",
    "hi": "hi ${name}",
    "multiple": "${a},${b},${c}",
  }
}

function getLocaleZhCN() {
  return {"foo": "cn.Foo"}
}



describe('Translation(I18N)', () => {
  it("translate according to locale", () => {
    let locale = 'en';
    const localeEn = getLocaleEn();
    const localeZhCN = getLocaleZhCN();
    I18N.init( {localeEn, localeZhCN}, locale);
    H.assertEqual(I18N.t('foo'), 'Foo');

    locale = 'zh-CN';
    I18N.init( {localeEn, localeZhCN}, locale);
    H.assertEqual(I18N.t('foo'), 'cn.Foo');
  });

  it("translate and substitude", () => {
    const localeEn = getLocaleEn();
    const localeZhCN = getLocaleZhCN();
    I18N.init( {localeEn, localeZhCN});
    H.assertEqual(I18N.s('hi', {name: 'js'}), 'hi js');
    H.assertEqual(I18N.s('multiple', {a: '1', b: '2', c: '3'}), '1,2,3');
  });
});
