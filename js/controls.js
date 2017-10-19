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
                <form className="form-inline col-md-12">
                    <div className="form-group">
                        <label className="control-label" htmlFor="grid-height">
                            Height
                        </label>
                        <input
                            ref={input => (this.height = input)}
                            type="number"
                            name="height"
                            className="form-control"
                            style={{ width: '5em', marginLeft: '4px' }}
                            required
                            defaultValue={this.props.height}
                        />
                    </div>
                    <div className="form-group" style={{ marginLeft: '1vw' }}>
                        <label className="control-label" htmlFor="grid-width">
                            Width
                        </label>
                        <input
                            ref={input => (this.width = input)}
                            type="number"
                            name="width"
                            className="form-control"
                            style={{ width: '5em', marginLeft: '4px' }}
                            defaultValue={this.props.width}
                            required
                        />
                    </div>
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

                    <div className="btn-group" role="group" style={{ marginLeft: '2vw' }}>
                        <input
                            type="button"
                            className="btn btn-primary"
                            value="Import"
                            onClick={() => document.getElementById('fileChooser').click()}
                        />
                        <input
                            id="fileChooser"
                            type="file"
                            accept="image/png, image/bmp, image/jpeg"
                            style={{ display: 'none' }}
                            onChange={event => this.props.importImg(event.target.files[0])}
                        />
                        <input
                            type="button"
                            className="btn btn-info"
                            value="Export to PNG"
                            onClick={() => this.props.exportPng()}
                        />
                    </div>

                    <div className="form-group" style={{ marginLeft: '3vw' }}>
                        <ColourPicker {...this.props} />
                    </div>
                </form>
            </div>
        );
    }
}

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
            border: '1px solid black',
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
