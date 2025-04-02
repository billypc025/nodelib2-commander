const { __commander } = require('../index')

const { param_1, param_2 } = __commander(['param_1', 'param_2'])

console.log('param_1:', param_1)
console.log('param_2:', param_2)
