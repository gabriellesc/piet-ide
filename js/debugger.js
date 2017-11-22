import React from 'react';

// main debugger component container
const Debugger = props => (
    <div
        style={{
            gridColumn: 'debug',
            gridRow: '1 / 5',
            alignSelf: 'start',
            width: '250px',
            border: '1px solid black',
            borderRadius: '5px',
            padding: '0 5px 5px',
            background: 'white',
            pointerEvents: 'auto',
        }}>
        <button
            type="button"
            className="close"
            aria-label="Close"
            onClick={() => props.toggleDebugger()}>
            <span aria-hidden="true">&times;</span>
        </button>
        <Compiler {...props} {...props.debug} />
        <DebugControls {...props} {...props.debug} />
        <Pointers {...props.debug} />
        <Stack {...props.debug} />
        <IO {...props} {...props.debug} />
    </div>
);

const Compiler = ({
    compile,
    commandList,
    currCommand,
    breakpoints,
    toggleBP,
    isRunning,
    selectBlock,
}) => [
    <button
        key="compile-button"
        type="button"
        className="btn btn-info"
        title="Compile"
        disabled={isRunning ? 'disabled' : ''}
        onClick={() => compile()}
        style={{ width: '80%', marginTop: '5px', position: 'relative', left: '10%' }}>
        {isRunning ? <i>Running</i> : 'Compile'}
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
            backgroundColor: '#f5f5f5',
            border: '1px solid #ccc',
            display: 'grid',
            gridAutoColumns: 'min-content auto',
            alignItems: 'center',
            gridColumnGap: '5px',
        }}>
        {commandList.map(
            (command, i) =>
                command.inst != 'DP' &&
                command.inst != 'CC' && [
                    <span
                        key={'label-' + i}
                        id={'label-' + i}
                        style={{
                            fontSize: '8pt',
                            gridColumn: '1',
                            justifySelf: 'start',
                            cursor: 'pointer',
                        }}
                        title="Toggle breakpoint"
                        onClick={() => toggleBP(i)}>
                        {breakpoints.includes(i) ? <i className="glyphicon glyphicon-pause" /> : i}
                    </span>,
                    <span
                        key={'command-' + i}
                        style={{
                            fontSize: '11pt',
                            paddingLeft: '5px',
                            gridColumn: '2',
                            backgroundColor: i == currCommand ? '#337ab7' : 'transparent',
                            color: i == currCommand ? 'white' : 'black',
                        }}
                        onMouseOver={() => !isRunning && selectBlock(command.block)}
                        onMouseOut={() => !isRunning && selectBlock(null)}>
                        {command.inst}
                        {command.inst == 'PUSH' && ' ' + command.val}
                        {command.inst == 'GOTO' && [
                            ' ',
                            <a key={'link-' + i} href={'#label-' + command.val}>
                                {command.val}
                            </a>,
                        ]}
                        {command.inst == 'BRANCH-DP' &&
                            command.val.map((link, index) => [
                                ' ',
                                <a
                                    key={'link-' + i + '-' + index}
                                    title={link}
                                    href={'#label-' + link}>
                                    {['🡺', '🡻', '🡸', '🡹'][index]}
                                </a>,
                            ])}
                        {command.inst == 'BRANCH-CC' &&
                            command.val.map((link, index) => [
                                ' ',
                                <a
                                    key={'link-' + i + '-' + index}
                                    title={link}
                                    href={'#label-' + link}>
                                    {['🡸', '🡺'][index]}
                                </a>,
                            ])}
                        {command.inst == 'END-BRANCH' && [
                            ' ',
                            <a key={'link-' + i} href={'#label-' + command.val[0]}>
                                {command.val[0]}
                            </a>,
                        ]}
                    </span>,
                ]
        )}
    </div>,
];

// run/step/continue/stop control buttons
const DebugControls = props => (
    <div className="btn-toolbar" role="toolbar" style={{ width: '100%', margin: '0 0 1vh' }}>
        <div
            className="btn-group"
            style={{ width: 'calc((100% - 5px) / 4 + 20px)', marginLeft: '2px' }}>
            <button
                type="button"
                className="btn btn-success"
                title="Run"
                onClick={() => props.start()}>
                <i className="glyphicon glyphicon-play" />
            </button>
            <button
                type="button"
                className="btn btn-success dropdown-toggle"
                data-toggle="dropdown"
                aria-haspopup="true"
                aria-expanded="false"
                style={{ paddingLeft: '4px', paddingRight: '4px' }}>
                <span className="caret" />
                <span className="sr-only">Toggle Dropdown</span>
            </button>
            <ul className="dropdown-menu" style={{ minWidth: 'auto', whiteSpace: 'nowrap' }}>
                <li style={{ height: '200px', padding: '0 5px' }}>
                    <RunSpeed {...props} />
                </li>
            </ul>
        </div>

        <div
            className="btn-group"
            role="group"
            style={{ width: 'calc((100% - 5px) / 4 * 3 - 17px)', marginLeft: '0' }}>
            <button
                type="button"
                className="btn btn-info"
                title="Step"
                style={{ width: '33%' }}
                onClick={() => props.step()}>
                <i className="glyphicon glyphicon-step-forward" />
            </button>
            <button
                type="button"
                className="btn btn-primary"
                title="Continue"
                style={{ width: '33%' }}
                onClick={() => props.cont()}>
                <i className="glyphicon glyphicon-fast-forward" />
            </button>
            <button
                type="button"
                className="btn btn-danger"
                title="Stop"
                style={{ width: '33%' }}
                onClick={() => props.stop()}>
                <i className="glyphicon glyphicon-stop" />
            </button>
        </div>
    </div>
);

// slider to select run speed
const RunSpeed = ({ runSpeed, setRunSpeed, isRunning }) => [
    <b key="fast-label">Faster</b>,
    <input
        key="run-speed"
        type="range"
        min="0"
        max="1000"
        step="100"
        value={1000 - runSpeed}
        style={{
            height: '150px',
            width: '20px',
            paddingTop: '5px',
            WebkitAppearance: 'slider-vertical',
            MozAppearance: 'scale-vertical',
            margin: '5px auto',
        }}
        onChange={event => !isRunning && setRunSpeed(1000 - event.target.value)}
    />,
    <b key="slow-label">Slower</b>,
];

// IO visual containers
const IO = ({ output, isRunning }) => [
    <b key="input-label">Input</b>,
    <br key="br-1" />,
    <textarea
        key="in"
        id="in"
        placeholder="Enter input before running program"
        title="Tip: Whitespace before a numerical value is ignored"
        readOnly={isRunning}
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
