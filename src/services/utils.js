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

function makeRequest(method, url) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open(method, url);
        xhr.onload = function () {
            if (this.status >= 200 && this.status < 300) {
                resolve(xhr.response);
            } else {
                reject({
                    status: this.status,
                    statusText: xhr.statusText
                });
            }
        };
        xhr.onerror = function () {
            reject({
                status: this.status,
                statusText: xhr.statusText
            });
        };
        xhr.send();
    });
}

function fetchJson(url) {
    return makeRequest('GET', url).then(data => {
        return JSON.parse(data);
    });
}

export {
    strip,
    leftTrim,
    longestCommonPrefix,
    normalizeSpaces,
    keyedJSXList,
    makeRequest,
    fetchJson
}