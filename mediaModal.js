import React from 'react';
import { colours } from './colours.js';

class MediaModal extends React.Component {
    // when the component is mounted, add event listeners for modal show/hide events
    componentDidMount() {
        $('#media-modal').on('show.bs.modal', () => this.props.renderCamera());
        $('#media-modal').on('hidden.bs.modal', () => this.props.resetPhoto());
    }

    render() {
        return (
            <div
                className="modal fade"
                id="media-modal"
                tabIndex="-1"
                role="dialog"
                aria-labelledby="myModalLabel">
                <div className="modal-dialog" role="document" style={{ width: '730px' }}>
                    <div className="modal-content">
                        <div className="modal-header">
                            <button
                                type="button"
                                className="close"
                                data-dismiss="modal"
                                aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                            <h4 className="modal-title">Import a program from a photo</h4>
                        </div>
                        <div className="modal-body">
                            <input
                                id="hidden-photo-input"
                                type="file"
                                accept="image/png, image/bmp, image/jpeg"
                                style={{ display: 'none' }}
                                onChange={event => {
                                    this.props.importPhotoFromFile(event.target.files[0]);
                                    event.target.value = '';
                                }}
                            />
                            <video id="hidden-video" style={{ display: 'none' }} />

                            <center>
                                <InfoAlert {...this.props} />
                                <canvas
                                    id="photo-canvas"
                                    width="0"
                                    height="0"
                                    onMouseMove={e => this.props.showCursor(e.clientX, e.clientY)}
                                    onClick={e => this.props.markCorner(e.clientX, e.clientY)}
                                />
                                {this.props.photoMode == 'CAMERA' && (
                                    <ShutterButton {...this.props} />
                                )}
                            </center>
                        </div>
                        <div className="modal-footer">
                            <ModalMenu {...this.props} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

const ShutterButton = ({ takePhoto }) => (
    <div
        style={{
            width: '40px',
            height: '40px',
            background: 'red',
            borderRadius: '20px',
            border: '6px double white',
            marginBottom: '-35px',
            cursor: 'pointer',
        }}
        onClick={() => takePhoto()}
    />
);

const InfoAlert = props =>
    props.photoMode.startsWith('ANNOTATE') && (
        <div className="alert alert-info" role="alert" style={{ marginBottom: '5px' }}>
            {
                {
                    'ANNOTATE-1': [
                        <b key="step">Step 1.</b>,
                        ' Mark the four corners of the program',
                    ],
                    'ANNOTATE-2': [
                        <b key="step">Step 2.</b>,
                        ' Mark the four corners of a single codel',
                    ],
                    'ANNOTATE-3': [
                        <b key="step">Step 3.</b>,
                        ' Pick the correct colour of the codel',
                        <ColourChooser key="codel-colour-chooser" {...props} />,
                    ],
                }[props.photoMode]
            }
        </div>
    );

const ColourChooser = ({ codelColour, selectCodelColour }) => (
    <table>
        <tbody>
            <tr>
                {colours.map((colour, i) => (
                    <td
                        key={'codel-colour-' + i}
                        style={{
                            width: '24px',
                            height: '24px',
                            backgroundColor: colour,
                            border: '1px solid black',
                            textAlign: 'center',
                            cursor: 'pointer',
                        }}
                        onClick={() => selectCodelColour(i)}
                    />
                ))}
            </tr>
        </tbody>
    </table>
);

const ModalMenu = ({ photoMode, renderCamera, clearAnnotations }) => [
    <button key="close" type="button" className="btn btn-default" data-dismiss="modal">
        Close
    </button>,
    <button
        key="select"
        type="button"
        className="btn btn-default"
        title="Select a new photo file and clear annotations"
        onClick={() => document.getElementById('hidden-photo-input').click()}>
        Select photo from file
    </button>,
    ['ANNOTATE-1', 'ANNOTATE-2', 'ANNOTATE-3'].includes(photoMode) && (
        <button
            key="camera"
            type="button"
            className="btn btn-default"
            title="Return to the camera and clear annotations"
            onClick={() => renderCamera()}>
            <i className="glyphicon glyphicon-camera" />
        </button>
    ),
    ['ANNOTATE-1', 'ANNOTATE-2', 'ANNOTATE-3', 'READY'].includes(photoMode) && (
        <button
            key="clear"
            type="button"
            className="btn btn-warning"
            onClick={() => clearAnnotations()}>
            Clear annotations
        </button>
    ),
    photoMode == 'READY' && (
        <button key="complete" type="button" className="btn btn-primary">
            Complete {'import'}
        </button>
    ),
];

export default MediaModal;
