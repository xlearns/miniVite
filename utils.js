// 裸模块地址的重写
//在vite中对于vue这种裸模块是无法识别的，它通过预编译把需要的模块打包到node_modules中，再通过相对地址找到并加载，
//这里我们通过识别 /@modules 这种地址标识，去找寻模块，进行地址的替换
//import xx from "vue"  ==> import xx from "/@modules/vue"
function rewriteImport(content) {
  return content.replace(/ from ['"](.*)['"]/g, function (s1, s2) {
    if (s2.startsWith("./") || s2.startsWith("/") || s2.startsWith("../")) {
      return s1
    } else {
      //裸模块替换
      return ` from '/@modules/${s2}'`
    }
  })
}

module.exports = {
  rewriteImport
}