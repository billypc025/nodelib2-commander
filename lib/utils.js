const FS = require('node:fs')

function isDirectory(path, link = false) {
    return FS[link ? 'lstatSync' : 'statSync'](path).isDirectory()
}

function isFile(path, link = false) {
    return FS[link ? 'lstatSync' : 'statSync'](path).isFile()
}

function isPath(str) {
    str = str.replace(/^\s+|\s+$/g, '')
    if (process.platform === 'win32') {
        if ([/^(\.{1,2}\/){0,1}[^:/\*?|"<>]+$/, /^[a-zA-Z]:\\[^,:;/\*?|!'"<>[]{}\t\r\n]+$/].some(v => v.test(str))) {
            return true
        }
    } else if ([/^(\.{1,2}\/){0,1}[^:]+$/, /^\/[^:]+$/].some(v => v.test(str))) {
        return true
    }
    return false
}

function isNum(v) {
    return typeof v == 'number' || (!!v && typeof v == 'string' && !isNaN(Number(v)))
}

function match(a, f) {
    let result = null
    for (let i = 0; i < a.length; i++) {
        result = f(a[i], Number(i), a)
        if (result) return result
    }
    return result
}

module.exports = {
    isDirectory,
    isFile,
    isPath,
    isNum,
    match,
}
