import React, {Component} from 'react';

import ScrollService from '../../services/scroll-state';
import Navigation from '../navigation';
import Section from '../common/section';
import SectionSplash from '../sections/splash';
import SectionAbout from '../sections/about';
import SectionExperience from '../sections/experience';
import SectionProjects from '../sections/projects';
import Footer from '../footer/footer';

import './App.css';

class App extends Component {
    render() {
        return (
            <div className="app-root">
                <Navigation/>
                <Section id="splash" component={SectionSplash}/>
                <Section id="about" component={SectionAbout}/>
                <Section id="experience" component={SectionExperience}/>
                <Section id="projects" component={SectionProjects}/>
                <Footer/>
            </div>
        );
    }

    componentDidMount() {
        ScrollService.attach();
    }
}

export default App;
