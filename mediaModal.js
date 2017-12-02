import React from 'react';

class MediaModal extends React.Component {
    closeMediaStream() {
        this.video.srcObject.getTracks().forEach(track => track.stop());
        this.video.srcObject = null;
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
                                aria-label="Close"
                                onClick={() => this.closeMediaStream()}>
                                <span aria-hidden="true">&times;</span>
                            </button>
                            <h4 className="modal-title" id="myModalLabel">
                                Modal title
                            </h4>
                        </div>
                        <div className="modal-body">
                            <video
                                style={{ display: 'none' }}
                                ref={video => (this.video = video)}
                            />
                            <canvas width="0" height="0" />
                        </div>
                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-default"
                                data-dismiss="modal"
                                onClick={() => this.closeMediaStream()}>
                                Close
                            </button>
                            <button type="button" className="btn btn-warning" onClick={() => {}}>
                                Restart
                            </button>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={() => this.closeMediaStream()}>
                                Complete {'import'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default MediaModal;
