import React, {Component} from 'react';
import './navigation.css';

class NavButton extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div
                className="nav-button"
                onClick={this.props.onClick}
            >
                <span className="label">{this.props.label}</span>
            </div>
        );
    }
}

class Navigation extends Component {
    render() {
        return (
            <div className="navigation-container">
                <nav ref={($) => {this.$ = $}}>
                    <span className="navigation-close" onClick={() => this.toggle()}>
                        close
                    </span>
                    <NavButton label="home" onClick={()=>{ console.log('home') }}/>
                </nav>
                <span className="navigation-toggle" onClick={() => this.toggle()}>
                    Open
                </span>
            </div>
        );
    }

    toggle() {
        this.$.classList.toggle('open');
    }
}

export default Navigation;