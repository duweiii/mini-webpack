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

var _userInfo = require("./userInfo.json");

var _userInfo2 = _interopRequireDefault(_userInfo);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function main() {
  console.log(_userInfo2.default);
  (0, _foo.foo)();
  console.log('main');
}

main();
    },{"./foo.js":1,"./userInfo.json":2}],
  
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
    },{"./bar.js":3,"./bar-two.js":4}],
  
    2: [function (require, module, exports){
      "use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = "{\r\n  \"name\": \"张三\",\r\n  \"age\": 32,\r\n  \"gender\": \"male\",\r\n  \"nickName\": \"法外狂徒\"\r\n}";
    },{}],
  
    3: [function (require, module, exports){
      "use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.bar = bar;

function bar() {
  console.log("this is bar");
}
    },{}],
  
    4: [function (require, module, exports){
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