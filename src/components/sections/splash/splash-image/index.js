import React, {Component} from 'react';
import hex_bg from './dillon-yao.jpg';

import './splash-image.css';

const NUM_HEXES = 5;

class Hexagon {
    constructor(s, x, y) {
        this.element = (
            <polygon
                className="hex"
                points="300,150 225,280 75,280 0,150 75,20 225,20"
                fill="url('#hex-bg')"
            />
        );
    }
}

class SplashImage extends Component {
    constructor(props) {
        super(props);
        this.hexes = [];
        this._generateHexagons();
    }

    render() {
        const hexagons = this.hexes.map(hex => hex.element);

        return (
            <div className="splash-image-container">
                <svg className='splash-image' viewBox='0, 0, 300, 300'>
                    <pattern id='hex-bg' patternUnits='userSpaceOnUse' width='300' height='300'>
                        <image xlinkHref={hex_bg} x='0' y='0' width='300' height='300'/>
                    </pattern>
                    <polygon
                        className="hex"
                        points="300,150 225,280 75,280 0,150 75,20 225,20"
                        transform='translate(30, 30)'
                        fill="url('#hex-bg')"
                    />
                    <polygon
                        className="hex"
                        points="300,150 225,280 75,280 0,150 75,20 225,20"
                        transform='translate(-30, -30)'
                        fill="url('#hex-bg')"
                    />
                    {/*<polygon*/}
                        {/*className="hex"*/}
                        {/*points="300,150 225,280 75,280 0,150 75,20 225,20"*/}
                        {/*fill="url('#hex-bg')"*/}
                    {/*/>*/}
                </svg>
            </div>
        )
    }

    componentDidMount() {
        window.addEventListener('mousemove', this._onCursor);
    }

    componentWillUnmount() {
        window.removeEventListener('mousemove', this._onCursor)
    }

    animate() {
        requestAnimationFrame(() => {

        });
    }

    _step() {

    }

    _generateHexagons() {
        this.hexes.push(new Hexagon());
        // for (let i = 0; i < NUM_HEXES; ++i) {
        //     const s = 0.5 + Math.random() * 0.5;
        //     const x = Math.random();
        //     const y = Math.random();
        //     this.hexes.push(new Hexagon(s, x, y));
        // }
    }

    _onCursor = (e) => {

    }
}

export default SplashImage;