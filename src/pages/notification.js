
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
}


function renderNotifications(){
  MxWcNotification.get((notifications) => {
    console.log(notifications.length);
    const title = "<center><h1>" + t('notification.title') + "</h1></center>";
    const hint = "<div class='notice-light'>" + t('notification.hint') + '</div>';
    const html = title + hint + MxWcTemplate.notifications.render({
      notifications: notifications});
    T.queryElem('.main').innerHTML = html;
  })
}


function init(){
  renderNotifications();
  setTimeout(bindEventListener, 0);
  //MxWcNotification.clear();
}

init();
