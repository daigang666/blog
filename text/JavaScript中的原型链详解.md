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
# prototype
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
# \_\_proto\_\_
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

# constructor
指向实例的倒是没有，因为一个构造函数可以实例化多个对象，但是指向构造函数的是有的，这就是要说的第三个属性constructor，每个原型都有一个constructor属性指向关联的构造函数。
```javascript
function Person() {

}
var person = new Person();
console.log(Person.prototype.constructor === Person);
```
到这里我们就得到了，构造函数，实例对象和实例原型的关系，画出如下关系图：

![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/c7c16d51e7c64684ac1c81e91e643f15~tplv-k3u1fbpfcp-watermark.image?)

# 实例与原型
当我们去访问实例的属性时，如果当前实例本身不存在该属性，就会去与之关联的对象也就是它的原型去找，如果还找不到，就会去找原型的原型，找到终点为止。我们来继续改造一下之前的示例
```JavaScript
function Person() {
}
Person.prototype.name = 'xiaoming';
var person1 = new Person();
var person2 = new Person();
person1.name = 'limei';
console.log(person1.name); // limei
console.log(person2.name); // xiaoming
delete person1.name;
console.log(person1.name); // xiaoming
```
在这个示例中我们给person1添加了name属性，我们去访问name属性，显然会得到值为’limei‘，当我们删除掉person1的name属性再访问时，在person1中就找不到name属性了，那么这时会去实例对象的原型person1.__proto__也就是Person.prototype中去找，我们在这里找到了name属性并返回，值为’xiaoming‘。

但是如果还找不到name属性呢？原型的原型又是什么呢？
# 原型的原型
前面我们提到过，原型的原型也是一个对象，那我们可以通过最原始的方式去创建它
```javaScript
var obj = new Object();
console.log(obj);
```
通过前面我们知道`obj.__proto__`指向`Object.prototype`,则我们可以继续更新关系图。

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/28280d77034b4b62bb232dfd360c0024~tplv-k3u1fbpfcp-watermark.image?)
# 原型链
那么`Object.prototype`的原型是什么呢？
```javaScript
console.log(Object.prototype.__proto__ === null); // true
```
我们会发现`Object.prototype.__proto__`指向`null`，null的语义为此处不应该有值。
所以查找属性时，查找到`Object.prototype`时就可以停止了。

原型链即为从`person ->person.__proto__(Person.prototype)->Person.prototype.__proto__(Object.prototype)->Object.prototype.__proto__`的这个链路。当我们访问对象属性时就会按照这个链路去查找。

# 补充
## 真的是继承吗？
最后关于继承，前面我们说“每一个对象都会从原型上’继承‘属性”，实际上，继承是一个十分具有迷惑性的说法，引用《你不知道的JavaScript》中的话就是：
> 继承意味着复制操作，然而在JavaScript默认并不会复制对象的属性，相反，JavaScript只是在两个对象之间创建一个关联，这样，一个对象就可以通过委托访问另外一个对象的属性和函数，所以预期说叫继承，委托的说法反而更加准确些。
