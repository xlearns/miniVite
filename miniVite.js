const {rewriteImport} = require("./utils.js")
const Koa = require('koa')
const opn = require('opn');
const fs = require("fs")
const path = require("path")
const complierSFC = require('@vue/compiler-sfc') //引入vue文件的解析
const complierDOM = require('@vue/compiler-dom') //引入template的解析
const app = new Koa()

//中间件
app.use(async (ctx)=>{
  //获取到url和参数
  const {
    url,
    query
  } = ctx.request
  
  //首页请求
  if (url === '/') {
    //加载index.html
    ctx.type = "text/html";
    ctx.body = fs.readFileSync(path.join(__dirname, "./index.html"), "utf8");
    //es6+新增得endsWith与startsWith用来判断文件名称好方便
  }else if (url.endsWith('.js')) {
     // js文件加载处理
    const p = path.join(__dirname, url)
    ctx.type = 'application/javascript'
    ctx.body = rewriteImport(fs.readFileSync(p, 'utf8'))
  } else if (url.startsWith("/@modules/")) {
    //加载模块
    //获取模块名称
    const moduleName = url.replace("/@modules/", "");
    //去node_modules目录中找
    const prefix = path.join(__dirname, "./node_modules", moduleName);
    //package.json中获取module字段
    //module为启动项
    const module = require(prefix + "/package.json").module;
    const filePath = path.join(prefix, module);
    //加载模块
    const ret = fs.readFileSync(filePath, "utf8");
    ctx.type = 'application/javascript'
    ctx.body = rewriteImport(ret)
  }else if (url.indexOf('.vue') > -1) {
    //加载.vue
    //获取加载文件路径
    const p = path.join(__dirname, url.split("?")[0]);
    const ret = complierSFC.parse(fs.readFileSync(p, 'utf8')); // console.log(ret)  可以看到是一颗ast树，可以在终端中查看
    if (!query.type) {
      //SFC请求，读取vue文件，解析为js
      //获取脚本部分的内容
      const scriptContent = ret.descriptor.script.content;
    
      //替换默认导出为一个常量，方便后续修改
      const script = scriptContent.replace(
        "export default ",
        "const __script = "
      );
      ctx.type = 'application/javascript'
      ctx.body = `
        ${rewriteImport(script)}
        // 解析template
        import {render as __render} from '${url}?type=template'
        //加载style
        import '${url}?type=style'
        __script.render = __render
        export default __script
        `;
    }
    if (query.type === "template") {
      const tpl = ret.descriptor.template.content;
      //编译为render
      const render = complierDOM.compile(tpl, {
        mode: "module"
      }).code;
      ctx.type = 'application/javascript'
      ctx.body = rewriteImport(render)
      
    }
    if (query.type === "style") {
      //解析style
      const css = ret.descriptor.styles.reduce((pre,cur)=>{return pre+=cur.content},'')
      ctx.type = 'application/javascript'
      ctx.body =  `
        const style = document.createElement('style')
        style.setAttribute('type', 'text/css')
        style.innerHTML = \`${css}\`
        document.head.appendChild(style)
      `
    }
  }
  
})

app.listen(3000, () => {
  console.log('miniVite start');
  // opn(`http://localhost:3000/`);
})