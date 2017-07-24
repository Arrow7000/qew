const Qew = require('./dist/qew.js');
const q = new Qew(1, 500);

q.push(async() => await 'push callback', (err, result) => {
    if (err) {
        return console.log(err);
    }
    console.log(result);
});

q.push([
    async() => await 'push callback 1',
    async() => await 'push callback 2',
    async() => {
        throw new Error('push callback 3 fail')
    },
    async() => await 'push callback 4',
], resultArray => {
    console.log(resultArray);
});

q.pushProm(async() => await 'push promise')
    .then(console.log)
    .catch(console.error)

q.pushProm([
        async() => {
            const greeting = 'push promise 1';
            console.log(greeting);
            return await greeting;
        },
        async() => {
            const greeting = 'push promise 2';
            console.log(greeting);
            return await greeting;
        },
        async() => {
            const error = 'push promise 3 fail';
            console.error(error);
            throw new Error(error)
        },
        async() => {
            const greeting = 'push promise 4';
            console.log(greeting);
            return await greeting;
        }
    ])
    .then(console.log)
