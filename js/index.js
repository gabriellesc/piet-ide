import React from 'react';
import ReactDOM from 'react-dom';

import Controls from './controls.js';
import Grid from './grid.js';
import Debugger from './debugger.js';

const colours = [
    '#FFC0C0', // light red
    '#FFFFC0', // light yellow
    '#C0FFC0', // light green
    '#C0FFFF', // light cyan
    '#C0C0FF', // light blue
    '#FFC0FF', // light magenta
    '#FF0000', // red
    '#FFFF00', // yellow
    '#00FF00', // green
    '#00FFFF', // cyan
    '#0000FF', // blue
    '#FF00FF', // magenta
    '#C00000', // dark red
    '#C0C000', // dark yellow
    '#00C000', // dark green
    '#00C0C0', // dark cyan
    '#0000C0', // dark blue
    '#C000C0', // dark magenta
    '#FFFFFF', // white
    '#000000', // black
];

// initial ordering of commands to match colours
const initCommands = [
    '',
    '+',
    '/',
    '>',
    'dup',
    'in(char)',
    'push',
    '-',
    'mod',
    'pointer',
    'roll',
    'out(num)',
    'pop',
    '*',
    'not',
    'switch',
    'in(num)',
    'out(char)',
];

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

const HEIGHT = 10, // initial height
    WIDTH = 10; // initial width

const appState = {
    listeners: [],

    height: HEIGHT,
    width: HEIGHT,
    cellDim: Math.min(30, (window.innerWidth - 40) / WIDTH), ///// NEEDS RESIZING - ALSO MAKE SURE CELLS ARE SQUARE

    grid: Array(HEIGHT)
        .fill(0)
        .map(_ => Array(WIDTH).fill(18)), // fill grid with white initially

    blockSizes: Array(HEIGHT)
        .fill(0)
        .map(_ => Array(WIDTH).fill(HEIGHT * WIDTH)),

    selectedColour: 0,

    commands: initCommands,

    paintMode: 0, // use brush paint mode initially

    cellInFocus: null,
    displayBS: false, // initially do not show block sizes

    debug: {
        debugIsVisible: false, // initially, debugger is not visible
        DP: 0, // index into [right, down, left, up], direction pointer initially points right
        CC: 0, // index into [left, right], codel chooser initially points left
        stack: [],
        output: '',
        input: false, // whether input is currently requested
        inputPtr: 0, // pointer into input stream
        debugMode: false, // currently debugging
        currInst: null, // current instruction (in step mode)

        step: ((row, col) => {
            let currColour = grid[row][col];

            // find edge of current colour block which is furthest in direction of DP
            let nextColour;

            if (nextColour == 18) {
            } else if (nextColour == 19) {
            } else {
                let inst = appState.commands[nextColour]; // match colour transition to command

                // binary stack operations
                if (['+', '/', '>', '-', 'mod', '*', 'roll'].includes(inst)) {
                    var stack = appState.debug.stack.slice();
                    var op1 = stack.pop(),
                        op2 = stack.pop();

                    // ignore stack underflow
                    if (op1 == undefined || op2 == undefined) {
                        return { stack: appState.debug.stack };
                    }

                    switch (inst) {
                        /* Pops the top two values off the stack, adds them, and pushes the 
			   result back on the stack */
                        case '+':
                            stack.push(op1 + op2);
                            break;

                        /* Pops the top two values off the stack, calculates the integer 
			   division of the second top value by the top value, and pushes the 
			   result back on the stack */
                        case '/':
                            // ignore divide by zero instruction
                            if (op1 == 0) {
                                stack.push(op2);
                                stack.push(op1);
                            } else {
                                stack.push(Math.floor(op2 / op1));
                            }
                            break;

                        /* Pops the top two values off the stack, and pushes 1 on to the stack 
			   if the second top value is greater than the top value, and pushes 0 
			   if it is not greater */
                        case '>':
                            stack.push(op2 > op1 ? 1 : 0);
                            break;

                        /* Pops the top two values off the stack, calculates the second top value
			   minus the top value, and pushes the result back on the stack */
                        case '-':
                            stack.push(op2 - op1);
                            break;

                        /* Pops the top two values off the stack, calculates the second top value
			   modulo the top value, and pushes the result back on the stack. The 
			   result has the same sign as the divisor (the top value). */
                        case 'mod':
                            // divide by 0 error; instruction is ignored
                            if (op1 == 0) {
                                stack.push(op2);
                                stack.push(op1);
                                return { error: 'Divide by zero', stack: stack };
                            }

                            stack.push(op2 - op1 * Math.floor(op2 / op1));
                            break;

                        /* Pops the top two values off the stack, multiplies them, and pushes 
			   the result back on the stack */
                        case '*':
                            stack.push(op1 * op2);
                            break;

                        /* Pops the top two values off the stack and "rolls" the remaining stack
			   entries to a depth equal to the second value popped, by a number of 
			   rolls equal to the first value popped. 
			   A single roll to depth n is defined as burying the top value on the 
			   stack n deep and bringing all values above it up by 1 place. 
			   A negative number of rolls rolls in the opposite direction. */
                        case 'roll':
                            // negative depth error; instruction is ignored
                            if (op2 < 0) {
                                stack.push(op2);
                                stack.push(op1);
                                return { error: 'Negative depth', stack: stack };
                            }

                            for (var roll = 0; roll < op1; roll++) {
                                stack.splice(-op2, 0, stack.slice(-1));
                            }
                            break;
                    }

                    return { stack: stack };
                }

                switch (inst) {
                    /* Pushes a copy of the top value on the stack on to the stack */
                    case 'dup':
                        var stack = appState.debug.stack.slice();
                        var val = stack.pop();

                        if (val == undefined) {
                            return { error: 'Stack underflow' };
                        }
                        stack.push(val);
                        stack.push(val);

                        return { stack: stack };

                    /* Reads a value from STDIN as a character and pushes it on to the stack. */
                    case 'in(char)':
                        // If no input is waiting on STDIN, this is an error and the command is ignored.
                        break;

                    /* Pushes the value of the colour block just exited on to the stack */
                    case 'push':
                        break;

                    /* Pops the top value off the stack and rotates the DP clockwise that many 
		       steps (anticlockwise if negative) */
                    case 'pointer':
                        break;

                    /* Pops the top value off the stack and prints it to STDOUT as a number */
                    case 'out(num)':
                        break;

                    /* Pops the top value off the stack and discards it */
                    case 'pop':
                        break;

                    /* Replaces the top value of the stack with 0 if it is non-zero, and 1 if 
		       it is zero */
                    case 'not':
                        break;

                    /* Pops the top value off the stack and toggles the CC that many times (the
		       absolute value of that many times if negative) */
                    case 'switch':
                        break;

                    /* Reads a value from STDIN as a number and pushes it on to the stack. */
                    case 'in(num)':
                        // If no input is waiting on STDIN, this is an error and the command is ignored.
                        //  If an integer read does not receive an integer value, this is an error and the command is ignored

                        break;

                    /* Pops the top value off the stack and prints it to STDOUT as a character */
                    case 'out(char)':
                        break;
                }
            }
        }).bind(this),
    },

    // add listener
    subscribe: (listener => appState.listeners.push(listener)).bind(this),
    // notify listeners
    notify: (() => appState.listeners.forEach(listener => listener())).bind(this),

    resize: (({ height, width }) => {
        appState.height = height;
        appState.width = width;

        appState.grid = Array(height)
            .fill(0)
            .map(_ => Array(width).fill(18));

        appState.blockSizes = Array(height)
            .fill(0)
            .map(_ => Array(width).fill(height * width));

        appState.notify();
    }).bind(this),

    selectColour: (colour => {
        appState.selectedColour = colour;

        // reorder commands
        if (colour == 18 || colour == 19) {
            // colour is white or black
            appState.commands = [];
        } else {
            appState.commands = mapCommandsToColours(colour);
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
                        appState.grid[y][x] = 18;
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

        // update cell dimensions ********

        appState.notify();
    }).bind(this),
};

class App extends React.Component {
    componentDidMount() {
        this.props.appState.subscribe(this.forceUpdate.bind(this, null));
    }

    render() {
        return [
            <div
                key="main-container"
                style={{
                    float: 'left',
                    marginBottom: '1vh',
                    marginRight: '1vw',
                    width:
                        'calc(100% - 1vw - ' +
                        (this.props.appState.debug.debugIsVisible ? '300px' : '25px') +
                        ')',
                }}>
                <Controls colours={colours} {...this.props.appState} />
                <Grid colours={colours} {...this.props.appState} />
            </div>,
            <Debugger key="debugger" {...this.props.appState} />,
        ];
    }
}

document.addEventListener('DOMContentLoaded', () => {
    ReactDOM.render(<App appState={appState} />, document.getElementById('root'));
});
