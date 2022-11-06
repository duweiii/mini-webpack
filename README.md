# mini-webpack
敲一个建议打包器哈

# 思路
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