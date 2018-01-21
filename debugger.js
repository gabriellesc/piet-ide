import React from 'react';

// main debugger component container
class Debugger extends React.Component {
    constructor() {
        super();
        this.startPos = 0; // save the starting position of the debugger, for when it is dragged
    }

    render() {
        return (
            <div
                id="debugger"
                style={{
                    gridColumn: 'debug',
                    gridRow: '1 / 5',
                    alignSelf: 'start',
                    marginTop: '0',
                    width: '225px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    background: 'white',
                    pointerEvents: 'auto',
                }}>
                <div
                    draggable="true"
                    style={{
                        height: '25px',
                        padding: '0 5px 5px',
                        borderBottom: '1px solid #ddd',
                        borderRadius: '5px 5px 0 0',
                        backgroundColor: '#eee',
                        cursor: 'ns-resize',
                    }}
                    onDragStart={event => {
                        event.dataTransfer.setData('text/plain', '');
                        this.startPos = event.screenY;
                    }}
                    onDragEnd={event => {
                        var style = document.getElementById('debugger').style;
                        style.marginTop = `calc(${style.marginTop} + ${event.screenY}px - ${this
                            .startPos}px )`;
                    }}>
                    <button
                        type="button"
                        className="close"
                        aria-label="Close"
                        onClick={() => this.props.toggleDebugger()}>
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div style={{ padding: '5px' }}>
                    <Commands {...this.props} {...this.props.debug} />
                    <DebugControls {...this.props} {...this.props.debug} />
                    <Pointers {...this.props.debug} />
                    <Stack {...this.props.debug} />
                    <IO {...this.props} {...this.props.debug} />
                </div>
            </div>
        );
    }
}

const Commands = ({ commandList, selectBlock, isInterpreting, currCommand }) => [
    <div
        key="command-list"
        style={{
            margin: '5px auto 10px',
            padding: '5px',
            width: '100%',
            height: '40vh',
            resize: 'vertical',
            overflow: 'auto',
            fontFamily: 'monospace',
            fontSize: '11pt',
            backgroundColor: '#f5f5f5',
            border: '1px solid #ccc',
        }}>
        {commandList.map((command, i) => (
            <div
                key={'command-' + i}
                style={{ textTransform: 'uppercase' }}
                onMouseOver={() => !isInterpreting && selectBlock(command.block)}
                onMouseOut={() => !isInterpreting && selectBlock(null)}>
                {command.inst}
                {command.error && [
                    ' ',
                    <i
                        key={'error-' + i}
                        className="glyphicon glyphicon-exclamation-sign"
                        style={{ color: 'red' }}
                        title={command.error}
                    />,
                ]}
            </div>
        ))}
    </div>,
    isInterpreting &&
        currCommand && (
            <div
                key="current-command"
                style={{
                    margin: '-5px 0 10px',
                    width: '100%',
                    fontWeight: 'bold',
                    textAlign: 'center',
                }}>
                Current command:<br />
                {currCommand.inst.toUpperCase()}
                {currCommand.error && <div style={{ color: 'red' }}>{currCommand.error}</div>}
            </div>
        ),
];

// run/step/continue/stop/pause + set BP control buttons
const DebugControls = ({
    start,
    pause,
    step,
    cont,
    stop,
    runSpeed,
    isInterpreting,
    setRunSpeed,
    paintMode,
    toggleSetBP,
}) => (
    <div className="btn-toolbar" role="toolbar" style={{ margin: '0 0 1vh' }}>
        <div className="btn-group btn-group-sm" style={{ width: '52px', margin: '0' }}>
            <button
                type="button"
                className="btn btn-success"
                title="Run from the beginning"
                onClick={() => start()}>
                <i className="glyphicon glyphicon-play" />
            </button>
            <button
                type="button"
                className="btn btn-success dropdown-toggle"
                title="Set run speed"
                data-toggle="dropdown"
                aria-haspopup="true"
                aria-expanded="false"
                style={{ width: '18px', paddingLeft: '4px', paddingRight: '4px' }}>
                <span className="caret" />
                <span className="sr-only">Toggle Dropdown</span>
            </button>
            <ul className="dropdown-menu">
                <li style={{ padding: '0 5px' }}>
                    <small style={{ float: 'left' }}>Slower</small>
                    <small style={{ float: 'right' }}>Faster</small>
                    <input
                        type="range"
                        min="0"
                        max="1000"
                        step="100"
                        value={1000 - runSpeed}
                        onChange={event =>
                            !isInterpreting && setRunSpeed(1000 - event.target.value)}
                    />
                </li>
            </ul>
        </div>
        <div
            className="btn-group btn-group-sm"
            role="group"
            style={{ width: '136px', margin: '0 0 0 4px' }}>
            <button type="button" className="btn btn-warning" title="Pause" onClick={() => pause()}>
                <i className="glyphicon glyphicon-pause" />
            </button>
            <button type="button" className="btn btn-info" title="Step" onClick={() => step()}>
                <i className="glyphicon glyphicon-step-forward" />
            </button>
            <button
                type="button"
                className="btn btn-primary"
                title="Continue running from this point"
                onClick={() => cont()}>
                <i className="glyphicon glyphicon-fast-forward" />
            </button>
            <button type="button" className="btn btn-danger" title="Stop" onClick={() => stop()}>
                <i className="glyphicon glyphicon-stop" />
            </button>
        </div>

        <i
            className="glyphicon glyphicon-map-marker"
            title="Set breakpoints"
            style={{
                fontSize: '18px',
                margin: '0 0 0 3px',
                padding: '5px 0',
                cursor: 'pointer',
                color: paintMode == 'BP' ? 'red' : 'black',
            }}
            onClick={() => toggleSetBP()}
        />
    </div>
);

// IO visual containers
const IO = ({ output, isInterpreting }) => [
    <b key="input-label">Input</b>,
    <br key="br-1" />,
    <textarea
        key="in"
        id="in"
        placeholder="Enter input before running program"
        title="Tip: Whitespace before a numerical value is ignored"
        readOnly={isInterpreting}
        style={{
            width: '100%',
            maxWidth: '100%',
            fontFamily: 'monospace',
            fontSize: '12pt',
        }}
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
                        wordBreak: 'break-all',
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
        DP:&nbsp;
        <i className={'glyphicon glyphicon-arrow-' + ['right', 'down', 'left', 'up'][DP]} />&emsp;
        CC:&nbsp;<i className={'glyphicon glyphicon-arrow-' + ['left', 'right'][CC]} />
    </div>
);

export default Debugger;
