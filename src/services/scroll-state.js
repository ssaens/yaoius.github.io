/**
 *
 * @param t: current time
 * @param b: start value
 * @param c: change in value
 * @param d: duration
 * @returns {*}
 */
function easeOutExpo(t, b, c, d) {
    return c * (-Math.pow( 2, -10 * t/d ) + 1) + b;
}

class ScrollService {

    constructor() {
        this._callbacks = [];
        this._ticking = false;
        this._animationFrame = null;
    }

    attach() {
        window.addEventListener('scroll', () => { this._onScroll() }, { passive: true });
        this._onScroll();
    }

    addCallback(cb) {
        this._callbacks.push(cb);
    }

    /**
     * Scrolls to the specified page offset using ease function
     * @param target: target offset to scroll to
     * @param duration: time in ms for animation to occur
     * @param easeFunction: ease function for animation
     */
    scrollTo(target, duration=800, easeFunction=easeOutExpo) {
        if (this._animationFrame) {
            window.cancelAnimationFrame(this._animationFrame);
        }
        const maxScroll = document.body.scrollHeight - window.innerHeight;
        if (target >= maxScroll) {
            target = maxScroll;
        }
        const scrollStart = window.scrollY;
        const deltaScroll = target - scrollStart;
        let start = null;
        const step = (timestamp) => {
            if (window.scrollY === target) {
                return;
            }
            if (!start) start = timestamp;
            const elapsed = timestamp - start;

            if (elapsed > duration) {
                window.scrollTo(0, target);
                this._animationFrame = null;
                return;
            }
            const stepTarget = easeFunction(elapsed, scrollStart, deltaScroll, duration);
            window.scrollTo(0, Math.round(stepTarget));
            window.requestAnimationFrame(step);
        };
        this._animationFrame = window.requestAnimationFrame(step);
    }

    _onScroll() {
        const offset = window.scrollY;
        if (!this._ticking) {
            this._animationFrame = window.requestAnimationFrame(() => {
                for (const cb of this._callbacks) {
                    cb(offset);
                }
                this._ticking = false;
            })
        }
        this._ticking = true;
    }

}

export default new ScrollService();