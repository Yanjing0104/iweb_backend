const  express = require('express');
const  bodyParser = require('body-parser');
const  cors = require('cors');
const  session = require('express-session');
const	 userRouter = require('./router/user');
const	 favoriteRouter = require('./router/favorite');
const	 typeRouter = require('./router/type');
const	 courseRouter = require('./router/course');
const	 teacherRouter = require('./router/teacher');
const	 cartRouter = require('./router/cart');
const  loginCheckMiddleware = require('./middleware/loginCheck');

let app = express();
app.listen(9090,()=>{
	// 监听端口之后的回调函数
	console.log('server listen on port 9090');
});
// 创建服务器成功之后运行后台项目两种方法
// 1.npm index.js 
// 2.npm start  - 因为在json文件中script下有属性start  
// 注意： 项目上传到新浪云部署的时候 会自动执行npm i(安装项目所需的依赖包，上传之前删除node_module)；npm start (启动项目)
// 在启动项目之后遇到问题: 当修改端口号之后，命令行窗口不会变化，要借助一个小工具 nodemon 自动重启小工具 

// 前置中间件 body-parser cors  客户端文件上传 服务器端session中间件
// 前后端分离的项目：前端/后端服务器不在一个服务器，就会涉及到跨域访问的问题
app.use(cors());//添加个响应消息头部 Access-Control-Allow-Origin 访问控制的 *所有

app.use(session(
	{
		secret:'iwebsecret123',//指定生成sid所用的加密秘钥-随机数种子
		saveUninitialized:true,//是否保存未初始化的session数据
		resave:true//是否重新保存session数据
	}
))

// 处理请求主体中的JSON数据，保存到req.body中
app.use(bodyParser.json());

// 路由&路由器
app.use('/user',userRouter);
// 在所有以favorite开头的请求之前使用中间件
app.use('/favorite',loginCheckMiddleware);//app.use('/favorite',loginCheckMiddleware,favoriteRouter);
app.use('/favorite',favoriteRouter);
app.use('/type',typeRouter);
app.use('/course',courseRouter);
app.use('/teacher',teacherRouter);
app.use('/cart',loginCheckMiddleware,cartRouter);
// 后置中间件
// 日志记录中间件
// app.use((req,res,next)=>{
// 		日志处理文件;
//    next();
// })
// 异常处理中间件 “错误处理中间件”特点：第一个参数是err
app.use((err,req,res,next)=>{
	// 修改响应消息状态码
	res.status(500);
	let output = {
		code:500,
		msg:'Error occoured during server running',
		err:err
	}
	res.send(output);
})
