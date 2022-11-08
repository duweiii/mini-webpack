# mini-webpack
敲一个建议打包器哈

## 打包器实现思路
1.  想要把资源文件打包到一起，需要掌握的信息：依赖关系 + 文件内容
2.  首先封装了一个通过filePath读取文件内容的函数createAsset，函数的作用为👇
    1.  在函数内读取代码内容
    2.  借助@babel/parser将代码转换为ast
    3.  借助@babel/traverse找到Import语法节点，找出依赖对象的路径（相对路径）
    4.  借助babel-core/transformFromAst对esm代码进行转译，得到转义后代码
    5.  初始化一个mapping对象，用来在生成的代码中，避免不同目录下有相同的相对路径的冲突问题。
    6.  给每一个文件的信息中都添加一个id，此id为全局变量，每次调用createAsset的返回值中都使用 id: id++
    7.  return {id, filePath, code, mapping, deps}
    综上3条，可以读取到文件的代码+依赖了。后面再顺着文件引用，处理完所有文件
3.  而后封装了一个处理所有文件的函数createGraph
    1.  先手动调用createAsset，传入入口文件的地址。（地址需要处理成绝对地址，用来处理循环引用）
    2.  然后放到一个队列中，for of遍历此队列，遍历过程中，对每一个子元素（对应每一个文件信息），遍历其依赖项，生成绝对路径，调用createAsset，得到返回的代码文件信息，push进队列。
    3.  在上面的2所说的遍历每一个文件的过程中，需要判断对应的绝对路径，如果在queue的某个元素的filePath中存在，就不再处理了。
    4.  因为在代码中使用的会存在相对路径。所以在遍历时要给mapping添加数据，key为相对路径，值为每个文件信息的id
    5.  return {id,code,mapping}[]
4.  使用ejs模板插值
    ```js
      (function(modules){
        function require(id){
          const [fn, mapping] = modules[id]

          const module = {
            exports: {}
          }

          function localRequire(relativePath){
            const id = mapping[relativePath];
            return require(id);
          }

          fn(localRequire, module, module.exports);

          return module.exports;
        }
        require(0);
      })({[function(require, modules, exports){ /** code */ }, {relativePath: id}],})
    ```

## Loader实现思路
1.  打包器只能处理JS文件，loader的作用就是处理一些打包器处理不了的文件，比如.json
2.  我们可以在webpack.config中配置一系列loader，比如匹配到json文件，使用jsonLoader
    ```js
    config = {
      module: {
        rules: [
          {
            test: /\.json$/,
            use: [jsonLoader]
          }
        ]
      }
    }
    ```
3.  打包器内部支持
    其实就是在获取到文件内容后，拿到所有的rules，去匹配当前文件是否命中，命中了，就拿出对应的loaders去执行，这里可能还有一个执行顺序的问题，所以有些场景下需要顺序或者倒叙执行。
    简单逻辑👇
    <!-- 打包器支持 -->
    ```js
    const code = fs.readFileSync(xxx)
    ...
    loaders.reverse().forEach(loader => {
      code = loader();
    })
    <!-- 继续走处理JS文件的逻辑 -->
    ```
    <!-- loader -->
    ```js
    function jsonLoader(source){
      return `export default ${JSON.stringify(source)}`
    }  
    ```
4.  另外如果loader中也有别的一些需求,比如需要补充当前文件的依赖,我们就可以在打包器内对其做支持,
    提供API,调用时可以补充依赖
    这里既可以传递APIs给loader,也可以通过修改this指向,直接使loader的this指向APIs
    ```js
    // 打包器
    ...
    const APIs = {
      addDeps(value){
        deps.push(value)
      }
    }
    // 👇 loader
    function jsonLoader(source){
      this.addDeps("xxx")
      return `export default ${JSON.stringify(source)}`
    }  
    ```


## Plugin
1.  plugin的机制就是事件的注册与触发,初始化时注册事件,在某些时机下触发对应的事件.
    loader是为了帮助打包器处理一下js以外的文件,
    plugin是为了影响改变打包器的行为
2.  plugin的关键有两点. 
    1.  事件注册
    2.  事件触发
3.  webpack的plugin机制底层依赖是名为`tapable`的库
    tapable提供各种方式的事件机制,比如同步/异步
4.  打包器对plugin的支持
    1.  打包器运行时,初始化一系列hooks
    2.  初始化plugin,在这个过程进行事件注册
    3.  在某些时机,进行事件触发
5.  举例
    比如我们开发一个修改打包后输出目录的plugin
    1.  打包器做支持,规定初始化时,会调用plugin的apply方法进行初始化
    2.  plugin内,封装类,准备apply方法,接收到hooks,执行时,使用hooks在对应的hook上注册事件
        ```js
        hooks.changeOutputHook.tap('xx', callback)
        ```
    3.  打包器内在对应的时机,此处就是在最后要输出文件之前,触发事件.
        准备对应的API,传递给callback,或者一系列APIs,传递给callback由其自己调用.
        此处需要注意,这里的参数传递是经过`tapable`的类来传递的,需要在new SyncHooks时就进行声明
        ```js 
        changeOutputHook: new SyncHooks(['APIs'])
        ```
    4.  最后在plugin的callback内就可以调用APIs里的方法去影响打包器了
        ```js
        class ChangeOutputPlugin{
          apply(hooks){
            hooks.changeOutputHook.tap('xx', (APIs) => {
              APIs.changeOutpoutPath('./xxx/xxx.js')
            })
          }
        }
        ```