const express = require('express');
const pool = require('../pool');
let router = express.Router();

// 用户注册
/*
接口URL /user/register POST
请求 Content-Type application/json
请求Body参数 uname	zhangsan	必填	-用户名 upwd	123456	必填	-密码 phone	13333333333	必填	-手机号 captcha	ad31	必填	-验证码
成功响应示例 { "code": 200,  "msg": "register success", "uid": 7 }
*/
router.post('/register',(req,res,next)=>{
	if(!req.body.uname){
		let output ={
			code:401,
			msg:'uname required'
		}
		res.send(output);
		return;
	}else if(!req.body.upwd){
		let output ={
			code:402,
			msg:'upwd required'
		}
		res.send(output);
		return;
	}else if(!req.body.phone){
		let output ={
			code:403,
			msg:'phone required'
		}
		res.send(output);
		return;
	}
	if(!req.body.captcha){
		let output ={
			code:404,
			msg:'captcha required'
		}
		res.send(output);
		return;
	}else if(req.body.captcha.toUpperCase() !== req.session.registerCaptcha){
		let output ={
			code:405,
			msg:'captcha error'
		}
		res.send(output);
		return;
	}
	// 验证码验证通过 每个验证码只能使用一次，必须清楚服务器端保存的验证码
	delete req.session.registerCaptcha; 
	// 插入之前应该先进行查询是否存在
	let sql1 = "SELECT uid FROM user WHERE uname=? OR phone=?";
	pool.query(sql1,[req.body.uname,req.body.phone],(err,result)=>{
		if(err){
			next(err);
			return;
		}
		if(result.length > 0){
			let output ={
				code:400,
				msg:'uname or phone already taken'
			}
			res.send(output);
			return;
		}
	})
	// 验证之后进行插入操作
	let sql = "INSERT INTO user(uname,upwd,phone) VALUE(?,?,?)";
	console.log(req.body)
	pool.query(sql,[req.body.uname,req.body.upwd,req.body.phone],(err,result)=>{
		if(err){
			next(err);
			return;
		}
		if(result.affectedRows > 0){
			let output ={
				code: 200, 
				msg: "register success" ,
				uid:result.insertId
			}
			res.send(output);
			return;
		}
	})
})

// 用户登录
/*
接口URL /user/login POST
请求 Content-Type application/json
请求Body参数 uname	lisi	必填	-用户名 upwd	abc123	必填	-密码
成功响应示例 {"code":200,"msg":"login success","userInfo":{"uid": 5,"uname":"ranran@tedu.cn","nickname": "然然"}}
*/
router.post('/login',(req,res,next)=>{
	let uname = req.body.uname;
	let upwd = req.body.upwd;
	if(!uname){
		let output = {
			code:401,
			msg:'uname required'
		}
		res.send(output);
		return;
	}else if(!upwd){
		let output = {
			code:402,
			msg:'upwd required'
		}
		res.send(output);
		return;
	}
	let sql  = 'SELECT uid,uname,nickname FROM user WHERE uname=? AND upwd=? ';
	pool.query(sql,[uname,upwd],(err,result)=>{
		if(err){
			next(err);
			return;
		}
		if(result.length > 0){
			let output = {
				code:200,
				msg:'login success',
				userInfo:result[0]
			}
			res.send(output);
			// 在当前客户端保存在服务器上的session空间存储自己的数据
			req.session.userInfo = result[0];
			req.session.save();//新版本不支持自动保存了
			return;
		}else{
			let output = {
				code:400,
				msg:'uname or upwd error'
			}
			res.send(output);
			return;
		}
	})
})

//检验用户名是否存在
/** 文档注释
/user/check_uname  GET
请求查询字符串参数 uname	zhangsan	必填	-用户名
成功响应示例 {"code": 200,"msg": "exists"}
失败响应示例 {"code": 401,"msg": "non-exists"}
*/
router.get('/check_uname',(req,res,next)=>{
	// 获取提交的请求数据
	let uname = req.query.uname;
	// 服务器端验证 必须的 客户端有的浏览器会禁用js
	if(!uname){
		let output = {
			code:'400',
			msg:'uname required'
		}
		res.send(output);
		// 一个请求只能响应一次
		return;
	}
	// 执行数据库操作
	let sql = 'SELECT uid FROM user WHERE uname=?';
	pool.query(sql,uname,(err,result)=>{
		// ** 错误处理中间件
		// throw err如果报错了会导致服务器崩溃(只适用于开发测试阶段) - 解决办法：
		if(err) {
			next(err);
			return;
			// throw err;
			// 这里要响应一个500消息
			/*
				let output = {
					code:'500',
					msg:'程序报错'
				}
				res.send(output);
				这样写缺陷：每个都要写
				解决办法：错误处理中间件
			*/
		};
		console.log(result);
		if(result.length === 0){
			let output = {
				code: 401,
				msg: "non-exists"
			}
			res.send(output);
			return;
		}else{
			let output = {
				code: 200,
				msg: "exists"
			}
			res.send(output);
			return;
		}
	})
})


// 检测手机号是否存在
/*
接口URL  /user/check_phone  GET
请求查询字符串参数 phone	13333333333	必填	-手机号
成功响应示例 {"code": 200,"msg": "exists"}
失败响应示例 {"code": 402,"msg": "non-exists"}
*/
router.get('/check_phone',(req,res,next)=>{
	let phone = req.query.phone;
	if(!phone){
		let output = {
			code:'400',
			msg:'phone required'
		}
		res.send(output);
		return;
	}
	let sql = 'SELECT uid FROM user WHERE phone=?';
	pool.query(sql,phone,(err,result)=>{
		if(err) {
			next(err);
			return;
		};
		if(result.length === 0){
			let output = {
				code: 401,
				msg: "non-exists"
			}
			res.send(output);
			return;
		}else{
			let output = {
				code: 200,
				msg: "exists"
			}
			res.send(output);
			return;
		}
	})
})

// 1.5注册用验证码
/**
 * 接口URL /user/register/captcha GET
请求参数
无
成功响应示例
<svg>...</svg>

同时在服务器端session中保存 captcha.register 字段，值为显示给客户端的随机验证码内容。
 */
const svgCaptcha = require('svg-captcha');
router.get('/register/captcha',(req,res,next)=>{
	// 使用第三方模块生成验证码
	// let captcha = svgCaptcha.create();
	// console.log(captcha);
	// res.send(captcha);
	// {text:'' ,data:'<svg>'}
	let options ={
		size:5,//options对象 验证码字符个数
		ignoreChars:'0oO1l',//要忽略掉的 不想要生成的字符
		// charPreset:"1234567890"//预设的字库
		width:120,//图片宽高,字体大小
		height:30,
		fontSize:30,
		noise:3,//干扰线的数量
		color:true,//true 指定字体是否为彩色
		background: '#c1eebd'
	}
	let captcha = svgCaptcha.create(options);
	req.session.registerCaptcha = captcha.text.toUpperCase();
	res.type('svg');//修改Content-Type：image/svg+xml
	res.send(captcha.data);
})

// 上传用户头像
/*
接口URL /user/upload/avatar POST
请求 Content-Type multipart/form-data
请求主体数据
avatar		必填	-二进制图片文件数据
成功响应示例
{"code": 200,"msg": "upload succ","fileName": "/images/avatar/158632317406812345.jpg"}
*/
/**
 * HTTP请求消息的内容类型：
  ① text/plain：请求主体是未经编码的普通文本 —— 一般的服务器都拒绝接收
  ② application/x-www-form-urlencoded：请求主体是经过编码后的文本  encodeURIComponent( )
  ③ multipart/form-data：包含文件上传域的多个域表单数据
  ④ application/json：客户端提交给服务器JSON格式的文本  JSON.stringify( )
 */
const multer = require('multer');
const fs = require('fs');//使用该模块转存文件
let upload = multer({
	dest:'uploads/'//destination 临时存储的目录
}) 
router.post('/upload/avatar',upload.single('avatar'),(req,res,next)=>{
	// console.log(req.file,req.body);
	/**
 * {
  fieldname: 'avatar',
  originalname: 'carousel-6.jpg',
  encoding: '7bit',
  mimetype: 'image/jpeg',
  destination: 'uploads/',
  filename: '268cf67b8ad6c3e3f3a1112124b85bf1',
  path: 'uploads\\268cf67b8ad6c3e3f3a1112124b85bf1',
  size: 515470
} [Object: null prototype] { uname: 'liangliang', age: '25' }
 */
	// 将客户端上传传来的文件转存在真正有意义的目录下
	let oldName = req.file.path;
	let newName = generateNewFilePath(req.file.originalname);
	fs.rename(oldName,newName,(err,result)=>{
		if(err){
			next(err);
			return;
		}
		let output = {
			code:200,
			msg:'upload success',
			fileName:newName
		}
		res.send(output);
		return;
	})
})
// 生成一个新的随机文件名路径
// 生成的文件名形式如：'./images/avatar/时间戳+五位数的随机数+原文件名是后缀名'
function generateNewFilePath( originalFileName ){
	let path = "./images/avatar/";
	path += Date.now();
	path += Math.floor(Math.random()*90000 + 10000);
	let lastDotIndex = originalFileName.lastIndexOf('.');
	let extName = originalFileName.substring(lastDotIndex);
	path += extName;
	return path;
}

// 验证后端接口是否正确 保证各个浏览器兼容 保证可以测试post请求 - 接口测试
module.exports = router;