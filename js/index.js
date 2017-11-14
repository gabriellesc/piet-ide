import 'babel-polyfill';
import React from 'react';
import ReactDOM from 'react-dom';

import Controls from './controls.js';
import Grid from './grid.js';
import Debugger from './debugger.js';

import { compile, run } from './compiler.js';

import { commands } from './orderedCommands.js';
import { colours, WHITE, BLACK } from './colours.js';

/* re-order commands to correspond to colours order based on currently-selected colour
 * NOTE: this was used to compute all command orders, which were saved to be re-used;
 * the function is no longer in use
const mapCommandsToColours = baseColour => {
    const rotateArray = (array, pivot) => array.slice(-pivot).concat(array.slice(0, -pivot));

    let hShift = baseColour % 6;
    let lShift = Math.floor(baseColour / 6);

    let map = [
        rotateArray(initCommands.slice(0, 6), hShift),
        rotateArray(initCommands.slice(6, 12), hShift),
        rotateArray(initCommands.slice(12), hShift),
    ];

    map = rotateArray(map, lShift);
    return [...map[0], ...map[1], ...map[2]];
};
*/

const HEIGHT = 10, // initial height
    WIDTH = 10; // initial width

const appState = {
    listeners: [],

    height: HEIGHT,
    width: WIDTH,
    cellDim: Math.min(30, (window.innerWidth - 40) / WIDTH), ///// NEEDS RESIZING - ALSO MAKE SURE CELLS ARE SQUARE

    grid: Array(HEIGHT)
        .fill(0)
        .map(_ => Array(WIDTH).fill(WHITE)), // fill grid with white initially

    blockSizes: Array(HEIGHT)
        .fill(0)
        .map(_ => Array(WIDTH).fill(HEIGHT * WIDTH)),

    selectedColour: 0,

    commands: commands[0],

    paintMode: 0, // 0 (brush) or 1 (fill); use brush paint mode initially

    cellInFocus: null,
    displayBS: false, // initially do not show block sizes

    // add listener
    subscribe: (listener => appState.listeners.push(listener)).bind(this),
    // notify listeners
    notify: (() => appState.listeners.forEach(listener => listener())).bind(this),

    resize: (({ height, width }) => {
        appState.height = height;
        appState.width = width;

        appState.grid = Array(height)
            .fill(0)
            .map(_ => Array(width).fill(WHITE));

        appState.blockSizes = Array(height)
            .fill(0)
            .map(_ => Array(width).fill(height * width));

        appState.notify();
    }).bind(this),

    selectColour: (colour => {
        appState.selectedColour = colour;

        // reorder commands
        if (colour == WHITE || colour == BLACK) {
            // colour is white or black
            appState.commands = [];
        } else {
            appState.commands = commands[colour];
        }

        appState.notify();
    }).bind(this),

    // paint this cell/block the currently-selected colour
    paint: ((row, col) => {
        if (appState.paintMode == 0) {
            // brush paint mode
            appState.grid[row][col] = appState.selectedColour;
        } else {
            // bucket paint mode
            if (appState.grid[row][col] != appState.selectedColour) {
                (function paintBlock(row, col, origColour) {
                    appState.grid[row][col] = appState.selectedColour;

                    // above
                    if (row - 1 >= 0 && appState.grid[row - 1][col] == origColour) {
                        paintBlock(row - 1, col, origColour);
                    }
                    // below
                    if (row + 1 < appState.height && appState.grid[row + 1][col] == origColour) {
                        paintBlock(row + 1, col, origColour);
                    }
                    // left
                    if (col - 1 >= 0 && appState.grid[row][col - 1] == origColour) {
                        paintBlock(row, col - 1, origColour);
                    }
                    // right
                    if (col + 1 < appState.width && appState.grid[row][col + 1] == origColour) {
                        paintBlock(row, col + 1, origColour);
                    }
                })(row, col, appState.grid[row][col]);
            }
        }

        // recompute block sizes
        appState.blockSizes = appState.computeBlockSizes();

        appState.notify();
    }).bind(this),

    // toggle paint mode between brush and fill
    selectPaintMode: (mode => {
        appState.paintMode = mode;

        appState.notify();
    }).bind(this),

    setCellInFocus: ((row, cell) => {
        if (row == null) {
            appState.cellInFocus = null;
        } else {
            appState.cellInFocus = [row, cell];
        }

        appState.notify();
    }).bind(this),

    // toggle block size display mode
    toggleDisplayBS: (() => {
        appState.displayBS = !appState.displayBS;

        appState.notify();
    }).bind(this),

    exportPng: (scale => {
        // create a new image
        let image = new Jimp(appState.width, appState.height);

        // map colour strings to hex values
        let colourMap = colours.map(colour => +('0x' + colour.slice(1) + 'FF'));

        // set each pixel to its corresponding colour in the grid
        image.scan(0, 0, appState.width, appState.height, (x, y) => {
            image.setPixelColour(colourMap[appState.grid[y][x]], x, y);
        });

        // scale the image
        image.scale(scale);

        image.getBase64(Jimp.MIME_PNG, (_, uri) => {
            window.open(uri);
        });
    }).bind(this),

    importImg: file => {
        let reader = new FileReader();

        // map hex values to colour indices
        let colourMap = {};
        colours.forEach((colour, i) => (colourMap[+('0x' + colour.slice(1) + 'FF')] = i));

        reader.onload = event => {
            Jimp.read(Buffer.from(event.target.result), function(err, img) {
                appState.height = img.bitmap.height;
                appState.width = img.bitmap.width;
                appState.cellDim = Math.min(30, (window.innerWidth - 40) / img.bitmap.width);

                appState.grid = Array(img.bitmap.height)
                    .fill(0)
                    .map(_ => Array(img.bitmap.width));

                img.scan(0, 0, img.bitmap.width, img.bitmap.height, (x, y) => {
                    var colour = img.getPixelColor(x, y);
                    // treat non-standard colour as white
                    if (colourMap[colour] == undefined) {
                        appState.grid[y][x] = WHITE;
                    } else {
                        appState.grid[y][x] = colourMap[colour];
                    }
                });

                // compute block sizes
                appState.blockSizes = appState.computeBlockSizes();

                appState.notify();
            });
        };
        reader.readAsArrayBuffer(file);
    },

    // return the number of cells in the colour block that contains each cell
    computeBlockSizes: (() => {
        let blockSizes = Array(appState.height)
            .fill(0)
            .map(_ => Array(appState.width).fill(-1));

        function labelBlock(row, col, blockColour, label) {
            // cell has not yet been examined and is part of the current block
            if (blockSizes[row][col] == -1 && appState.grid[row][col] == blockColour) {
                blockSizes[row][col] = label;

                return (
                    1 +
                    (row - 1 >= 0 && labelBlock(row - 1, col, blockColour, label)) + // left
                    (row + 1 < appState.height && labelBlock(row + 1, col, blockColour, label)) + // right
                    (col - 1 >= 0 && labelBlock(row, col - 1, blockColour, label)) + // above
                    (col + 1 < appState.width && labelBlock(row, col + 1, blockColour, label)) // below
                );
            }

            return 0;
        }

        // label each cell
        let labelMap = [];
        for (var i = 0; i < appState.height; i++) {
            for (var j = 0; j < appState.width; j++) {
                // block size has not yet been calculated for this cell
                if (blockSizes[i][j] == -1) {
                    labelMap.push(labelBlock(i, j, appState.grid[i][j], labelMap.length));
                }
            }
        }

        // replace labels with block sizes
        for (var i = 0; i < appState.height; i++) {
            for (var j = 0; j < appState.width; j++) {
                blockSizes[i][j] = labelMap[blockSizes[i][j]];
            }
        }

        return blockSizes;
    }).bind(this),

    // toggle debugger visibility
    toggleDebugger: (() => {
        appState.debug.debugIsVisible = !appState.debug.debugIsVisible;

        // update cell dimensions ******

        appState.notify();
    }).bind(this),

    debug: {
        debugIsVisible: false, // initially, debugger is not visible

        commandList: [],
        runner: null,

        DP: 0, // index into [right, down, left, up], direction pointer initially points right
        CC: 0, // index into [left, right], codel chooser initially points left
        stack: [],
        output: '',

        input: '',
        inputPtr: 0, // pointer into input stream

        currInst: -1, // current instruction (in step mode)

        // reset the debugger to its initial state (but ignore the current command list)
        resetDebugger: (() => {
            appState.debug.DP = 0;
            appState.debug.CC = 0;
            appState.debug.stack = [];
            appState.debug.output = '';
            appState.debug.input = '';
            appState.debug.inputPtr = 0;
            appState.debug.currInst = -1;
            appState.debug.runner = null;
        }).bind(this),

        // receive input from user
        receiveInput: (input => {
            appState.debug.input += String.fromCharCode(input);
        }).bind(this),

        // get one input character from "input stream" (then increment pointer into stream)
        getInput: (() => {
            // insufficient number of chars in input stream
            if (appState.debug.input.length < appState.debug.inputPtr) {
                // ************
            }

            return appState.debug.input[appState.debug.inputPtr++];
        }).bind(this),

        compile: (() => {
            appState.debug.commandList = compile(appState.grid, appState.blockSizes);
            appState.notify();
        }).bind(this),

        // start running program
        start: (() => {
            // re-compile
            appState.debug.commandList = compile(appState.grid, appState.blockSizes);
            appState.debug.resetDebugger();
            appState.notify();

            // create generator
            appState.debug.runner = run(appState.debug.commandList);

            // "continue" from the starting point
            appState.debug.cont();
        }).bind(this),

        // step through program
        step: (() => {
            // if generator does not already exist (i.e. we have not already started stepping
            // through program), re-compile program and create new generator
            if (!appState.debug.runner) {
                appState.debug.commandList = compile(appState.grid, appState.blockSizes);
                appState.debug.resetDebugger();
                appState.notify();

                appState.debug.runner = run(appState.debug.commandList);
            }

            // get next step from generator
            let step = appState.debug.runner.next();
            if (!step.done) {
                appState.debug.currInst++;
                // update state of debugger based on result of current step
                for (var prop in step.value) {
                    appState.debug[prop] = step.value[prop];
                }
                appState.notify();
            } else {
                appState.debug.runner = null; // finished running so clear runner
            }
        }).bind(this),

        // continue running after stepping through the program (run the rest of the program
        // starting from the current step)
        cont: (() => {
            // if we were not already stepping through the program, this function does nothing
            if (appState.debug.runner) {
                // call generator until done
                let step;
                while (!(step = appState.debug.runner.next()).done) {
                    appState.debug.currInst++;
                    // update state of debugger based on result of current step
                    for (var prop in step.value) {
                        appState.debug[prop] = step.value[prop];
                    }
                    appState.notify();
                }

                appState.debug.runner = null; // finished running so clear runner
            }
        }).bind(this),

        // stop debugging (and reset debugger values)
        stop: (() => {
            appState.debug.resetDebugger();
            appState.notify();
        }).bind(this),
    },
};

class App extends React.Component {
    componentDidMount() {
        this.props.appState.subscribe(this.forceUpdate.bind(this, null));
    }

    render() {
        return (
            <div
                style={{
                    width: '100%',
                    marginBottom: '1vh',
                    display: 'grid',
                    gridColumnGap: '1vw',
                    gridRowGap: '1vh',
                    gridTemplateColumns: this.props.appState.debug.debugIsVisible
                        ? '375px 300px auto 200px'
                        : '375px 300px auto 25px',
                    gridTemplateRows: '35px 35px 35px auto',
                    gridTemplateAreas: this.props.appState.debug.debugIsVisible
                        ? `'controls1 cpicker . debug'
                           'controls2 cpicker . debug'
                           'controls3 cpicker . debug'
                           'grid grid grid debug'`
                        : `'controls1 cpicker . dtab'
                           'controls2 cpicker . dtab'
                           'controls3 cpicker . dtab'
			   'grid grid grid grid'`,
                    alignItems: 'center',
                }}>
                <Controls {...this.props.appState} />
                <Grid
                    isRunning={this.props.appState.debug.runner != null}
                    {...this.props.appState}
                />
                {this.props.appState.debug.debugIsVisible && (
                    <Debugger
                        isRunning={this.props.appState.debug.runner != null}
                        {...this.props.appState}
                    />
                )}
            </div>
        );
    }
}

document.addEventListener('DOMContentLoaded', () => {
    ReactDOM.render(<App appState={appState} />, document.getElementById('root'));
});
