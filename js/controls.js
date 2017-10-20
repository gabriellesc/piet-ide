import React from 'react';

class Controls extends React.Component {
    // manually update input values when dims are changed from appState (eg. when image file
    // is imported)
    componentWillReceiveProps(newProps) {
        if (this.props.height != newProps.height) {
            this.height.value = newProps.height;
        }

        if (this.props.width != newProps.width) {
            this.width.value = newProps.width;
        }
    }

    render() {
        return (
            <div className="row">
                <div className="col-sm-12">
                    <table>
                        <tbody>
                            <tr>
                                <td colSpan="3">
                                    <div className="btn-toolbar" role="toolbar">
                                        <ImportExportMenu {...this.props} />
                                        <PaintModeSwitch {...this.props} />
                                    </div>
                                </td>
                                <td
                                    rowSpan="2"
                                    style={{ paddingLeft: '2vw', paddingBottom: '1vh' }}>
                                    <ColourPicker {...this.props} />
                                </td>
                            </tr>
                            <tr style={{ paddingTop: '1vh', verticalAlign: 'top' }}>
                                <td>
                                    <label htmlFor="height">Height</label>
                                    <input
                                        ref={input => (this.height = input)}
                                        type="number"
                                        name="height"
                                        className="form-control"
                                        style={{
                                            width: '5em',
                                            marginLeft: '4px',
                                            marginRight: '1vw',
                                            display: 'inline-block',
                                        }}
                                        required
                                        defaultValue={this.props.height}
                                    />
                                </td>
                                <td>
                                    <label htmlFor="width">Width</label>
                                    <input
                                        ref={input => (this.width = input)}
                                        type="number"
                                        name="width"
                                        className="form-control"
                                        style={{
                                            width: '5em',
                                            marginLeft: '4px',
                                            display: 'inline-block',
                                        }}
                                        defaultValue={this.props.width}
                                        required
                                    />
                                </td>
                                <td>
                                    <input
                                        type="button"
                                        className="btn btn-warning"
                                        value="Resize / Clear"
                                        style={{ marginLeft: '1vw' }}
                                        onClick={() =>
                                            this.props.resize({
                                                height: parseInt(this.height.value),
                                                width: parseInt(this.width.value),
                                            })}
                                    />
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }
}

const ImportExportMenu = ({ importImg, exportPng }) => [
    <input
        key="import-btn"
        type="button"
        className="btn btn-primary"
        value="Import"
        onClick={() => document.getElementById('fileChooser').click()}
    />,
    <input
        key="hidden-file-input"
        id="fileChooser"
        type="file"
        accept="image/png, image/bmp, image/jpeg"
        style={{ display: 'none' }}
        onChange={event => importImg(event.target.files[0])}
    />,

    <div key="export-btn" className="btn-group">
        <button
            type="button"
            className="btn btn-info"
            onClick={() => {
                exportPng(parseInt(document.getElementById('scale').value));
            }}>
            Export to PNG
        </button>
        <button
            type="button"
            className="btn btn-info dropdown-toggle"
            data-toggle="dropdown"
            aria-haspopup="true"
            aria-expanded="false">
            <span className="caret" />
            <span className="sr-only">Toggle Dropdown</span>
        </button>
        <ul className="dropdown-menu">
            <li>
                <div className="form-group" style={{ marginLeft: '1vw', marginBottom: '0' }}>
                    <label className="control-label" htmlFor="scale">
                        Scale
                    </label>
                    <input
                        id="scale"
                        type="number"
                        name="scale"
                        className="form-control"
                        style={{ width: '5em', marginLeft: '4px', display: 'inline-block' }}
                        defaultValue={1}
                        required
                    />
                </div>
            </li>
        </ul>
    </div>,
];

const PaintModeSwitch = ({ paintMode, selectPaintMode }) => (
    <div className="btn-group" role="group" style={{ float: 'right' }}>
        <button
            type="button"
            className={'btn btn-default' + (paintMode == 0 ? 'active' : '')}
            style={{ padding: '2px 12px' }}
            onClick={() => selectPaintMode(0)}>
            <i className="fi-pencil" style={{ fontSize: '14pt' }} />
        </button>
        <button
            type="button"
            className={'btn btn-default' + (paintMode == 1 ? 'active' : '')}
            style={{ padding: '2px 12px' }}
            onClick={() => selectPaintMode(1)}>
            <i className="fi-paint-bucket" style={{ fontSize: '14pt' }} />
        </button>
    </div>
);

const ColourPicker = props => (
    <table>
        <tbody>
            {[
                props.colours.slice(0, 6),
                props.colours.slice(6, 12),
                props.colours.slice(12, 18),
            ].map((colourRow, i) => (
                <tr key={'colour-row-' + i}>
                    {colourRow.map((colour, j) => (
                        <ColourCell
                            key={'colour-cell-' + i + '-' + j}
                            colSpan="1"
                            cellColour={i * 6 + j}
                            {...props}
                        />
                    ))}
                </tr>
            ))}

            <tr>
                <ColourCell colSpan="3" cellColour={18} {...props} />
                <ColourCell colSpan="3" cellColour={19} {...props} />
            </tr>
        </tbody>
    </table>
);

const ColourCell = props => (
    <td
        colSpan={props.colSpan}
        style={{
            width: '25px',
            height: '25px',
            padding: '5px',
            backgroundColor: props.colours[props.cellColour],
            border:
                props.selectedColour == props.cellColour ? '4px double black' : '1px solid black',
            color: 'white',
            textShadow: '1px 1px 1px black',
            textAlign: 'center',
            cursor: 'pointer',
        }}
        onClick={() => props.selectColour(props.cellColour)}>
        {props.commands[props.cellColour]}
    </td>
);

export default Controls;
