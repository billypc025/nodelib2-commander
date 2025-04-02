type CmdParam = {
    /**
     * 参数名称 / 选项名称
     */
    name: string
    /**
     * 选项名(非选项参数不用设置option), 设置后可以使用 [-option_name <option_val>]
     */
    option?: string
    /**
     * 是否必要参数（参数默认true, 选项均为false）
     */
    required?: boolean
    /**
     * 参数值类型
     *
     * - `'url'`  网址
     * - `'path'`  是路径类型 (不判断是否存在)
     * - `'bool'`  开关选项
     * - `'num'`  数值类型
     * - `'dir'`  是目录类型, 并且存在
     * - `'file'` 是文件类型, 并且存在
     */
    format?: 'url' | 'path' | 'bool' | 'num' | 'dir' | 'file'
    /**
     * 参数值校验: 正则表达式 or 一个返回布尔值的校验函数
     */
    test?: RegExp | ((val: string, result: object, params: any[]) => boolean)
    /**
     * help信息, 仅在--help时可见
     */
    msg?: string
    /**
     * 选项别名 (仅为option时有效)
     */
    alias?: string
    /**
     * 枚举值列表（表示值的可选范围， 设置后会自动对值进行校验）
     */
    values?: { [key: string]: string }
}

type CmdParamRules =
    | CmdParam
    | string
    | {
          /**
           * 子命令名称
           *
           * @example
           * //一个backup命令的示例, 用到了子命令
           *
           * let result = __commander([
           *     { name: 'file_path' }, //主命令可以传一个参数
           *     {
           *         //子命令 ls
           *         cmd: 'ls',
           *         rules: ['name', { name: 'all', option: 'a', format: 'bool', alias: 'all' }],
           *         description: 'ls subcommand',
           *     },
           *     { cmd: 'add', rules: ['dir_path'], description: 'add subcommand' }, //子命令 add
           *     { cmd: 'use', rules: ['config_file'], description: 'use subcommand' }, //子命令 use
           * ])
           *
           */
          cmd: string
          /**
           * 子命令参数配置列表
           *
           * @example
           * //一个backup命令的示例, 用到了子命令
           *
           * let result = __commander([
           *     { name: 'file_path' }, //主命令可以传一个参数
           *     {
           *         //子命令 ls
           *         cmd: 'ls',
           *         rules: ['name', { name: 'all', option: 'a', format: 'bool', alias: 'all' }],
           *         description: 'ls subcommand',
           *     },
           *     { cmd: 'add', rules: ['dir_path'], description: 'add subcommand' }, //子命令 add
           *     { cmd: 'use', rules: ['config_file'], description: 'use subcommand' }, //子命令 use
           * ])
           *
           */
          rules?: CmdParam[]
          description?: string
      }

/**
 * 命令行解析器，解析得到命令行输入的参数及选项
 *
 * @param description 命令描述
 * @param paramRules 参数规则列表
 * - 2种配置规则可选: `string`[] | `CmdParam[]`
 * - `string[]`: 仅能设置参数名称, 且所有参数均是必要参数
 * - `CmdParam[]`: 可针对性的设置 `required`, `format`, `test`, `msg` ...等
 * @returns 参数结果 其中$params为所有输入的参数 $cmd为当前处理的子命令名称
 *
 * @example
 *
 * ---shell
 * # 比如要实现一个download.js, 用于将url下载到本地存为文件
 * $> node download.js https://www.domain.com -o index.html
 * ---shell.end
 *
 * // download.js如下:
 * let { url, output } = __commander(['url', 'output'])
 * // 也可以这样:
 * let { url, output } = __commander('description',['url', 'output'])
 *
 * // 如果需要对参数进行校验:
 * let { url, output } = __commander([
 *     {
 *         name: 'url',
 *         format: 'url', //表示该字段值必须为url格式
 *         msg: '要下载的网址', //字段提示信息
 *     },
 *     {
 *         name: 'output_file',
 *         option: 'o',
 *         format: 'path', //表示该字段值必须为path格式
 *         msg: '输出文件路径',
 *     },
 * ])
 *
 * ---shell
 * # 可以使用 --help 或 -h 来查看 Usage
 * $> node download.js --help
 *   Usage:  node download.js url [OPTIONS]
 *
 *  params:  url                  要下载的网址
 * OPTIONS:  -o <output_file>     输出文件路径
 *           -h, --help           show Usage
 * ---shell.end
 *
 * //如需自定义Usage, 只需要配置-h、--help参数选项并在主程序中处理即可
 * {name: 'help', option: 'h', alias:'help'}
 *
 */
export function __commander(
    description: string,
    paramRules: CmdParamRules[]
): { $params: string[]; $cmd?: string; [paramName: string]: string }
export function __commander(paramRules: CmdParamRules[]): {
    /**
     * 所有输入参数的数组
     */
    $params: string[]
    /**
     * 如果当前是子命令, 返回子命令名称
     */
    $cmd?: string
    [paramName: string]: string
}
