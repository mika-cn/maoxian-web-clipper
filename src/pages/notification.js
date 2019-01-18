
const state = {}

function bindEventListener(){
  const elems = T.queryElems('.notification')
  T.each(elems, (elem) => {
    T.bind(elem, 'click', clickNotification);
  })
}

function clickNotification(e) {
  const target = e.target;
  const id = target.getAttribute('data-id');
  MxWcNotification.remove(id);
  target.parentNode.removeChild(target);
  Notify.success(t('op.delete-success'));
}


function renderNotifications(){
  MxWcNotification.get((notifications) => {
    const template = T.findElem('notification-tpl').innerHTML;
    const items = [];
    notifications.forEach((notification) => {
      items.push(T.renderTemplate(template, {
        id: notification.id,
        type: notification.type,
        content: [notification.createdAt, ' - ', notification.content].join('')
      }));
    });
    T.setHtml('.notifications', items.join(''));
    bindEventListener();
  })
  i18nPage();
}


function init(){
  renderNotifications();
}

init();
