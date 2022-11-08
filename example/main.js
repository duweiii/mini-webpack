import { foo } from './foo.js'
import user from './userInfo.json'
function main(){
  console.log(user)
  foo();
  console.log('main')
}
main();