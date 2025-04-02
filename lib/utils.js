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

module.exports = {
    isDirectory,
    isFile,
    isPath,
}
