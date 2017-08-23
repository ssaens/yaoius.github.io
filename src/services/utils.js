import React from 'react';

function strip(s) {

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
    normalizeSpaces,
    keyedJSXList
}