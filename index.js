import fs from 'fs'
import path from "path"
import parser from '@babel/parser'
import traverse from "@babel/traverse";
import ejs from "ejs"
import { transformFromAst } from 'babel-core'
import { jsonLoader } from './jsonLoader.js'
import { SyncHook } from 'tapable';
import { ChangeOutputPlugin } from './changeOutputPath.js'

let id = 0;

const webpackConfig = {
  plugins: [ new ChangeOutputPlugin()],
  module: {
    rules: [
      {
        test: /\.json$/,
        use: [jsonLoader]
      }
    ]
  }
}

const hooks = {
  changeOutputHooks: new SyncHook(['pluginAPIs']),
}

function initPlugin(){
  webpackConfig.plugins.forEach(plugin => {
    plugin.apply(hooks)
  })
}
initPlugin();

function createAsset(filePath){
  let content = fs.readFileSync(filePath, 'utf-8');
  const deps = [];

  // loaderContext
  const loaderContext = {
    addDeps(value){
      // 比如可以在这个上下问对象中提供补充依赖的能力。
      // deps.push(value)
      // console.log(value, "execute in this function(createAsset), you can do something")
    }
  }

  // Loader
  webpackConfig.module.rules.forEach( rule => {
    if(rule.test.test(filePath)){
      const loaders = rule.use;
      if( Array.isArray(loaders) ){
        loaders.reverse().forEach(loader => {
          content = loader.call(loaderContext, content);
        })
      }else if( typeof loader === 'function'){
        content = loaders.call(loaderContext, content);
      }
    }
  })

  const ast = parser.parse(content, {
    sourceType: 'module'
  })

  traverse.default(ast, {
    ImportDeclaration(node) {
      deps.push(node.node.source.value);
    }
  })

  const { code } = transformFromAst(ast, null, {
    presets: ['env']
  })

  return {
    filePath,
    code,
    deps,
    id: id++,
    mapping: {}
  };
}

function createGraph(originPath){
  const mainAssets = createAsset(originPath)
  const queue = [mainAssets];
  for (const asset of queue) {
    asset.deps.forEach(relativePath => {
      // TODO 有文件夹层级后怎么处理
      const absolutePath = path.resolve('./example', relativePath)
      // 防止重复生成node
      let index = queue.findIndex(item => item.filePath === absolutePath)
      if( index === -1 ){
        const child = createAsset(absolutePath);
        asset.mapping[relativePath] = child.id;
        queue.push(child)
      }
    })
  }
  // 到这，代码的依赖关系和内容就整理好了。
  // 接下来打包到一起
  return queue;
}


function build(){
  const graph = createGraph(path.resolve('./example/main.js'))

  const template = fs.readFileSync('./bundle.ejs', 'utf-8')

  const data = graph.map( asset => {
    const { code, id, mapping} = asset;
    return {
      id,
      code,
      mapping,
    }
  })

  const code = ejs.render(template, { data })

  let outputPath = './dist/bundle.js';
  const pluginAPIs = {
    changeOutputPath(path){
      outputPath = path;
    }
  }
  
  hooks.changeOutputHooks.call(pluginAPIs)

  fs.writeFileSync(outputPath, code);
}

build();