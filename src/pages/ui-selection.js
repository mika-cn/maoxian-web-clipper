
"use strict";
(function(){
  const ID = 'mx-wc-iframe-selection';

  function initFrameMsg(){
    const topWindowOrigin = atob(window.location.search.split('=')[1]);
    FrameMsg.init({
      id: ID,
      origin: window.location.origin,
      allowOrigins: [topWindowOrigin]
    });
  }

  FrameMsg.addListener('drawRect', function(msg){
    const {box, color} = msg;
    const elem = document.querySelector('.hover-highlight');
    const boxShadow = `inset 0 0 3px 3px ${color}`;
    elem.style.top     = box.y + 'px';
    elem.style.left    = box.x + 'px';
    elem.style.width   = box.w + 'px';
    elem.style.height  = box.h + 'px';
    elem.style.boxShadow = boxShadow;
    elem.style.display = 'block';
  });

  FrameMsg.addListener('eraseRect', function(msg){
    const elem = document.querySelector('.hover-highlight');
    elem.style.display = 'none';
  });


  initFrameMsg();
  console.log('selection layer ready..');

})();

