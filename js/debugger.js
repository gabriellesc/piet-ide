import React from 'react';

const Debugger = props =>
    props.debug.debugIsVisible ? <DebugContainer {...props} /> : <DebugTab {...props} />;

// tab to make debugger visible
const DebugTab = ({ toggleDebugger }) => (
    <div
        style={{
            height: 'auto',
            width: '25px',
            padding: '5px 2px',
            marginBottom: '1vh',
            writingMode: 'vertical-lr',
            textAlign: 'start',
            color: 'white',
            fontWeight: 'bold',
            backgroundColor: '#5bc0de',
            cursor: 'pointer',
            float: 'right',
        }}
        onClick={() => toggleDebugger()}>
        DEBUGGER
    </div>
);

// main debugger component container
const DebugContainer = props => (
    <div
        style={{
            height: '100%',
            width: '300px',
            border: '1px solid black',
            borderRadius: '5px',
            padding: '0 5px 5px',
            float: 'right',
        }}>
        <button
            type="button"
            className="close"
            aria-label="Close"
            onClick={() => props.toggleDebugger()}>
            <span aria-hidden="true">&times;</span>
        </button>
        <DebugControls />
        <Stack {...props.debug} />
        <Pointers {...props.debug} />
        <IO {...props.debug} />
    </div>
);

// run/step/stop control buttons
const DebugControls = () => (
    <div className="btn-group" role="group" style={{ margin: 'auto auto 1vh', width: '100%' }}>
        <button type="button" className="btn btn-success" title="Run" style={{ width: '33%' }}>
            <i className="glyphicon glyphicon-forward" />
        </button>
        <button type="button" className="btn btn-primary" title="Step" style={{ width: '33%' }}>
            <i className="glyphicon glyphicon-play" />
        </button>
        <button type="button" className="btn btn-danger" title="Stop" style={{ width: '33%' }}>
            <i className="glyphicon glyphicon-stop" />
        </button>
    </div>
);

// IO visual containers
const IO = ({ output, input }) => [
    <b key="input-label">Input</b>,
    <br key="br-1" />,
    <textarea
        key="in"
        id="in"
        style={{
            width: '100%',
            maxWidth: '100%',
            fontFamily: 'monospace',
            fontSize: '12pt',
        }}
    />,
    <br key="br-2" />,
    <b key="ouput-label">Output</b>,
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
    <table style={{ margin: 'auto auto 1vh' }}>
        <thead>
            <tr>
                <td>
                    <b>Stack</b>
                </td>
            </tr>
        </thead>
        <tbody>
            {stack.map(val => (
                <tr
                    style={{
                        border: '1px solid black',
                        width: '200px',
                        height: '2em',
                        textAlign: 'center',
                        verticalAlign: 'center',
                        fontFamily: 'monospace',
                        fontSize: '12pt',
                    }}>
                    <td>{val}</td>
                </tr>
            ))}
            <tr>
                <td style={{ border: '1px solid black', width: '200px', height: '2em' }} />
            </tr>
        </tbody>
    </table>
);

// visual representation of program pointers
const Pointers = ({ DP, CC }) => (
    <dl className="dl-horizontal">
        <dt>Direction Pointer:</dt>
        <dd style={{ fontSize: '12pt' }}>{['🡺', '🡻', '🡸', '🡹'][DP]}</dd>
        <dt>Codel Chooser:</dt>
        <dd style={{ fontSize: '12pt' }}>{['🡸', '🡺'][CC]}</dd>
    </dl>
);

export default Debugger;
