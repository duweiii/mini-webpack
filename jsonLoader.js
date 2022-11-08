export function jsonLoader(source){
  this.addDeps("jsonLoader say: wanan makabaka")
  return `export default ${JSON.stringify(source)}`
}