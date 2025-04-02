# nodelib2-commander

一个轻量化 node.js 命令行工具开发包, 类似 commander, 实现命令行解析、参数校验、自动生成 help 等最常用的功能.

## Features

-   自动生成 Usage, `-h`,`--help` 查看 Usage
-   支持 `child-cmd`, 及嵌套
-   支持 `alias`
-   可配置参数的缺省值
-   可配置参数值校验: 正则 or 校验函数
-   可配置参数值域: 配置值域枚举值

## Install

```shell
npm install nodelib2-commander
```

## Use

### Example 1: 简单的上手示例

```javascript
// examples/simple-demo.js
const { __commander } = require('nodelib2-commander')

const { param_1, param_2 } = __commander(['param_1', 'param_2'])

console.log('param_1:', param_1)
console.log('param_2:', param_2)
```

```shell
$ node examples/simple-demo 1 2
# 终端会打印出两个参数
param_1: 1
param_2: 2

```

### Example 2: 更详细的配置示例

```javascript
// examples/ls-demo.js
const FS = require('node:fs')
const { __commander } = require('nodelib2-commander')

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
    trace(files.join('\n'))
}
```

```shell
$ node examples/ls-demo .
# 终端会输入当前目录里的所有文件
README.md
examples
index.d.ts
index.js
lib
node_modules
package-lock.json
package.json
```

> 你只要稍微改动一下, 比如针对输出的文件列表, 用颜色区分 `File`、`Dir`、`SymLink`, 就可以得到一个增强型的 `ls` 命令行

## API

#### `__commander(...)`

```typescript
function __commander(
    description: string,
    paramRules: CmdParamRules[]
): { $params: string[]; $cmd?: string; [paramName: string]: string }

function __commander(paramRules: CmdParamRules[]): {
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
```

| param         | description                  |
| ------------- | ---------------------------- |
| `description` | 描述                         |
| `paramRules`  | 参数规则列表 (CmdParamRules) |

#### `<Type> CmdParamRules`

规则列表定义

```typescript
type CmdParamRules =
    | CmdParam
    | string // 参数名称, (参见 Example 1: 简单上手示例)
    | {
          /**
           * 子命令名称
           */
          cmd: string
          /**
           * 子命令规则列表
           */
          rules?: CmdParam[]
          /**
           * 子命令描述文本
           */
          description?: string
      }
```

#### `<Type> CmdParam`

规则项定义

```typescript
type CmdParam = {
    name: string
    option?: string
    required?: boolean
    format?: 'url' | 'path' | 'bool' | 'num' | 'dir' | 'file'
    test?: RegExp | ((val: string, result: object, params: any[]) => boolean)
    msg?: string
    alias?: string
    values?: { [key: string]: string }
}
```

| param      | description                                                                                                               |
| ---------- | ------------------------------------------------------------------------------------------------------------------------- |
| `name`     | 参数名称 / 选项名称                                                                                                       |
| `option`   | 选项名(非选项参数不用设置 option), 设置后可以使用 `-option_name <option_val>`                                             |
| `required` | 是否必要参数（参数默认`true`, 选项均为`false`）                                                                           |
| `format`   | 参数值类型: `'url'` `'path'` `'bool'` `'num'` `'dir'` `'file'` (具体见下方)                                               |
| `test`     | 参数值校验: 正则表达式 or 一个返回布尔值的校验函数                                                                        |
| `msg`      | help 信息, 仅在--help 时可见                                                                                              |
| `alias`    | 选项别名 (仅为 option 时有效)                                                                                             |
| `values`   | 枚举值列表（表示值的可选范围， 设置后会自动对值进行校验）<br>- 格式为 KV 键值对<br> - `key`: 可取的值<br> - `value`: 描述 |

| format 类型值 | description                 |
| ------------- | --------------------------- |
| `'url'`       | 网址                        |
| `'path'`      | 是路径类型 (不判断是否存在) |
| `'bool'`      | 开关选项                    |
| `'num'`       | 数值类型                    |
| `'dir'`       | 是目录类型, 并且存在        |
| `'file'`      | 是文件类型, 并且存在        |

## More examples

### 实现一个 download.js, 用于将 url 下载到本地存为文件

```javascript
// download.js如下:
let { url, output } = __commander(['url', 'output'])
// 也可以这样:
let { url, output } = __commander('description', ['url', 'output'])

// 如果需要对参数进行校验:
let { url, output } = __commander([
    {
        name: 'url',
        format: 'url', //表示该字段值必须为url格式
        msg: '要下载的网址', //字段提示信息
    },
    {
        name: 'output_file',
        option: 'o',
        format: 'path', //表示该字段值必须为path格式
        msg: '输出文件路径',
    },
])
// ... write code below
```

```shell
# 示例命令

$> node download.js https://www.domain.com -o index.html
```

```shell
# 可以使用 --help 或 -h 来查看 Usage

$> node download.js --help
Usage: node download.js url [OPTIONS]

params: url 要下载的网址
OPTIONS: -o <output_file> 输出文件路径
-h, --help show Usage
```

如需自定义 Usage, 只需要配置-h、--help 参数选项并在主程序中处理即可

```javascript
{name: 'help', option: 'h', alias:'help'} // 规则列表加入这一行即可
```

### 当有多个开关选项时, 可以连写,比如如下配置

```javascript
;[
    { name: 'a', option: 'a', format: 'bool' },
    { name: 'b', option: 'b', format: 'bool' },
    { name: 'c', option: 'c', format: 'bool' },
]

//$> commandName -abc
// 需要注意的是: 仅针对开关型的选项, 并且只对单字符有效, 比如配置了 -a -add -b -ban, 只有-a -b 可以连写为-ab
```

### 假如你的 CommandLine 需要支持不限个数的参数, 可以使用 &params 来获取结果

```javascript
// main.js
let { $params } = __commander([])
trace($params)[
    //$> node main tom jerry jim tina
    ('tom', 'jerry', 'jim', 'tina')
]
```

### 一个简单的 serve 的 demo

```javascript
const FS = reqiore('node:fs')
const Path = reqiore('node:path')

let {
    web_root = '',
    serverPort = 50000,
    quiet,
} = __commander([
    {
        name: 'web_root',
        required: false,
        msg: '网站根目录(默认以当前目录作为站点)',
        format: 'path',
        test: g.fs.existsSync,
    },
    {
        name: 'serverPort',
        option: 'p',
        msg: '端口号(50000-59999)',
        format: 'num',
        test: v => v.inRange([50000, 59999]),
    },
    {
        name: 'quiet',
        option: 'q',
        msg: '静默执行',
        format: 'bool',
        alias: 'quiet',
    },
    {
        name: 'config_file',
        option: 'c',
        msg: '配置文件(json文件)',
        format: 'path',
        test: v => Path.extname(v) === '.json' && FS.existsSync(v),
    },
])

// ... write your code
```

```shell
# 可以使用 --help 或 -h 来查看 Usage
$> openthis -h
  Usage:  openthis [web_root] [OPTIONS]

 params:  web_root             网站根目录(默认以当前目录作为站点)
OPTIONS:  -p <serverPort>      端口号(50000-59999)
          -q, --quiet          静默执行
          -c <config_file>     配置文件(json文件)
          -h, --help           show Usage
```

```shell
# 如果使用命令时键入了不正确的参数, 将会给出以下错误提示
$> openthis {wrong-path}
invalid input:  {wrong-path} (网站根目录(默认以当前目录作为站点))
use --help for more info.
```

#### imgthis 图片转换工具的命令行生成示例

```javascript
const FS = reqiore('node:fs')

let {
    sourcePath = '',
    quality = 50,
    allChild = false,
    format = 'jpg',
    width,
    height,
    customSize,
    room = '',
} = __commander([
    //源路径, test 设为 FS.existsSync 以验证有效性
    { name: 'sourcePath', msg: '源图片目录', test: FS.existsSync },
    // 品质的范围是(1-100)
    { name: 'quality', option: 'q', msg: '输出品质(1-100)', format: 'num', test: v => v.inRange([1, 100]) },
    { name: 'width', option: 'w', msg: '图片输出宽度(大于0的正整数)', format: 'num', test: /^[1-9][0-9]*$/ },
    { name: 'height', option: 'h', msg: '图片输出高度(大于0的正整数)', format: 'num', test: /^[1-9][0-9]*$/ },
    // -c选项是一个开关: 是否保持等比例
    { name: 'customSize', option: 'c', msg: '自由变换不保持图片比例', format: 'bool' },
    {
        name: 'room',
        option: 'r',
        msg: '图片等比缩放倍率 (格式为x<num> num为大于0的整数或小数), 如: x0.5, x1, x2, x3 (当设置了宽高或自由变换时不生效)',
        test: /^x([1-9][0-9]*(\.[0-9]+)?|0?\.[0-9]*[1-9]0*)$/,
    },
    // 用正则来验证文件格式
    { name: 'format', option: 'f', msg: '图片格式: jpg, jpeg, png, gif, bmp', test: /^\.{0,1}(jpg|jpeg|png|bmp|gif)$/ },
    { name: 'allChild', option: 's', format: 'bool', msg: '源路径为目录时是否包含子目录' },
])
```

### 一个 backup 命令的示例, 用到了子命令

```javascript
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

switch (result.$cmd) {
    case '$': //主命令
        // $ backup xxxxxx.js
        trace(result) //{file_path: 'xxxxxx.js'}
        break
    case 'ls':
        // $ backup ls -a
        trace(result) ////{name: '', all: true}
        break
    case 'add':
        // $ backup add ./src
        trace(result) //{dir_path: './src'}
        break
    case 'use':
        // $ backup use ./backup_cfg.json
        trace(result) //{config_file: './backup_cfg.json'}
        break
}
```
