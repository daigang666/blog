# JavaScript中的原型链详解
> 对于使用过Java或者C++这种基于类的编程语言的同学来说，原型链无疑是JavaScript中最费解的概念之一。因为JavaScript中没有“类”的概念，即使ES6中新增了如class关键字，但是那也是语法糖，实际上JavaScript任然是基于原型的。
## 使用构造函数创建对象
我们先使用构造函数创建一个对象
```JavaScript
function Person() {
}
var person = new Person();
console.log(person);
```
我们在这个示例里编写了一个简单的构造函数Person，使用new操作符创建了一个实例对象person。
我们继续看
## prototype
将上面的代码粘贴至控制台执行，并输入`Person.`会发现控制台提示我们Person具有一系列的属性（因为函数也一种对象），其中就有我们在各种资料，源码中最常见的属性`prototype`，那么这个prototype属性究竟指向了什么呢？是函数的原型吗？我们来尝试改造一下我们的示例：
```JavaScript
function Person() {
}
Person.prototype.name = 'xiaoming';
var person1 = new Person();
var person2 = new Person();
console.log(person1.name); // xiaoming
console.log(person2.name); // xiaoming
```
> prototype是函数才会有的属性

通过代码逻辑或者打印实例对象本身我们可以知道，实例对象person1本身是不存在name属性。同时从上面的结果中不难发现两个Person的实例对象访问name属性时，获取到了同一个结果。

其实，函数的prototype属性指向了一个对象，这个对象正是调用该构造函数创建的实例的原型，也就是上面 示例中person1和person2的原型。

那什么是原型呢？可以这样理解：每一个JavaScript对象（null除外）在创建的时候都会关联另外一个对象，这个对象就是我们所说的原型，每一个对象都会从原型“继承”属性。

这里我们知道了构造函数和实例原型的关系，那么我们怎么表示实例对象和实例原型的关系呢？这里就不得不提到另外一个属性`__proto__`了。
## \_\_proto\_\_
每个JavaScript对象（null除外）都有一个__proto__属性，这个属性指向该对象的原型。
> \_\_proto\_\_属性是对象的隐藏属性[[Prototype]]的setter/getter，现在更推荐使用Object.setPrototypeOf/Object.getPrototypeOf去代替使用__proto__属性去set/get原型。
```javaScript
function Person() {

}
var person = new Person();
console.log(person.__proto__ === Person.prototype); // true
```
由此我们知道了，实例对象的__proto__属性指向构造函数的的prototype属性，也就是实例的原型。

那么实例的原型能不能指向实例呢？

## constructor
指向实例的倒是没有，因为一个构造函数可以实例化多个对象，但是指向构造函数的是有的，这就是要说的第三个属性constructor，每个原型都有一个constructor属性指向关联的构造函数。
```javascript
function Person() {

}
var person = new Person();
console.log(Person.prototype.constructor === Person);
```
到这里我们就得到了，构造函数，实例对象和实例原型的关系


