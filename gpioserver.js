let fs = require('fs');
const exec = require('child_process').exec;
let qs = require('querystring');
let http = require('http');
let bcm;

const bcmTemplate = {
    ident: {
        'power-lighting': 0,
        'light-computer': 6,
        'light-workdesk': 5,
    },
    status: {
        'power-lighting': 1,
        'light-computer': 1,
        'light-workdesk': 1,
    }
};

function initBCM() {
    if (!fs.existsSync('gpioserver.data')) {
        fs.writeFileSync('gpioserver.data', JSON.stringify(bcmTemplate, null, 4));
    }
    bcm = JSON.parse(fs.readFileSync('gpioserver.data', 'utf8'));
    Object.keys(bcm.ident).forEach(function(bcmIdent) {
        let status = bcm.status[bcmIdent];
        exec('gpio -g mode ' + bcm.ident[bcmIdent] + ' out');
        exec('gpio -g write ' + bcm.ident[bcmIdent] + ' ' + status);
    });
}

initBCM();

http.createServer(function (req, res) {
    initBCM();
    let get = {
        ident: null,
        status: null,
    };
    get = qs.parse(req.url.split('?')[1]);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.writeHead(200, {'Content-Type': 'text/plain'});
    if (get.init === 'true') {
        res.write(JSON.stringify(bcm));
    } else {
        if (get.status === 'false') get.status = 1;
        if (get.status === 'true') get.status = 0;
        //res.write('identified ' + get.ident + ': BCM ' + bcm.ident[get.ident] + ' -> ' + get.status);
        exec('gpio -g mode ' + bcm.ident[get.ident] + ' out');
        exec('gpio -g write ' + bcm.ident[get.ident] + ' ' + get.status);
        bcm.status[get.ident] = get.status;
        fs.writeFileSync('gpioserver.data', JSON.stringify(bcm, null, 4));
        res.write(JSON.stringify(bcm));
    }
    res.end();
}).listen(1337);

console.info('listening..');

