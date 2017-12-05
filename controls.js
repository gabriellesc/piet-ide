import React from 'react';

import MediaModal from './mediaModal.js';
import ColourPicker from './colourPicker.js';

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
        return [
            <div
                key="controls-row-1"
                className="btn-toolbar"
                role="toolbar"
                style={{ gridColumn: 'controls1' }}>
                <ImportExportMenu {...this.props} />
                <PaintModeSwitch {...this.props} />
            </div>,
            <div
                key="controls-row-2"
                style={{
                    gridColumn: 'controls2',
                    display: 'flex',
                    justifyContent: 'space-between',
                }}>
                <label htmlFor="height" style={{ margin: 'auto 0' }}>
                    Height
                </label>
                <input
                    ref={input => (this.height = input)}
                    type="number"
                    name="height"
                    className="form-control"
                    style={{
                        width: '5em',
                        display: 'inline-block',
                    }}
                    required
                    defaultValue={this.props.height}
                />
                <label htmlFor="width" style={{ margin: 'auto 0 auto 5px' }}>
                    Width
                </label>
                <input
                    ref={input => (this.width = input)}
                    type="number"
                    name="width"
                    className="form-control"
                    style={{
                        width: '5em',
                        display: 'inline-block',
                    }}
                    defaultValue={this.props.width}
                    required
                />
                <input
                    type="button"
                    className="btn btn-warning"
                    value="Resize / Clear"
                    disabled={this.props.isInterpreting ? 'disabled' : ''}
                    onClick={() =>
                        this.props.resize({
                            height: parseInt(this.height.value),
                            width: parseInt(this.width.value),
                        })}
                />
            </div>,
            <div key="controls-row-3" style={{ gridColumn: 'controls3' }}>
                <BSDisplaySwitch {...this.props} />
                &emsp;<b>
                    {this.props.cellInFocus &&
                        this.props.blockSizes[this.props.cellInFocus[0]][
                            this.props.cellInFocus[1]
                        ] + ' pixels in block'}
                </b>
            </div>,
            <ColourPicker key="colour-picker" {...this.props} />,
        ];
    }
}

const ImportExportMenu = props => [
    <div className="btn-group" key="import-btn">
        <button
            type="button"
            className="btn btn-primary dropdown-toggle"
            data-toggle="dropdown"
            aria-haspopup="true"
            aria-expanded="false"
            disabled={props.isInterpreting ? 'disabled' : ''}>
            Import&nbsp;
            <span className="caret" />
        </button>
        <ul className="dropdown-menu">
            <li onClick={() => document.getElementById('imgFileChooser').click()}>
                <a href="#">From file</a>
            </li>
            <li data-toggle="modal" data-target="#media-modal">
                <a href="#">From photo</a>
            </li>
        </ul>
    </div>,
    <input
        key="hidden-file-input"
        id="imgFileChooser"
        type="file"
        accept="image/png, image/bmp, image/jpeg"
        style={{ display: 'none' }}
        onChange={event => {
            props.importImgFromFile(event.target.files[0]);
            event.target.value = '';
        }}
    />,
    <MediaModal key="media-modal" {...props.photo} />,

    <div key="export-btn" className="btn-group">
        <button
            type="button"
            className="btn btn-info"
            onClick={() => {
                props.exportPng(parseInt(document.getElementById('scale').value));
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
            title="Brush mode (fill single pixel)"
            className={'btn btn-default' + (paintMode == 'BRUSH' ? 'active' : '')}
            style={{ padding: '2px 12px' }}
            onClick={() => selectPaintMode('BRUSH')}>
            <i className="fi-pencil" style={{ fontSize: '14pt' }} />
        </button>
        <button
            type="button"
            title="Bucket mode (fill block of pixels)"
            className={'btn btn-default' + (paintMode == 'BUCKET' ? 'active' : '')}
            style={{ padding: '2px 12px' }}
            onClick={() => selectPaintMode('BUCKET')}>
            <i className="fi-paint-bucket" style={{ fontSize: '14pt' }} />
        </button>
    </div>
);

const BSDisplaySwitch = ({ displayBS, toggleDisplayBS }) =>
    displayBS ? (
        <i
            className="glyphicon glyphicon-eye-open"
            title="Show block sizes"
            style={{ fontSize: '16px' }}
            onClick={() => toggleDisplayBS()}
        />
    ) : (
        <i
            className="glyphicon glyphicon-eye-close"
            title="Show block sizes"
            style={{ fontSize: '16px' }}
            onClick={() => toggleDisplayBS()}
        />
    );

export default Controls;
