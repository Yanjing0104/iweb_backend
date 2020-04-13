const express = require('express');
const pool = require('../pool');
let router = express.Router();

/*
      添加收藏
接口URL /favorite/add POST
请求 Content-Type application/json
请求Body参数
uid	3	必需	-用户id 从服务器端session中读取登录的用户编号
cid	7	必填	-课程id
成功响应示例 {"code": 200,"msg": "success","fid": 2}
失败响应示例 {"code": 403,"msg": "failed"}
*/
router.post('/add',(req,res,next)=>{
	// 有了前置中间件 loginCheckMiddelware 就不需要再进行验证
	// if(!req.session.userInfo){
	// 	let output = {
	// 		code:499,
	// 		msg:'login required'
	// 	}
	// 	res.send(output);
	// 	return;
	// } 
	// let uid = req.session.userInfo.uid;
	let uid = req.uid;
	let cid = req.body.cid;
	if(!cid){
		let output = {
			code:403,
			msg:'cid required'
		}
		res.send(output);
		return;
	}
	// 因为表中没有用外键约束，所有此处应该验证一下cid是否存在
	let fTime = new Date().getTime();//搜藏时间 new Date().getTime() 或者 Date.now()
	// 如果一个用户已经添加过一门课程，再次添加的时候只需要更改一下时间即可
	let sql1 = "SELECT fid FROM favorite WHERE userId=? AND courseId=?";
	pool.query(sql1,[uid,cid],(err,result)=>{
		if(err){
			next(err);
			return;
		}
		if(result.length === 0){
			let sql2 = "INSERT INTO favorite(userId,courseId,fTime) VALUES(?,?,?) ";
			pool.query(sql2,[uid,cid,fTime],(err,result)=>{
				if(err){
					next(err);
					return;
				}
				if(result.affectedRows>0){
					let output={
						code: 200,
						msg: "success",
						fid: result.insertId //返回的数据中insertId就是当前插入行的id
					}
					res.send(output);
					return;
				}else{
					let output={
						code: 403,
						msg: "failed"
					}
					res.send(output);
					return;
				}
			})
		}else{
			let sql3 = "UPDATE favorite SET fTime=? WHERE fid=?";
			pool.query(sql3,[fTime,result[0].fid],(err,result)=>{
				if(err){
					next(err);
					return;
				}
				let output={
					code: 201,
					msg: "favorite update success",
					fid: result.insertId ,
				}
				res.send(output);
				return;
			})
		}
	})
})

/*
	收藏列表
接口URL /favorite/list GET
请求查询字符串参数
uid	4	必需	-用户id 从session中读取登录的用户编号即可
成功响应示例[{"title": "07HTML零基础入门","pic": "img-course\/06.png","price": 399,"courseId": 7,"fid": 2,"fTime": 1578015036},....]
失败响应示例[  ]
*/
router.get('/list',(req,res,next)=>{
	let uid = req.uid;
	// 跨表查询
	let sql = "SELECT title,pic,price,courseId,fid,fTime FROM  favorite AS f , course AS c WHERE c.cid = f.courseId AND f.userId=?";
	pool.query(sql,uid,(err,result)=>{
		if(err){
			next(err);
			return;
		}
		res.send(result);
	})
})

module.exports = router;