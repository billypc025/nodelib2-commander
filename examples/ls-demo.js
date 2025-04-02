const FS = require('node:fs')
const { __commander } = require('../index')

const {
    input_dir, // 参数名和下面的配置信息必须是一一对应的
    output_file,
} = __commander('这是命令的描述文本', [
    {
        name: 'input_dir', // 参数名称 (仅用于从返回中提取值）
        required: true, // 必须的参数 (如果不传会提示报错并process.exit(1))
        format: 'dir', // 参数必须是一个已存在的目录路径
        msg: '目录路径', // 参数描述 (用于 -h,--help 生成Usage)
    },
    {
        name: 'output_file', // 参数名称 (仅用于从返回中提取值）
        option: 'outputReport', // 选项名称
        format: 'path', // 值是一个有效路径
        alias: 'o', // 别名
        msg: '保存清单到文件', //参数描述 (用于 -h,--help 生成Usage)
    },
])

// 获取 <input_dir> 的目录文件列表
let files = FS.readdirSync(input_dir)
if (output_file) {
    // 保存到 <output_file>
    FS.writeFileSync(output_file, JSON.stringify(files.join('\n')))
} else {
    // 在终端输出
    console.log(files.join('\n'))
}
