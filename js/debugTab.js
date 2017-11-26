import React from 'react';

// tab to make debugger visible
export const DebugTab = props => (
    <div
        style={{
            gridColumn: 'dtab',
            gridRow: '1 / 4',
            height: '100%',
            width: '25px',
            padding: '5px 2px',
            writingMode: 'vertical-lr',
            textAlign: 'center',
            color: 'white',
            fontWeight: 'bold',
            backgroundColor: '#5bc0de',
            cursor: 'pointer',
            pointerEvents: 'auto',
        }}
        onClick={() => props.toggleDebugger()}>
        DEBUGGER
    </div>
);
