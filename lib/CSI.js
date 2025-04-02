const ESC = Object.defineProperties(v => `\x1b${v}`, { toString: { value: () => '\x1b' } })
const utils = {
    getOutStringByArg(...arg) {
        return arg
            .map(v => `${v}`)
            .map(v => (v.includes(ESC) ? v : v.startsWith('_') ? v.substring(1) : ESC(`[${v}`)))
            .join('')
    },
    getCSIIntroducer(codes) {
        return codes.split('').mapToHash(v => ({
            value: Object.defineProperties(n => ESC(`[${n || ''}${v}`), { toString: { value: () => ESC(`[${v}`) } }),
        }))
    },
}
const CSI = Object.defineProperties((...arg) => utils.getOutStringByArg(...arg), utils.getCSIIntroducer('ABCDGKST'))

module.exports = {
    ESC,
    CSI,
}
