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
        offset += 200;
        const sections = document.getElementsByClassName('full-section');
        for (const section of sections) {
            const offsetTop = section.offsetTop;
            if (offsetTop <= offset && offset < offsetTop + section.clientHeight) {
                if (this.currentSection !== section) {
                    this._onSectionChange(section.getAttribute('id'));
                    this.currentSection = section;
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