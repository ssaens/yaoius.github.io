import React from 'react';

function strip(s) {

}

function longestCommonPrefix(strings) {
    let lcp = null;
    for (const s of strings) {
        if (lcp === null) {
            lcp = s;
            continue;
        }
        for (let i = 0; i < lcp.length; ++i) {
            if (s.charAt(i) !== lcp.charAt(i)) {
                lcp = lcp.substring(0, i);
                break;
            }
        }
    }
    return lcp;
}

function leftTrim(s) {
    return s.replace(/^\s+/,"");
}

function normalizeSpaces(s) {
    return s.replace(/  +/g, ' ');
}

function keyedJSXList(list) {
    const keyed = [];
    let i = 0;
    for (const item of list) {
        if (typeof item === 'object') {
            const Tag = item.tag;
            keyed.push(<Tag key={i++}>{item.content}</Tag>);
        }
    }
    return keyed;
}

export {
    strip,
    leftTrim,
    longestCommonPrefix,
    normalizeSpaces,
    keyedJSXList
}