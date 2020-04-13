/* 自己定义的前置中间件
    登录检查中间件：如果客户端尚未登录(即req.session.userInfo不存在) ，则输出一个提示响应消息，并且结束请求处理过程，否则，在req添加一个新属性req.uid 供后续请求处理路由来使用
*/

module.exports = (req,res,next)=>{
  if(!req.session){//结论：服务器端没有启用session
		let output = {
			code:500,
			msg:'Server Err: seccion middleware required'
		}
		res.send(output);
		return;
  }
  if(!req.session.userInfo){
		let output = {
			code:401,
			msg:'login required'
		}
		res.send(output);
		return;
  }
  // 客户端登录
  req.uid = req.session.userInfo.uid;
  next();//中间件检查之后放行 执行后续的中间件/路由
}