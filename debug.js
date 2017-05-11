const Qew = require('./index');


const qew = new Qew(2, 0, (result, numDone, numFailed, done) => {
    console.log(result);
    console.log(numDone, numFailed);
    if (numDone + numFailed >= 10) {
        console.log('All dunged out!!');
        done();
    }
}, (result) => console.error(result));

for (let i = 0; i < 20; i++) {
    qew.push(() => ding(2000));
}



function ding(delay) {
    return new Promise((resolve, reject) => {
        setTimeout(function() {
            if (Math.random() < .95) {
                resolve('ding!');
            } else {
                reject('dong...')
            }
        }, delay);
    });
}
