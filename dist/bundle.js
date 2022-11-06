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
})({
  
    0: [function (require, module, exports){
      "use strict";

var _foo = require("./foo.js");

function main() {
  (0, _foo.foo)();
  console.log('main');
}

main();
    },{"./foo.js":1}],
  
    1: [function (require, module, exports){
      "use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.foo = foo;

var _bar = require("./bar.js");

var _barTwo = require("./bar-two.js");

function foo() {
  (0, _bar.bar)();
  (0, _barTwo.bar2)();
  console.log('this is foo');
}
    },{"./bar.js":2,"./bar-two.js":3}],
  
    2: [function (require, module, exports){
      "use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.bar = bar;

function bar() {
  console.log("this is bar");
}
    },{}],
  
    3: [function (require, module, exports){
      "use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.bar2 = bar2;

function bar2() {
  console.log('bar2');
}
    },{}],
  
});