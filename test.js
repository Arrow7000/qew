const Qew = require('./dist/qew.js');
const q = new Qew();

q.pushProm(async() => await 'hi')
    .then(console.log)
    .catch(console.error)
