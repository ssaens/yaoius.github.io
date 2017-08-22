import React, {Component} from 'react';

class Section extends Component {
    render() {
        const SectionComponent = this.props.component;
        return (
            <div id={this.props.id} className="full-section">
                <SectionComponent/>
            </div>
        );
    }
}

export default Section;