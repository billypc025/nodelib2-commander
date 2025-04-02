require('nodelib2-utils')
const Path = require('node:path')
const exec = require('child_process').exec
const { CSI } = require('./lib/CSI')
const { isPath, isDirectory, isFile } = require('./lib/utils')

const MSG = { error: 31, success: 32, warn: 33, info: 36, note: 90 }.__map(v => s => `${CSI(v)}m${s}${CSI(39)}m`)

const commandFormat = {
    url: v => /^https{0,1}:\/\/[^\s]+$/.test(v),
    path: isPath,
    num: isNum,
    dir: isDirectory,
    file: isFile,
}

function __commander(...arg) {
    let { description = '', paramRules = [] } = Function.getParamsWith(
        ['description:string,paramRules:any[]', 'paramRules:any[]'],
        arg
    )
    let ruleHash = { '$': createRuleItem({ description, cmd: '$' }) },
        result = {},
        params = [],
        options = [],
        groupOptionHash = {},
        groupOptionRegExp = null,
        helpOptionList = ['-h', '--help']

    paramRules.forEach(rule => {
        if (typeof rule == 'string') {
            let ruleObj = getRule('$')
            ruleObj.params.push({ name: rule, required: true })
            ruleObj.result[rule] = ''
        } else if (typeof rule == 'object') {
            let { cmd, rules = [], description = '' } = rule
            if (cmd) {
                let ruleObj = getRule(cmd)
                ruleObj.description = description
                for (let ruleItem of rules) {
                    if (typeof ruleItem == 'string') {
                        ruleObj.params.push({ name: ruleItem, required: true })
                        ruleObj.result[ruleItem] = ''
                    } else {
                        addRule(ruleObj, ruleItem)
                    }
                }
            } else {
                addRule(getRule('$'), rule)
            }
        }
    })

    let [node, entry, ...thisArgs] = process.argv
    let childCmd = thisArgs[0]
    let currRuleItem
    let currCmd = '$'
    if (ruleHash[childCmd]) {
        currRuleItem = ruleHash[childCmd]
        currCmd = childCmd
        thisArgs.shift()
    } else {
        currRuleItem = ruleHash['$']
    }
    setRule(currRuleItem)

    let groupOptionHashKeys = Object.keys(groupOptionHash)
    if (groupOptionHashKeys.length > 1) {
        groupOptionRegExp = new RegExp(`^-([${groupOptionHashKeys.join('')}]{2,})$`)
    }

    if (
        (thisArgs.length == 0 && params.length > 0 && params.some(v => v.required)) ||
        (thisArgs.length == 0 && params.length == 0 && ruleHash.__keys.length > 1) ||
        (thisArgs.length == 1 && ['-h', '--help'].includes(thisArgs[0]))
    ) {
        let jsCmd = Path.basename(entry)
        let cmd = Path.dirname(node) == Path.dirname(entry) ? jsCmd : `node ${jsCmd}`
        currCmd != '$' && (cmd += ` ${currCmd}`)
        let subcommands = Object.keys(ruleHash).removeItem('$')
        showUsage(cmd, ruleHash[currCmd])
        if (subcommands.length > 0 && currCmd == '$') {
            for (let subcmd of subcommands) {
                showUsage(`${cmd} ${subcmd}`, ruleHash[subcmd])
            }
        }
        process.exit()
    }
    let tempParams = [...params]
    let allParams = []
    for (let i = 0; i < thisArgs.length; i++) {
        let item = thisArgs[i],
            name,
            format,
            option
        if (helpOptionList.includes(item)) {
            continue
        }
        let optionMatch = options.match(v => reg_o(v.option, v.alias).test(item) && v)
        if (optionMatch) {
            ;({ name, format, option } = optionMatch)
            if (format && format == 'bool') {
                item = true
            } else {
                item = thisArgs[i + 1]
                i++
            }
        } else {
            groupOptionRegExp && (groupOptionRegExp.lastIndex = 0)
            let gorupOptionMatch = groupOptionRegExp && item.match(groupOptionRegExp)
            if (gorupOptionMatch) {
                gorupOptionMatch[1].split('').forEach(v => {
                    result[groupOptionHash[v]] = true
                })
            } else {
                tempParams.length > 0 && ([{ name, format, option }] = tempParams.splice(0, 1))
                allParams.push(item)
            }
        }
        if (name) {
            if (result[name] && option) {
                trace(
                    MSG.warn('The same parameters will be replaced by the values inputted later: '),
                    `-${option} ${item}`
                )
            }
            result[name] = item
            if (format && format == 'num') {
                result[name] -= 0
            }
        }
    }
    ;[]
        .concat(...params)
        .concat(...options)
        .forEach(({ name, test, format, msg, option, required, values }) => {
            if (required && !result.hasOwnProperty(name)) {
                trace(MSG.error('error: '), `not found`, MSG.error(name), msg ? `(${msg})` : '')
                trace('use --help for more info.')
                process.exit(1)
            }
            if (result.hasOwnProperty(name)) {
                let val = result[name]
                if (format && format != 'bool' && !commandFormat[format](val)) {
                    trace(
                        MSG.error('wrong input: '),
                        MSG.error(option ? `-${option} ${val}` : val),
                        `(require ${msg || format})`
                    )
                    trace('use --help for more info.')
                    process.exit(1)
                }
                if (
                    test &&
                    ((test instanceof Function && !test(val, result, allParams)) ||
                        (test instanceof RegExp && !test.test(val, result, allParams)))
                ) {
                    trace(
                        MSG.error('invalid input: '),
                        MSG.error(option ? `-${option} ${val}` : val),
                        msg ? `(${msg})` : ''
                    )
                    trace('use --help for more info.')
                    process.exit(1)
                }
                if (values && !values[val]) {
                    trace(MSG.error(`${name} can only be:`), values.__keys.join(', '), msg ? `(${msg})` : '')
                    process.exit(1)
                }
            }
        })
    result.$params = allParams
    return result

    function add_(o) {
        return o.length == 1 ? `-${o}` : `--${o}`
    }
    function reg_o(o, a) {
        return new RegExp(`^${!a ? add_(o) : `(${add_(o)}|${add_(a)})`}$`)
    }
    function hl(s, c = 17) {
        return `${CSI(`38;5;${c}m`)}{${s}}${CSI('39m')}`
    }
    function getChar(o, a) {
        if (a && a.length == 1) {
            return a
        } else if (o && o.length == 1) {
            return o
        }
        return ''
    }
    function createRuleItem(obj = {}) {
        return {
            params: [],
            options: [],
            groupOptionHash: {},
            helpOptionList: ['-h', '--help'],
            result: {},
            description: '',
            ...obj,
        }
    }
    function getRule(cmd) {
        if (!ruleHash[cmd]) {
            ruleHash[cmd] = createRuleItem({ cmd })
        }
        return ruleHash[cmd]
    }
    function addRule(ruleObj, rule) {
        let { options, params, helpOptionList, groupOptionHash, result } = ruleObj
        let { name, option, format, test, msg, alias, required = true, values } = rule
        if (!name) {
            return
        }
        ;(option ? options : params).push({
            name,
            required: option ? false : !!required,
            ...(option ? { option } : {}),
            ...(format ? { format } : {}),
            ...(test ? { test } : {}),
            ...(msg ? { msg } : {}),
            ...(option && alias ? { alias } : {}),
            ...(values ? { values } : {}),
        })
        if (option) {
            let hi = helpOptionList.indexOf(add_(option))
            hi >= 0 && helpOptionList.splice(hi, 1)
            if (alias) {
                hi = helpOptionList.indexOf(add_(alias))
                hi >= 0 && helpOptionList.splice(hi, 1)
            }
            if (format == 'bool') {
                result[name] = false
                option.length == 1 && (groupOptionHash[option] = name)
                alias && alias.length == 1 && (groupOptionHash[alias] = name)
            }
        }
    }
    function setRule(ruleItem) {
        result = ruleItem.result
        result.$cmd = ruleItem.cmd
        params = ruleItem.params
        options = ruleItem.options
        groupOptionHash = ruleItem.groupOptionHash
        helpOptionList = ruleItem.helpOptionList
        description = ruleItem.description
    }
    function showUsage(cmd, ruleItem) {
        setRule(ruleItem)

        description && trace(`${currCmd != '$' || ruleItem.cmd == '$' ? '' : MSG.success(cmd + ' ')}${description}\n`)
        trace(
            MSG.info('  Usage: '),
            cmd,
            ...params.map(v => (v.required ? MSG.warn(v.name) : MSG.note(`[${v.name}]`))),
            options.length > 0 ? MSG.note('[OPTIONS]') : ''
        )

        if (params.length + options.length > 0) {
            let tempOptions = options.map(v => [
                `${v.option.length > 1 ? `-` : ''}-${v.option}${
                    v.alias ? `, ${v.alias.length > 1 ? `-` : ''}-${v.alias}` : ''
                }${v.format != 'bool' ? `  <${v.name}>` : ''}`,
                v.msg || ' ',
            ])
            helpOptionList.length > 0 && tempOptions.push([helpOptionList.join(', '), 'show Usage'])
            let longestNameLen = Math.max(...tempOptions.map(v => v[0].length), ...params.map(v => v.name.length)) + 4
            ;(params.length > 0 || options.length > 0) && trace('')
            params.forEach((v, i) => {
                splitLine(v.msg || ' ').forEach((mv, mi) => {
                    trace(
                        i == 0 && mi == 0 ? MSG.note(' Params: ') : '\t ',
                        (mi == 0 ? v.name : '').padEnd(longestNameLen),
                        mv
                    )
                    if (v.values && typeof v.values == 'object' && v.values.__keys.length > 0) {
                        v.values.__forEach((val, valDesc) => {
                            trace('\t', ''.padEnd(longestNameLen - 7), `=>      ${val} ${valDesc}`)
                        })
                        trace()
                    }
                })
            })
            tempOptions.forEach(([a, b], i) => {
                splitLine(b).forEach((bv, bi) => {
                    trace(
                        i == 0 && bi == 0 ? MSG.note('OPTIONS: ') : '\t ',
                        (bi == 0 ? a : '').padEnd(longestNameLen),
                        bv
                    )
                })
            })
        }
        trace('')
        trace(MSG.note('Example:'))
        if (params.some(v => !v.required)) {
            trace(
                `$`,
                cmd,
                params
                    .filter(v => v.required)
                    .map(v => hl(v.name))
                    .join(' ')
            )
        }
        trace(`$`, cmd, params.map(v => hl(v.name)).join(' '))
        if (options.length > 0) {
            let traceList = [
                `$`,
                cmd,
                ...params.filter(v => v.required).map(v => hl(v.name)),
                ...options.filter(v => v.format != 'bool').map(v => `${add_(v.option)} ${hl(v.name)}`),
                ...options.filter(v => v.format == 'bool' && !getChar(v.option, v.alias)).map(v => add_(v.option)),
                '-' +
                    options
                        .filter(v => v.format == 'bool' && getChar(v.option, v.alias))
                        .map(v => v.option)
                        .join(''),
            ]
            trace(...traceList)
            if (params.some(v => !v.required)) {
                let traceList = [
                    `$`,
                    cmd,
                    ...params.map(v => hl(v.name)),
                    ...options.filter(v => v.format != 'bool').map(v => `${add_(v.option)} ${hl(v.name)}`),
                    ...options.filter(v => v.format == 'bool' && !getChar(v.option, v.alias)).map(v => add_(v.option)),
                    '-' +
                        options
                            .filter(v => v.format == 'bool' && getChar(v.option, v.alias))
                            .map(v => v.option)
                            .join(''),
                ]
                trace(...traceList)
            }
        }
        trace('\n')
    }
    function splitLine(s, len = 60) {
        if (process.stdout.columns > 150) {
            len = 130
        } else if (process.stdout.columns < 70) {
            len = 50
        }
        let lines = ['']
        let lineLen = 0
        s.split('').forEach(v => {
            let l = getBytesLen(v)
            if (lineLen + l <= len) {
                lines.last += v
                lineLen += l
            } else {
                lines.last += ' '.repeat(len - lineLen)
                lines.push(v)
                lineLen = l
            }
        })
        return lines
    }
}

module.exports = {
    __commander,
}
