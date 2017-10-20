import React from 'react';
import ReactDOM from 'react-dom';

import Controls from './controls.js';
import Grid from './grid.js';

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
    cellDim: Math.min(30, (window.innerWidth - 40) / WIDTH),

    grid: Array(HEIGHT)
        .fill(0)
        .map(_ => Array(WIDTH).fill(18)), // fill grid with white initially

    selectedColour: 0,

    commands: initCommands,

    paintMode: 0, // use brush paint mode initially

    // add listener
    subscribe: (listener => appState.listeners.push(listener)).bind(this),
    // notify listeners
    notify: (() => appState.listeners.forEach(listener => listener())).bind(this),

    resize: (({ height, width }) => {
        appState.height = height;
        appState.width = width;
        appState.cellDim = Math.min(30, (window.innerWidth - 40) / width);

        appState.grid = Array(height)
            .fill(0)
            .map(_ => Array(width).fill(18));

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

        appState.notify();
    }).bind(this),

    // toggle paint mode between brush and fill
    selectPaintMode: (mode => {
        appState.paintMode = mode;

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

                appState.notify();
            });
        };
        reader.readAsArrayBuffer(file);
    },
};

class App extends React.Component {
    componentDidMount() {
        this.props.appState.subscribe(this.forceUpdate.bind(this, null));
    }

    render() {
        return [
            <Controls key="controls" colours={colours} {...this.props.appState} />,
            <Grid key="grid" colours={colours} {...this.props.appState} />,
        ];
    }
}

document.addEventListener('DOMContentLoaded', () => {
    ReactDOM.render(<App appState={appState} />, document.getElementById('root'));
});
