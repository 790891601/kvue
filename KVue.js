class KVue {
    constructor(options) {
        this.$options = options;
        this._data = options.data;
        this.compile(options.el);
    }

    compile(el) {
        let element = document.querySelector(el);
        //添加发布者
        this.observable(this._data);
        this.compileNode(element);
    }

    compileNode(element) {
        Array.from(element.childNodes).forEach(node => {
            if(node.nodeType === 3) {
                //文本
                let reg = /\{\{\s*(\S*)\s*\}\}/g;
                if(reg.test(node.textContent)) {
                    //首次渲染
                    node.textContent = node.textContent.replace(reg, (match, $1) => this._data[$1]);
                    //添加订阅者
                    new Watcher(this, RegExp.$1, newValue => {
                        //重新更新视图
                        node.textContent = newValue;
                    });
                }
                
            }else if(node.nodeType === 1) {
                //标签
                let attrs = node.attributes;

                Array.from(attrs).forEach(attr => {
                  let attrName = attr.name;
                  let attrValue = attr.value;
                  if(attrName.indexOf("k-") !== -1) {
                    attrName = attrName.substr(2);
                    if(attrName === "model") {
                      //双向绑定
                      node.attrValue = this._data[attrValue];

                      node.addEventListener("input", (e)=> {
                        e = e || window.event;
                        this._data[attrValue] = e.target.value;
                      });
                    }

                    new Watcher(this, attrValue, newValue => {
                      node.value = newValue;
                    });
                  }
                })
            }

            if(node.childNodes.length > 0) {
                this.compileNode(node);
            }
        });
    }

    observable(data) {
       Object.keys(data).forEach(key => {
           let value = data[key];
           let pub = new Pub();
           Object.defineProperty(data, key, {
               configurable: true,
               enumerable: true,
               get() {
                  if(Pub.target) 
                    pub.addSubscribes(Pub.target);
                  return value;
               },
               set(newValue) {
                  console.log("set");
                  if(value !== newValue)
                    value = newValue;
                  pub.notify(value);
               }
           });
       })
    }
}

class Pub {
    constructor() {
        this.subscribes = [];
    }

    //添加订阅者
    addSubscribes(sub) {
        this.subscribes.push(sub);
    }

    notify(newValue) {
        this.subscribes.forEach(sub => {
            sub.update(newValue);
        });
    }
}

class Watcher {
    constructor(vm, $1, cb) {
        Pub.target = this;
        vm._data[$1];
        Pub.target = null;
        this.cb = cb;
    }

    update(newValue) {
        this.cb(newValue);
    }
}


/*
  1. 插值表达式如何渲染
  2. 多个节点如何渲染
  3. 数据劫持 + 发布/订阅模式实现双向绑定
*/