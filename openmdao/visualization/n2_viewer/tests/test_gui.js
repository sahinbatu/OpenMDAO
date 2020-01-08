#!/usr/bin/env node

const argv = require('yargs').argv;
const puppeteer = require('puppeteer');
const urlPrefix = 'file://';

// Amount to wait when expecting a transition.
// Set later on by getting the value from the page:
let transitionWait = -1;

// The amount to wait when there's no transition:
const normalWait = 10;

// The models to create N2 files from:
const n2Files = argv.n2files.split(',');
// const n2Files = [ '/Users/tkollar/work/om/n2/openmdao/visualization/n2_viewer/tests/gui_test_models/double_sellar_N2_TEST.html'];

// Updated at each test to describe the current action:
let currentTestDesc = '';

async function doGenericToolbarTests(page) {
    const genericToolbarTests = [
        { 'desc': 'Collapse All Outputs button', 'x': 275, 'y': 22, 'wait': transitionWait },
        { 'desc': 'Uncollapse All button', 'x': 205, 'y': 22, 'wait': transitionWait },
        { 'desc': 'Collapse Outputs in View Only button', 'x': 240, 'y': 22, 'wait': transitionWait },
        { 'desc': 'Uncollapse In View Only button', 'x': 165, 'y': 22, 'wait': transitionWait },
        { 'desc': 'Show Legend (on) button', 'x': 430, 'y': 22, 'wait': normalWait },
        { 'desc': 'Show Legend (off) button', 'x': 431, 'y': 22, 'wait': normalWait },
        { 'desc': 'Show Path (on) button', 'x': 390, 'y': 22, 'wait': normalWait },
        { 'desc': 'Show Path (off) button', 'x': 391, 'y': 22, 'wait': normalWait },
        { 'desc': 'Toggle Solver Names (on) button', 'x': 465, 'y': 22, 'wait': transitionWait },
        { 'desc': 'Toggle Solver Names (off) button', 'x': 466, 'y': 22, 'wait': transitionWait },
        { 'desc': 'Clear Arrows and Connection button', 'x': 355, 'y': 22, 'wait': normalWait },
        { 'desc': 'Help (on) button', 'x': 615, 'y': 22, 'wait': normalWait },
        { 'desc': 'Help (off) button', 'x': 616, 'y': 22, 'wait': normalWait },
    ];

    for (let test of genericToolbarTests) {
        currentTestDesc = test.desc;
        console.log("  Testing " + test.desc);
        await page.mouse.click(test.x, test.y, { 'button': 'left', 'delay': 5 });
        await page.waitFor(test.wait);
        // await page.screenshot({ path: 'circuit_' + test.x + '.png' }, { 'fullPage': true });
    }
}

/**
 * Set up the event handlers that are critical for catching errors. When
 * an error is encountered, exit with status > 0 to indicate a failure.
 */
function setupErrorHandlers(page) {
    page.on('console', msg => {
        switch (msg.type()) {
            case 'warning':
                console.log("Warning: " + currentTestDesc)
                for (let i = 0; i < msg.args().length; ++i)
                    console.log(`${i}: ${msg.args()[i]}`);
                break;
            case 'error':
                console.log("Error: " + currentTestDesc + " failed")
                for (let i = 0; i < msg.args().length; ++i)
                    console.log(`${i}: ${msg.args()[i]}`);
                process.exit(1);
                break;
        }
    });

    page.on('pageerror', err => {
        console.log(err)
        process.exit(1);
    });
}

async function runTests() {
    const browser = await puppeteer.launch({
        'defaultViewport': {
            'width': 1280,
            'height': 1024
        }
    });

    const page = await browser.newPage();
    setupErrorHandlers(page);

    for (let n2Filename of n2Files) {
        console.log(
            "\n----------------------------------------\n" +
            n2Filename +
            "\n----------------------------------------"
        );

        // Without waitUntil: 'networkidle0', processing will begin before the page
        // is fully rendered
        await page.goto(urlPrefix + n2Filename, { 'waitUntil': 'networkidle0' });

        // Milliseconds to allow for the last transition animation to finish:
        transitionWait = await page.evaluate(() => N2TransitionDefaults.durationSlow + 100)
        await doGenericToolbarTests(page);
    }

    await browser.close();
};

(async () => { await runTests(); })();
