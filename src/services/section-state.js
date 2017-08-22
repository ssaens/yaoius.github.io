import ScrollService from './scroll-state';

class SectionService {

    constructor() {
        this.callbacks = [];
        this.currentSection = null;
        ScrollService.addCallback((offset) => { this._onScroll(offset) });
    }

    addCallback(cb) {
        this.callbacks.push(cb);
    }

    scrollTo(sectionId) {
        const target = document.getElementById(sectionId);
        ScrollService.scrollTo(target.offsetTop);
    }

    _onScroll(offset) {
        const sections = document.getElementsByClassName('section');
        for (const section of sections) {
            const offsetTop = section.offsetTop;
            if (offsetTop <= offset && offset < offsetTop + section.clientHeight) {
                if (this.currentSection !== section) {
                    this._onSectionChange(section.getAttribute('id'));
                }
                return;
            }
        }
    }

    _onSectionChange(newSection) {
        for (const cb of this.callbacks) {
            cb(newSection);
        }
    }

}

export default new SectionService();