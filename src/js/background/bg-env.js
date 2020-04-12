  "use strict";
  const env = {};

  env.requestToken = ['', Date.now(),
    Math.round(Math.random() * 10000)
  ].join('');

  export default env;
