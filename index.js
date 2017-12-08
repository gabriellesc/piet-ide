import 'babel-polyfill';
import React from 'react';
import ReactDOM from 'react-dom';

import Controls from './controls.js';
import Grid from './grid.js';
import { DebugTab } from './debugTab.js';
import Debugger from './debugger.js';

import interpret from './interpreter.js';

import { commands } from './orderedCommands.js';
import { colours, WHITE, BLACK } from './colours.js';

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

    blocks: Array(HEIGHT)
        .fill(0)
        .map(_ => Array(WIDTH).fill(0)),

    blockSizes: Array(HEIGHT)
        .fill(0)
        .map(_ => Array(WIDTH).fill(HEIGHT * WIDTH)),

    selectedColour: 0,

    commands: commands[0],

    paintMode: 'BRUSH', // BRUSH, BUCKET, or BP; use brush paint mode initially

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

        appState.blocks = Array(height)
            .fill(0)
            .map(_ => Array(width).fill(0));

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

    // select paint mode (BRUSH, BUCKET, BP)
    selectPaintMode: (mode => {
        appState.paintMode = mode;

        appState.notify();
    }).bind(this),

    // delegate this cell click to the appropriate function, depending on the paint mode
    handleCellClick: ((row, col) => {
        switch (appState.paintMode) {
            case 'BRUSH':
                appState.brushPaint(row, col);
                break;
            case 'BUCKET':
                appState.bucketPaint(row, col);
                break;
            case 'BP':
                appState.debug.toggleBP(row, col);
                break;
        }
    }).bind(this),

    // paint this cell the currently-selected colour
    brushPaint: ((row, col) => {
        appState.grid[row][col] = appState.selectedColour;

        // recompute blocks and block sizes
        let blocks = appState.computeBlocks();
        appState.blocks = blocks.blockMap;
        appState.blockSizes = blocks.blockSizes;

        appState.notify();
    }).bind(this),

    // paint this block the currently-selected colour
    bucketPaint: ((row, col) => {
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

        // recompute blocks and block sizes
        let blocks = appState.computeBlocks();
        appState.blocks = blocks.blockMap;
        appState.blockSizes = blocks.blockSizes;

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

    // export program to png
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
        image.resize(scale * appState.width, scale * appState.height, Jimp.RESIZE_NEAREST_NEIGHBOR);

        image.getBase64(Jimp.MIME_PNG, (_, uri) => {
            window.open(uri);
        });
    }).bind(this),

    // import a program from an image file
    importImgFromFile: (file => {
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

                // compute blocks and block sizes
                let blocks = appState.computeBlocks();
                appState.blocks = blocks.blockMap;
                appState.blockSizes = blocks.blockSizes;

                appState.notify();
            });
        };
        reader.readAsArrayBuffer(file);
    }).bind(this),

    // return the colour blocks in the current grid, with arbitrary unique labels, and the number
    // of cells in each colour block
    computeBlocks: (() => {
        let blockMap = Array(appState.height)
                .fill(0)
                .map(_ => Array(appState.width).fill(-1)),
            blockSizes = Array(appState.height)
                .fill(0)
                .map(_ => Array(appState.width));

        function labelBlock(row, col, blockColour, label) {
            // cell has not yet been examined and is part of the current block
            if (blockMap[row][col] == -1 && appState.grid[row][col] == blockColour) {
                blockMap[row][col] = label;

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
                // cell has not yet been labeled
                if (blockMap[i][j] == -1) {
                    labelMap.push(labelBlock(i, j, appState.grid[i][j], labelMap.length));
                }
            }
        }

        // map block labels to block sizes
        for (var i = 0; i < appState.height; i++) {
            for (var j = 0; j < appState.width; j++) {
                blockSizes[i][j] = labelMap[blockMap[i][j]];
            }
        }

        return { blockMap, blockSizes };
    }).bind(this),

    // toggle debugger visibility
    toggleDebugger: (() => {
        appState.debug.debugIsVisible = !appState.debug.debugIsVisible;

        // update cell dimensions ******

        appState.notify();
    }).bind(this),

    photo: {
        /* one of:
	   CAMERA (video),
	   ANNOTATE-1 (marking program corners), 
	   ANNOTATE-2 (marking codel corners), 
	   ANNOTATE-3 (selecting codel colour),
	   READY (fully annotated and ready for import)
	*/
        photoMode: 'CAMERA',

        camera: null, // intervalId if camera is being run and rendered on canvas

        currPhoto: null, // current photo data (without annotations)
        programCorners: [], // canvas coordinates of the marked program corners
        codelCorners: [], // canvas coordinates of the marked codel corners
        codelColour: null, // selected colour of marked codel

        // reset photo state
        resetPhoto: (() => {
            let video = document.getElementById('hidden-video'),
                canvas = document.getElementById('photo-canvas');

            // clear any existing canvas
            if (canvas) {
                var ctx = canvas.getContext('2d');
                ctx.setTransform(1, 0, 0, 0, 1, 0);
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }

            // close any open video streams
            if (video && video.srcObject) {
                video.srcObject.getTracks().forEach(track => track.stop());
                video.srcObject = null;
            }

            // clear current photo
            appState.photo.currPhoto = null;

            // clear any annotations
            appState.photo.programCorners = [];
            appState.photo.codelCorners = [];
            appState.photo.codelColour = null;

            // stop rendering
            clearInterval(appState.photo.camera);
            appState.photo.camera = null;
        }).bind(this),

        // clear any annotations
        clearAnnotations: (() => {
            appState.photo.programCorners = [];
            appState.photo.codelCorners = [];
            appState.photo.codelColour = null;

            appState.photo.drawPhoto(); // redraw current photo

            appState.photo.photoMode = 'ANNOTATE-1'; // switch photo mode

            appState.notify();
        }).bind(this),

        // import a photo and draw on canvas
        importPhotoFromFile: (file => {
            let canvas = document.getElementById('photo-canvas'),
                reader = new FileReader();

            reader.onload = event => {
                Jimp.read(Buffer.from(event.target.result), function(readErr, img) {
                    // rescale the image, limiting width to 700px and height to 500px
                    if (img.bitmap.width > 700 || img.bitmap.height > 500) {
                        img.scaleToFit(700, 500);
                    }

                    // convert the image to a data URI and draw it on the canvas
                    img.getBase64(Jimp.AUTO, function(urlErr, url) {
                        var ctx = canvas.getContext('2d'),
                            imgElem = new Image();

                        imgElem.src = url;
                        imgElem.onload = () => {
                            appState.photo.resetPhoto();

                            // resize the canvas
                            canvas.height = img.bitmap.height;
                            canvas.width = img.bitmap.width;

                            ctx.drawImage(imgElem, 0, 0);
                            // save the image
                            appState.photo.currPhoto = ctx.getImageData(
                                0,
                                0,
                                canvas.width,
                                canvas.height
                            );

                            // switch photo mode
                            appState.photo.photoMode = 'ANNOTATE-1';

                            appState.notify();
                        };
                    });
                });
            };
            reader.readAsArrayBuffer(file);
        }).bind(this),

        // render video from camera on canvas
        renderCamera: (() => {
            let video = document.getElementById('hidden-video'),
                canvas = document.getElementById('photo-canvas');

            // switch photo mode
            appState.photo.photoMode = 'CAMERA';

            appState.photo.resetPhoto();

            navigator.mediaDevices
                .getUserMedia({ video: true })
                .then(function(mediaStream) {
                    video.srcObject = mediaStream;

                    // function to display a frame from the video source on a canvas
                    var ctx = canvas.getContext('2d');
                    const render = () => ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                    // set up render to be called on at an interval
                    video.onplay = () => (appState.photo.camera = setInterval(render, 10));

                    video.onloadedmetadata = function(e) {
                        // set the canvas size, limiting width to 700px and height to 500px
                        var ratio = 700 / video.videoWidth;
                        if (video.videoHeight * ratio > 500) {
                            ratio = 500 / video.videoHeight;
                        }
                        canvas.width = video.videoWidth * ratio;
                        canvas.height = video.videoHeight * ratio;

                        // flip frames
                        ctx.setTransform(-1, 0, 0, 1, canvas.width, 0);

                        video.play();
                    };
                })
                .catch(function(err) {
                    console.log(err.name + ': ' + err.message);
                    appState.photo.resetPhoto();

                    appState.notify();
                });

            appState.notify();
        }).bind(this),

        // save the current video frame
        takePhoto: (() => {
            clearInterval(appState.photo.camera); // stop rendering

            let canvas = document.getElementById('photo-canvas'),
                ctx = canvas.getContext('2d');

            // save the image
            appState.photo.currPhoto = ctx.getImageData(0, 0, canvas.width, canvas.height);
            // unflip future drawing
            ctx.setTransform(1, 0, 0, 1, 0, 0);

            // switch photo mode
            appState.photo.photoMode = 'ANNOTATE-1';

            appState.notify();
        }).bind(this),

        // draw the current photo with annotations
        drawPhoto: (() => {
            let canvas = document.getElementById('photo-canvas'),
                ctx = canvas.getContext('2d');

            ctx.putImageData(appState.photo.currPhoto, 0, 0); // draw underlying saved image

            ctx.setLineDash([]);
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.fillStyle = 'black';
            // draw marked program corners
            for (var [x, y] of appState.photo.programCorners) {
                ctx.beginPath();
                ctx.arc(x, y, 3, 0, 2 * Math.PI);
                ctx.stroke();
                ctx.fill();
            }
            // draw marked codel corners
            for (var [x, y] of appState.photo.codelCorners) {
                ctx.beginPath();
                ctx.arc(x, y, 2, 0, 2 * Math.PI);
                ctx.stroke();
                ctx.fill();
            }

            // draw lines between adjacent program corners
            ctx.setLineDash([5, 10]);
            ctx.beginPath();
            for (var i = 0; appState.photo.programCorners[i]; i++) {
                if (i == 0) {
                    ctx.moveTo(...appState.photo.programCorners[i]);
                } else {
                    ctx.lineTo(...appState.photo.programCorners[i]);
                }

                if (i == 3) {
                    // if there are four corners marked, complete the bounding polygon
                    ctx.lineTo(...appState.photo.programCorners[0]);
                }
            }
            ctx.stroke();

            // draw lines between adjacent codel corners
            ctx.setLineDash([2, 5]);
            ctx.beginPath();
            for (var i = 0; appState.photo.codelCorners[i]; i++) {
                if (i == 0) {
                    ctx.moveTo(...appState.photo.codelCorners[i]);
                } else {
                    ctx.lineTo(...appState.photo.codelCorners[i]);
                }

                if (i == 3) {
                    // if there are four corners marked, complete the bounding polygon
                    ctx.lineTo(...appState.photo.codelCorners[0]);
                }
            }
            ctx.stroke();
        }).bind(this),

        // show a moving cursor on the canvas when annotating corners
        showCursor: ((cursorX, cursorY) => {
            if (['ANNOTATE-1', 'ANNOTATE-2'].includes(appState.photo.photoMode)) {
                appState.photo.drawPhoto(); // redraw current photo

                // calculate the mouse coordinates relative to the canvas
                let canvas = document.getElementById('photo-canvas'),
                    { left, top } = canvas.getBoundingClientRect(),
                    x = cursorX - left,
                    y = cursorY - top,
                    ctx = canvas.getContext('2d');

                // draw cursor
                ctx.beginPath();
                ctx.arc(x, y, 3, 0, 2 * Math.PI);
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.fillStyle = 'black';
                ctx.fill();

                // connect the cursor to the last marked corner by a line
                let last;
                if (appState.photo.photoMode == 'ANNOTATE-1' && appState.photo.programCorners) {
                    ctx.setLineDash([5, 10]);
                    ctx.lineTo(
                        ...appState.photo.programCorners[appState.photo.programCorners.length - 1]
                    );
                    ctx.stroke();
                } else if (
                    appState.photo.photoMode == 'ANNOTATE-2' &&
                    appState.photo.codelCorners
                ) {
                    ctx.setLineDash([2, 5]);
                    ctx.lineTo(
                        ...appState.photo.codelCorners[appState.photo.codelCorners.length - 1]
                    );
                    ctx.stroke();
                }
            }
        }).bind(this),

        // mark a corner (program or codel, depending on the mode)
        markCorner: ((cursorX, cursorY) => {
            if (!['ANNOTATE-1', 'ANNOTATE-2'].includes(appState.photo.photoMode)) {
                return;
            }

            let canvas = document.getElementById('photo-canvas'),
                { left, top } = canvas.getBoundingClientRect(),
                x = cursorX - left,
                y = cursorY - top;

            switch (appState.photo.photoMode) {
                case 'ANNOTATE-1':
                    appState.photo.programCorners.push([x, y]);

                    // if four corners have been marked, change annotation mode
                    if (appState.photo.programCorners.length == 4) {
                        appState.photo.photoMode = 'ANNOTATE-2';
                    }
                    break;

                case 'ANNOTATE-2':
                    appState.photo.codelCorners.push([x, y]);

                    // if four corners have been marked, change annotation mode
                    if (appState.photo.codelCorners.length == 4) {
                        appState.photo.photoMode = 'ANNOTATE-3';
                    }
                    break;
            }

            appState.photo.drawPhoto(); // redraw current photo

            appState.notify();
        }).bind(this),
    },

    debug: {
        debugIsVisible: false, // initially, debugger is not visible

        commandList: [],
        interpreter: null,
        runner: null, // intervalId used for automatically stepping through program
        runSpeed: 500, // delay between steps while running, in ms
        breakpoints: [],

        DP: 0, // index into [right, down, left, up], direction pointer initially points right
        CC: 0, // index into [left, right], codel chooser initially points left
        stack: [],
        output: '',

        input: '',
        inputPtr: 0, // pointer into input stream

        block: null, // current block
        currCommand: null, // current command

        setRunSpeed: (speed => {
            appState.debug.runSpeed = speed;

            appState.notify();
        }).bind(this),

        selectBlock: (block => {
            appState.debug.block = block;

            appState.notify();
        }).bind(this),

        // initialize the debugger
        initDebugger: (() => {
            // reset debugger values
            appState.debug.commandList = [];
            appState.debug.DP = 0;
            appState.debug.CC = 0;
            appState.debug.stack = [];
            appState.debug.output = '';
            appState.debug.inputPtr = 0;
            appState.debug.block = null;
            appState.debug.currCommand = null;
            appState.debug.interpreter = null;

            appState.debug.receiveInput(); // grab input
            appState.notify();

            // create generator
            appState.debug.interpreter = interpret(
                appState.grid,
                appState.blocks,
                appState.blockSizes,
                appState.debug.getInputNum,
                appState.debug.getInputChar
            );
        }).bind(this),

        // get the current value of the input
        receiveInput: (() => {
            appState.debug.input = document.getElementById('in').value;
        }).bind(this),

        // get one input number (could be multiple characters) from "input stream"
        // (then increment pointer into stream)
        getInputNum: (() => {
            // insufficient number of chars in input stream
            if (appState.debug.input.length < appState.debug.inputPtr) {
                return null;
            }

            // discard leading whitespace (this allows multiple numbers to be entered
            // consecutively, separated by whitespace)
            for (
                var c = appState.debug.input[appState.debug.inputPtr];
                appState.debug.inputPtr < appState.debug.input.length && /\s/.test(c);
                c = appState.debug.input[++appState.debug.inputPtr]
            );

            // grab next consecutive digits
            let num = '';
            for (
                var c = appState.debug.input[appState.debug.inputPtr];
                appState.debug.inputPtr < appState.debug.input.length && /[0-9]/.test(c);
                c = appState.debug.input[++appState.debug.inputPtr]
            ) {
                num += c;
            }

            // input is not an integer value
            if (num.length == 0) {
                return null;
            }

            return parseInt(num);
        }).bind(this),

        // get one input character from "input stream" (then increment pointer into stream)
        getInputChar: (() => {
            // insufficient number of chars in input stream
            if (appState.debug.input.length < appState.debug.inputPtr) {
                return null;
            }

            return appState.debug.input[appState.debug.inputPtr++];
        }).bind(this),

        // toggle the paint mode between BP and not BP
        toggleSetBP: (() => {
            if (appState.paintMode == 'BP') {
                appState.paintMode = 'BRUSH';
            } else {
                appState.paintMode = 'BP';
            }

            appState.notify();
        }).bind(this),

        // add/remove a breakpoint
        toggleBP: ((row, col) => {
            let block = appState.blocks[row][col];
            let i = appState.debug.breakpoints.indexOf(block);

            if (i == -1) {
                // add breakpoint
                appState.debug.breakpoints.push(block);
            } else {
                appState.debug.breakpoints.splice(i, 1);
            }

            appState.notify();
        }).bind(this),

        // start running program
        start: (() => {
            appState.debug.initDebugger();
            appState.debug.cont(); // "continue" from the starting point
        }).bind(this),

        // step through program
        step: (() => {
            // if generator does not already exist (i.e. we have not already started stepping
            // through program), initialize debugger
            if (!appState.debug.interpreter) {
                appState.debug.initDebugger();
            }

            // get next step from generator
            let step = appState.debug.interpreter.next();
            if (!step.done) {
                // update state of debugger based on result of current step
                for (var prop in step.value) {
                    appState.debug[prop] = step.value[prop];
                }
                appState.notify();
            } else {
                appState.debug.interpreter = null; // finished running so clear interpreter
                appState.notify();
            }
        }).bind(this),

        // continue running after stepping through the program (run the rest of the program
        // starting from the current step)
        // if we were not already running/stepping through the program, this function does nothing
        cont: (() => {
            // update state of debugger
            function updateDebugger() {
                let step;
                // if the generator has been cleared or is finished, clear the timer
                if (!appState.debug.interpreter) {
                    clearInterval(appState.debug.runner);
                } else if ((step = appState.debug.interpreter.next()).done) {
                    // if the generator is finished, clear the interpreter
                    appState.debug.interpreter = null;
                    appState.notify();
                } else {
                    for (var prop in step.value) {
                        appState.debug[prop] = step.value[prop];
                    }
                    appState.notify();

                    // stop running if breakpoint reached
                    if (appState.debug.breakpoints.includes(step.value.block)) {
                        clearInterval(appState.debug.runner);
                    }
                }
            }

            // call generator and update state of debugger at interval
            appState.debug.runner = window.setInterval(updateDebugger, appState.debug.runSpeed);
        }).bind(this),

        // stop interpreting
        stop: (() => {
            // if we are running, this will cause the timer to be cleared
            appState.debug.interpreter = null;
            appState.debug.block = null;
            appState.debug.currCommand = null;

            appState.notify();
        }).bind(this),

        // pause running
        pause: (() => {
            clearInterval(appState.debug.runner);
        }).bind(this),
    },
};

class App extends React.Component {
    componentDidMount() {
        this.props.appState.subscribe(this.forceUpdate.bind(this, null));
    }

    render() {
        let isInterpreting = this.props.appState.debug.interpreter != null;

        return (
            <div
                style={{
                    width: '100%',
                    marginBottom: '1vh',
                    display: 'grid',
                    gridColumnGap: '1vw',
                    gridRowGap: '1vh',
                    gridTemplateColumns: this.props.appState.debug.debugIsVisible
                        ? '375px 300px auto 225px'
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
                <Controls isInterpreting={isInterpreting} {...this.props.appState} />
                <Grid {...this.props.appState} />
                {this.props.appState.debug.debugIsVisible ? (
                    <Debugger isInterpreting={isInterpreting} {...this.props.appState} />
                ) : (
                    <DebugTab {...this.props.appState} />
                )}
            </div>
        );
    }
}

document.addEventListener('DOMContentLoaded', () => {
    ReactDOM.render(<App appState={appState} />, document.getElementById('root'));
});
