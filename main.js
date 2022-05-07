const smw = require('./utils/smw');
const chalk = require('chalk');
const clear = require('clear');
const fs = require('fs');
const clui = require('clui');
const clc = require('cli-color');
const nodeProcess = require('process');
const log = console.log;

// more or less a singleton variable for the process
let process = null;
// flag to determine which loop we're in.
const STATE_OPENING_PROCESS = 0;
const STATE_READING_MEMORY = 1;
const STATE_ERROR = 2;
// initial state.
let state = STATE_OPENING_PROCESS;
// error message if we need it.
let error = '';
// refresh rate for pulling memory from the process
const refreshRate = 200;

// this is the function to attempt to open the process.
const refreshFuncOpenProcess = () => {
    clear();

    process = smw.openProcess();
    if (!process) {
        log(chalk.yellow('No RetroArch & Snes9x Instance Found... waiting...'));
        return;
    }
    // otherwise we can set our state to reading memory.
    state = STATE_READING_MEMORY;
};

// function to attempt to read memory from our already open process.
const refreshFuncReadMemory = async () => {
    
    let watchlist = [];
    try {
        watchlist = JSON.parse((await fs.promises.readFile(`./data.json`)).toString());
    }
    catch {
        state = STATE_ERROR;
        error = `Could not open ./data.json.`;
        return;
    }
    // build up our data
    const data = [];
    try {
        // refresh process. stange, but readHexString seems to not
        // fail when the process has ended.
        process = smw.openProcess();
        for (let watch of watchlist) {
            data.push({
                name: watch.name,
                address: watch.address,
                value: smw.readHexString(process, watch.address, parseInt(watch.length), watch.offsetAddress)
            });
        }
    }
    catch (ex){
        // error reading memory - head back to open process state.
        process = null;
        state = STATE_OPENING_PROCESS;
        return;
    }
    
    clear();
    // convert the data to our console output.
    new clui.Line()
        .column('Name', 20, [clc.cyan])
        .column('Address', 16, [clc.white])
        .column('Value', 16, [clc.yellow])
        .fill()
        .output();
    // output all of the things.
    for (let d of data) {
        new clui.Line()
            .column(d.name, 20, [clc.cyan])
            .column(d.address, 16, [clc.white])
            .column(d.value, 16, [clc.yellow])
            .fill()
            .output();
    }
};


// async context because whynot
(async() => {
    // spin up our main process here.
    // every X or so millis, we'll read specific memory from our process
    // and log out our information.
    const refreshFunc = async () => {
        // if we broke, we broke.
        if (state === STATE_ERROR) {
            log(chalk.red(`ERROR: ${error}`));
            nodeProcess.exit(1);
        }
        // otherwise, just do the stuff we need to do.
        else if (state === STATE_OPENING_PROCESS) {
            refreshFuncOpenProcess();
        }
        else if (state === STATE_READING_MEMORY) {
            await refreshFuncReadMemory();
        }

    };
    // spin up timer.
    setInterval(refreshFunc, refreshRate);
})();