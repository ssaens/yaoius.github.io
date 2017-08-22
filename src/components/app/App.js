import React, {Component} from 'react';
import ScrollService from '../../services/scroll-state';
import Navigation from '../navigation/navigation';
import Section from '../common/section/section';
import SectionSplash from '../sections/splash/section-splash';
import SectionAbout from '../sections/about/section-about';
import SectionExperience from '../sections/experience/section-experience';
import SectionProjects from '../sections/projects/section-projects';
import Footer from '../footer/footer';
import './App.css';

class App extends Component {
    render() {
        return (
            <div className="app-root">
                <Navigation/>
                <Section id='splash' component={SectionSplash}/>
                <Footer/>
            </div>
        );
    }

    componentDidMount() {
        ScrollService.attach();
    }
}

export default App;
