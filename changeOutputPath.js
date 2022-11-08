export class ChangeOutputPlugin{
  apply(hooks){
    hooks.changeOutputHooks.tap('change out put path', (pluginAPIs) => {
      pluginAPIs.changeOutputPath('./dist/xiaodu.js')
    })
  }
}