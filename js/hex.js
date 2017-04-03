function hex(q, r) {
    this.q = q;
    this.r = r;
    this.s = 1 - q - r;
    
    this.add_hex = function(h) {
        this.q += h.q;
        this.r += h.r;
        this.s = 1 - this.q - this.r;
        return this;
    }
    
    this.sub_hex = function(h) {
        this.q -= h.q;
        this.r -= h.r;
        this.s = 1 - this.q - this.r;
        return this;
    }
        
}

function hex_add(h1, h2) {
    return new hex(h1.q + h2.q, h1.r + h2.r);
}

function hex_sub(h1, h2) {
    return new hex(h1.q - h2.q, h1.r - h2.r);
}

function hex_mul(h, k) {
    return new hex(h.q * k, h.r * k);
}