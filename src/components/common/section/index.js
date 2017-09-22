import React, {Component} from 'react';

class Section extends Component {
    render() {
        const SectionComponent = this.props.component;
        return (
            <div
                id={this.props.id}
                className="full-section"
                style={{height: `${window.innerHeight}px`}}
            >
                <SectionComponent/>
            </div>
        );
    }
}

export default Section;