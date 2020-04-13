const express = require('express');
const pool = require('../pool');
let router = express.Router();

/**   获取课程列表
 *
接口URL /course/list?pageNum=1&typeId=3 GET
请求查询字符串参数
pageNum	1	可选	-当前页码
typeId	3	可选	-课程分类id
成功响应示例
{"pageNum": "1","pageSize": 3,"pageCount": 2,"totalCount": 4,"list": [{"cid": 12,"typeId": 3,"title": "12HTML零基础入门","teacherId": 4,"cLength": "1天","startTime": "每周一开课","address": "i前端各校区 ","pic": "img-course\/01.png","price": 399,"tpid": 3,"tpname": "进阶课程","tid": 5,"tname": "纪盈鑫","maincourse": "JS框架专家","tpic": "img-teacher\/zzl.jpg"},.....]}
 */
router.get('/list', (req, res, next)=>{
	//1.读取客户端提交的请求数据
	let pageNum = req.query.pageNum		//客户端想显示的页号
	if(!pageNum){		//客户端未提交页号，默认显示第1页
		pageNum = 1
	}else {				//客户端提交了页号，查询字符串中的数据都是字符串，解析为整数
		pageNum = parseInt(pageNum)
	}
	
	let typeId = req.query.typeId
	if(!typeId){		//客户端未提交想显示哪类课程，默认全部显示
		typeId = 0
	}else {				//客户端提交了想显示的课程类别编号
		typeId = parseInt(typeId)
	}
	
	//2.执行数据库查询操作
	let output = {
		pageNum: pageNum,		//要显示的页号
		pageSize: 3,			//页面大小，每页要显示的记录条数
		pageCount: 0,			//符合条件的总页数
		totalCount: 0,			//符合条件的总记录数
		list:[ ],				//符合条件的记录数据
	}
	
	let condition = ''			//WHERE 语句的查询条件
	let placeholder = []		//为?占位符提供的数据
	if(typeId !== 0){
		condition += '  AND  typeId=?  '
		placeholder.push( typeId )
	}
	//if(teacherId !== 0){ }
	//if(price !== 0){ }
	//查询出满足条件的记录总数，并计算出总页数
	let sql1 = 'SELECT  COUNT(*)  AS  c  FROM  course  WHERE  1 ' + condition
	console.log(sql1)
	pool.query(sql1, placeholder, (err, result)=>{
		if(err){
			next(err)
			return
		}
		output.totalCount = result[0].c	//满足条件的总记录数
		output.pageCount = Math.ceil(  output.totalCount/output.pageSize  ) //满足条件的总页数
		let sql2 = "SELECT cid,typeId,title,teacherId,cLength,startTime,address,pic,price,tpid,tpname,tid,tname,maincourse,tpic   FROM  course AS c, type AS t, teacher AS h  WHERE  c.typeId=t.tpid  AND  c.teacherId=h.tid  " + condition + ' ORDER BY cid DESC  LIMIT  ?, ? '
		placeholder.push( (output.pageNum-1)*output.pageSize )//LIMIT后的第一个?：从哪一条记录开始读取
		placeholder.push( output.pageSize )		//LIMIT后的第二个?：一次最多读取的记录数量
		console.log(sql2)
		pool.query(sql2, placeholder, (err, result)=>{
			if(err){
				next(err)
				return
			}
			output.list = result
			res.send(output)
		})
	})
})
/**
 * 2.3获取课程详情
接口URL /course/detail?cid=1 GET
请求查询字符串参数
cid	1	必填	-课程id
成功响应示例
{
  "cid": 1,
  "typeId": 1,
  "title": "01HTML零基础入门",
  "teacherId": 1,
  "cLength": "1天",
  "startTime": "每周一开课",
  "address": "i前端各校区 ",
  "pic": "img-course\/01.png",
  "price": 399,
  "details": "<p>本课程详细讲解了HTML5的各个方面，课程从环境搭建开始，依次讲述了HTML5新元素、Canvas、SVG、Audio、GPS定位、拖拽效果、WEB存储、App Cache、HTML5 多线程和HTML5消息推送等内容。.....<\/p>",
  "tid": 1,
  "tname": "成亮",
  "maincourse": "Web开发讲师",
  "tpic": "img-teacher\/zx.jpg",
  "experience": "达内集团web讲师， 主讲 HTML5、Jquery、 Ajax 等课程。先后在一汽启明、日本インタセクト等公司担任系统开发工程师，从事软件开发和设计工作，迄今已积累5年以上的开发及教学经验，兼具技术和教学两方面的培训能力。",
  "style": "教学思路严谨，课堂气氛活跃。讲解时善于运用生活当中的例子，使学员能够快速理解。着重培养学员的动手能力，奉行实践是检验真理的唯一标准，教学能力受到学员们的一致好评。"
}
 */
router.get('/detail',(req,res,next)=>{
  let cid = req.query.cid;
  if(!cid){
    let output = {
      code:401,
      mag:'cid required'
    }
    res.send(output);
    return;
  }
  let sql = "SELECT cid,typeId,title,teacherId,cLength,startTime,address,pic,price,details,tid,tname,maincourse,tpic,experience,style FROM course AS c, teacher AS t WHERE c.teacherId=t.tid AND cid=?";
  pool.query(sql,cid,(err,result)=>{
    if(err){
      next(err);
      return;
    }
    if(result.length>0){
      res.send(result[0]);
    }else{
      res.send({});//根据用户id未能查询到课程-客户恶意修改参数
    }
  })
})

/**
 * 2.4获取最新课程
接口URL /course/newest?count=4 GET
请求Query参数
count	4	可选	-返回结果数量，默认为4
成功响应示例
[
  {
    "cid": 12,
    "title": "12HTML零基础入门",
    "pic": "img-course/01.png",
    "price": 399,
    "tname": "纪盈鑫"
  }，
  .......
]
 */
router.get('/newest',(req,res,next)=>{
  let count = req.query.count;
  if(!count){
    count = 4;
  }else{
    count = parseInt(count);
  }
  let sql = "SELECT cid,title,pic,price,tname  FROM course AS c, teacher AS t WHERE c.teacherId=t.tid ORDER BY cid DESC LIMIT ?,?";// LIMIT ? (可以只有一个参数，表示几条)
  pool.query(sql,[0,count],(err,result)=>{
    if(err){
      next(err);
      return;
    }
    res.send(result);
  })
})

 /**
  * 2.5获取热门课程
接口URL /course/hottest?count=4 GET
请求查询字符串参数
count	4	可选	-返回结果数量，默认值为4
成功响应示例
[
  {
    "cid": 12,
    "title": "12HTML零基础入门",
    "pic": "img-course/01.png",
    "price": 399,
    "tname": "纪盈鑫"
  },
  ......
]
*/
router.get('/hottest',(req,res,next)=>{
  let count = req.query.count;
  if(!count){
    count = 4;
  }else{
    count = parseInt(count);
  }
  let sql = "SELECT cid,title,pic,price,tname FROM course AS c, teacher AS t WHERE c.teacherId=t.tid ORDER BY buyCount DESC LIMIT ?,?";
  pool.query(sql,[0,count],(err,result)=>{
    if(err){
      next(err);
      return;
    }
    res.send(result);
  })
})

module.exports = router;