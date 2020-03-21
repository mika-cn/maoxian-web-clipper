export default function(locale) {
  let i18n = {
    previousMonth : 'Previous Month',
    nextMonth     : 'Next Month',
    months        : ['January','February','March','April','May','June','July','August','September','October','November','December'],
    weekdays      : ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
    weekdaysShort : ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
  };

  switch(locale) {
    case 'zh-CN': i18n = {
      previousMonth : '上个月',
      nextMonth     : '下个月',
      months        : ['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'],
      weekdays      : ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'],
      weekdaysShort : ['日','一','二','三','四','五','六']
    }; break;
    default :break;
  }
  return i18n;
}
