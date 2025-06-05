import React from 'react';
import PropTypes from 'prop-types';

export function MainMenu({children, active}) {
    return <div className={`panel main-menu nine-pin ${active || 'hidden'}`}>
        <h1>Droppings</h1>
        <p>
           * Clicks/Taps gets Drops<br/>
           * Drops get Points<br/>
           * Points get Stages<br/>
           * Stages get Drops<br/>
        </p>
        {children}
    </div>
}

MainMenu.propTypes = {
    active: PropTypes.bool,
    children: PropTypes.node.isRequired,
}
