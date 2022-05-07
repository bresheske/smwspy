const smw = require('./utils/smw');
const chalk = require('chalk');
const log = console.log;

// more or less a singleton variable for the process
let process = null;






// async context because whynot
(async() => {

    // get our process, if we can't find it just kick out.
    process = smw.openProcess();
    if (!process) {
        log(chalk.red('Error: Could not find RetroArch & Snes9x Core Instance.'));
        log(chalk.red('Please ensure SMW is running and try again.'));
        return;
    }


    

})();