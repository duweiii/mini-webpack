import { bar } from './bar.js'
import { bar2 } from './bar-two.js'
export function foo(){
  bar();
  bar2();
  console.log('this is foo')
}