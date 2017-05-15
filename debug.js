const Qew = require('./index');


// const qew = new Qew(2, 0, (result, numDone, numFailed, done) => {
//         console.log(result);
//         console.log(numDone, numFailed);
//         // if (numDone + numFailed >= 10) {
//         //     console.log('All dunged out!!');
//         //     done();
//         // }
//     },
//     err => console.error(err),
//     () => console.log('All dunged out!!'));

// for (let i = 0; i < 20; i++) {
//     qew.push(() => ding(500));
//     // qew.push(ding);
// }

// qew.done(10);

const randomDelay = () => Math.random() * 1000;


const qew = new Qew(3);
const funcs1 = new Array(10).fill(() => ding(1000));

qew.push(funcs1, console.log);

for (let i = 0; i < 5; i++) {
    const prom = qew.pushProm(() => ding(5000));

    prom
        .then(result => console.log('result is', result))
        .catch(err => console.error(err));

}

const funcs2 = new Array(10).fill(() => ding(100));

qew.pushProm(funcs2)
    .then(console.log)


function ding(delay) {
    return new Promise((resolve, reject) => {
        console.log('running dinger');
        setTimeout(function() {
            if (Math.random() < .75) {
                resolve('ding!');
            } else {
                reject(new Error('dong...'));
            }
        }, delay);
    });
}
