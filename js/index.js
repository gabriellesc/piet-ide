import React from 'react';
import ReactDOM from 'react-dom';

import Controls from './controls.js';
import Grid from './grid.js';

const colourMap = {
    1: '#FFC0C0', // light red
    2: '#FFFFC0', // light yellow
    3: '#C0FFC0', // light green
    4: '#C0FFFF', // light cyan
    5: '#C0C0FF', // light blue
    6: '#FFC0FF', // light magenta
    10: '#FF0000', // red
    20: '#FFFF00', // yellow
    30: '#00FF00', // green
    40: '#00FFFF', // cyan
    50: '#0000FF', // blue
    60: '#FF00FF', // magenta
    100: '#C00000', // dark red
    200: '#C0C000', // dark yellow
    300: '#00C000', // dark green
    400: '#00C0C0', // dark cyan
    500: '#0000C0', // dark blue
    600: '#C000C0', // dark magenta
    0: '#FFFFFF', // white
    '-1': '#000000', // black
};

const commandMap = [
    ['', 'push', 'pop'],
    ['+', '-', '*'],
    ['/', 'mod', 'not'],
    ['>', 'pointer', 'switch'],
    ['dup', 'roll', 'in(num)'],
    ['in(char)', 'out(num)', 'out(char)'],
];

function mapColourToCommand(baseColour, colour) {
    let lightChange = ('' + colour).length - ('' + baseColour).length;

    let hueChange = Number(colour).toPrecision(1)[0] - Number(baseColour).toPrecision(1)[0];

    return commandMap.slice(hueChange)[0].slice(lightChange)[0];
}

const initHeight = 10,
    initWidth = 10;

const appState = {
    listeners: [],

    height: initHeight,
    width: initHeight,

    grid: Array(initHeight)
        .fill(0)
        .map(_ => Array(initWidth).fill(0)),

    selectedColour: 1,

    subscribe: (listener => appState.listeners.push(listener)).bind(this),

    resize: (({ height, width }) => {
        appState.height = height;
        appState.width = width;

        appState.grid = Array(height)
            .fill(0)
            .map(_ => Array(width).fill(0));

        appState.listeners.forEach(listener => listener()); // notify listeners
    }).bind(this),

    selectColour: (colour => {
        appState.selectedColour = colour;
        appState.listeners.forEach(listener => listener()); // notify listeners
    }).bind(this),

    colour: ((row, col) => {
        appState.grid[row][col] = appState.selectedColour;
        appState.listeners.forEach(listener => listener()); // notify listeners
    }).bind(this),
};

class App extends React.Component {
    componentDidMount() {
        this.props.appState.subscribe(this.forceUpdate.bind(this, null));
    }

    render() {
        return [
            <Controls
                key="controls"
                colourMap={colourMap}
                mapColourToCommand={mapColourToCommand}
                {...this.props.appState}
            />,
            <Grid key="grid" colourMap={colourMap} {...this.props.appState} />,
        ];
    }
}

document.addEventListener('DOMContentLoaded', () => {
    ReactDOM.render(<App appState={appState} />, document.getElementById('root'));
});
