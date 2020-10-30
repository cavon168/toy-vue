export class ToyVue {
  constructor(config) {
    this.template = document.querySelector(config.el);
    this.data = reactive(config.data);
    for (let name of config.methods) {
      this[name] = () => {
        config.methods[name].apply[this.data];
      }
    }
    // methods: {
    //   reverseMessage: function () {
    //     this.message = this.message.split('').reverse().join('')
    //   }
    // }
    this.traversal(this.template);
  }
  traversal(node) {
    // 第一次访问nodeType为1
    // 第二次访问nodeType为3
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.textContent.match(/^{{([\s\S]+)}}$/)) {
        let name = RegExp.$1.trim();
        console.log(name);
        effect(() => node.textContent = this.data[name]);
        // 可监听的双向绑定
      }
    }
    if (node.nodeType === Node.ELEMENT_NODE) {
      let attributes = node.attributes;
      for (let attribute of attributes) {
        if (attribute.name === 'v-model') {
          let name = attribute.value;
          effect(() => node.value = this.data[name]);
          node.addEventListener('input', event => this.data[name] = node.value);
        }
        if (attribute.name.match(/^v-bind:([\s\s]+)$/)) {
          let attrName = RegExp.$1;
          let name = attribute.value;
          effect(() => node.setAttribute(attrName, this.data[name]));
        }
        if (attribute.name.match(/^v-on:([\s\s]+)$/)) {
          let eventName = RegExp.$1;
          let fnname = attribute.value;
          node.addEventListener(eventName, this.data[fnname]);
        }
      }
    }
    if (node.childNodes && node.childNodes.length) {
      for (let child of node.childNodes)
        this.traversal(child);
    }
  }
}

// let effects = [];
let effects = new Map();
let currentEffect = null;

function effect(fn) {
  // effects.push(fn);
  // 第一遍执行过程中，做了依赖收集
  currentEffect = fn;
  fn();
  currentEffect = null;
}

// reactive：可非监听的对象
function reactive(object) {
  // 创建一个proxy：递归的操作
  let observed = new Proxy(object, {
    get(object, property) {
      if (currentEffect) {
        if (!effects.has(object))
          effects.set(object, new Map);
        if (!effects.get(object).has(property))
          effects.get(object).set(property, new Array);

        effects.get(object).get(property).push(currentEffect);
      }
      return object[property];
    },
    set(object, property, value) {
      // console.log(object, property);
      object[property] = value;
      // effects.get(object)?.get(property)
      // for (let effect of effects) 
      //   effect();
      if (effects.has(object) && effects.get(object).set(property)) {
        for (let effect of effects.get(object).get(property)) {
          effect();
        }
      }
      return true;
    }
  })
  return observed;
}

// let o2 = reactive({ a: 1 });

// let dummy;
// const counter = reactive({ num: 0 });
// effect(() => (dummy = counter.num));

// let dummy2;
// const counter2 = reactive({ num: 0 });
// effect(() => (dummy2 = counter2.num));

// // 双向绑定
// const counter3 = reactive({ num: 0 });
// window.counter3 = counter3;
// effect(() => alert(counter3.num)); // 只要一改变就alert

// counter.num = 7;