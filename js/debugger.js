import React from 'react';

// main debugger component container
const Debugger = props => (
    <div
        style={{
            gridColumn: 'debug',
            gridRow: '1 / 5',
            alignSelf: 'start',
            width: '200px',
            border: '1px solid black',
            borderRadius: '5px',
            padding: '0 5px 5px',
            background: 'white',
        }}>
        <button
            type="button"
            className="close"
            aria-label="Close"
            onClick={() => props.toggleDebugger()}>
            <span aria-hidden="true">&times;</span>
        </button>
        <Compiler {...props.debug} />
        <DebugControls {...props.debug} />
        <Pointers {...props.debug} />
        <Stack {...props.debug} />
        <IO {...props.debug} />
    </div>
);

const Compiler = ({ compile, commandList }) => [
    <button
        key="compile-button"
        type="button"
        className="btn btn-info"
        title="Compile"
        onClick={() => compile()}
        style={{ width: '80%', marginTop: '5px', position: 'relative', left: '10%' }}>
        Compile
    </button>,
    <div
        key="command-list"
        style={{
            margin: '10px auto',
            padding: '5px',
            maxHeight: '40vh',
            width: '100%',
            overflow: 'auto',
            fontFamily: 'monospace',
            fontSize: '11pt',
            whiteSpace: 'pre',
            backgroundColor: '#f5f5f5',
            border: '1px solid #ccc',
        }}>
        {commandList
            .filter(command => !(command.startsWith('CC') || command.startsWith('DP')))
            .join('\n')}
    </div>,
];

// run/step/stop control buttons
const DebugControls = ({ start, step, stop }) => (
    <div
        className="btn-group"
        role="group"
        style={{ width: '100%', marginBottom: '1vh', marginLeft: '2px' }}>
        <button
            type="button"
            className="btn btn-success"
            title="Run"
            style={{ width: '33%' }}
            onClick={() => start()}>
            <i className="glyphicon glyphicon-forward" />
        </button>
        <button
            type="button"
            className="btn btn-primary"
            title="Step"
            style={{ width: '33%' }}
            onClick={() => step()}>
            <i className="glyphicon glyphicon-play" />
        </button>
        <button
            type="button"
            className="btn btn-danger"
            title="Stop"
            style={{ width: '33%' }}
            onClick={() => stop()}>
            <i className="glyphicon glyphicon-stop" />
        </button>
    </div>
);

// IO visual containers
const IO = ({ output, input, inDebugMode, receiveInput }) => [
    <b key="input-label">Input</b>,
    <br key="br-1" />,
    <textarea
        key="in"
        id="in"
        readOnly={!inDebugMode}
        style={{
            width: '100%',
            maxWidth: '100%',
            fontFamily: 'monospace',
            fontSize: '12pt',
        }}
        onKeyPress={event => receiveInput(event.charCode)}
    />,
    <br key="br-2" />,
    <b key="output-label">Output</b>,
    <br key="br-3" />,
    <textarea
        key="out"
        id="out"
        readOnly
        style={{
            width: '100%',
            maxWidth: '100%',
            fontFamily: 'monospace',
            fontSize: '12pt',
        }}
        value={output}
    />,
];

// visual representation of stack
const Stack = ({ stack }) => (
    <table style={{ margin: 'auto auto 1vh', width: '100%' }}>
        <thead>
            <tr>
                <td>
                    <b>Stack</b>
                </td>
            </tr>
        </thead>
        <tbody>
            {stack.concat('⮟').map((val, i) => (
                <tr
                    key={'val-' + i}
                    style={{
                        border: '1px solid black',
                        width: '100%',
                        height: '2ex',
                        textAlign: 'center',
                        verticalAlign: 'center',
                        fontFamily: 'monospace',
                        fontSize: '12pt',
                    }}>
                    <td>{val}</td>
                </tr>
            ))}
        </tbody>
    </table>
);

// visual representation of program pointers
const Pointers = ({ DP, CC }) => (
    <div style={{ width: '100%', textAlign: 'center', fontWeight: 'bold' }}>
        DP:&nbsp;<span style={{ fontSize: '12pt' }}>{['🡺', '🡻', '🡸', '🡹'][DP]}</span>&emsp;
        CC:&nbsp;<span style={{ fontSize: '12pt' }}>{['🡸', '🡺'][CC]}</span>
    </div>
);

export default Debugger;
