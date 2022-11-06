import fs from 'fs'
import path from "path"
import parser from '@babel/parser'
import traverse from "@babel/traverse";
import ejs from "ejs"
import { transformFromAst } from 'babel-core'

let id = 0;

function createAsset(filePath){
  const content = fs.readFileSync(filePath, 'utf-8');

  const ast = parser.parse(content, {
    sourceType: 'module'
  })

  const deps = [];
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

  fs.writeFileSync('./dist/bundle.js', code);
}

build();