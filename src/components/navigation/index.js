import React, {Component} from 'react';
import SectionStateService from '../../services/section-state';
import './navigation.css';

class NavButton extends Component {
    constructor(props) {
        super(props);
        this.activeState = false;
        SectionStateService.addCallback((section) => {this._onSectionChange(section)});
    }

    render() {
        return (
            <div
                className="nav-button"
                ref={($) => this.$ = $}
                onClick={() => this._onClick()}
            >
                <span className="label">{this.props.label}</span>
            </div>
        );
    }

    _onSectionChange(section) {
        let changed = false;
        const isActive = section === this.props.section;
        if (this.activeState !== isActive) {
            this.activeState = isActive;
            changed = true;
        }
        if (changed) {
            this.$.classList.toggle('active');
        }
    }

    _onClick() {
        SectionStateService.scrollTo(this.props.section);
    }
}

class Navigation extends Component {
    render() {
        return (
            <div className="navigation-container">
                <nav ref={($) => {this.$ = $}}>
                    <NavButton label="home" section="splash"/>
                    <NavButton label="about" section="about"/>
                    <NavButton label="experience" section="experience"/>
                    <NavButton label="projects" section="projects"/>
                </nav>
                <span
                    className="navigation-toggle"
                    onClick={() => this._toggleNav()}
                    ref={($) => this.button = $}
                >
                    Open
                </span>
            </div>
        );
    }

    _toggleNav() {
        this.$.classList.toggle('open');
        this.button.classList.toggle('active');
    }
}

export default Navigation;