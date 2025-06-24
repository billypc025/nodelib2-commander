const { __commander } = require('../index')

//一个backup命令的示例, 用到了子命令

let result = __commander([
    { name: 'file_path' }, //主命令可以传一个参数
    {
        //子命令 ls
        cmd: 'ls',
        rules: ['name', { name: 'all', option: 'a', format: 'bool', alias: 'all' }],
        description: 'ls subcommand',
    },
    { cmd: 'add', rules: ['dir_path'], description: 'add subcommand' }, //子命令 add
    { cmd: 'use', rules: ['config_file'], description: 'use subcommand' }, //子命令 use
])

console.log(result)
