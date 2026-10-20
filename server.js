/* 电能带教师傅 · 动态后端（零第三方依赖，Node18+ 直接运行）
   功能：静态托管 + 云端账号 + 进度同步 + 题库接口 + AI问答(文字/图片/视频视觉识别) */
const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const PORT=process.env.PORT||80;
const ROOT=__dirname;
const DBF=path.join(ROOT,'data','db.json');
const SECRET=process.env.SERVER_SECRET||crypto.randomBytes(16).toString('hex');
// ---------- 密钥：环境变量优先，其次上级目录 keys.json（在网站根目录之外，防静态泄露） ----------
let KEYS={};
try{KEYS=JSON.parse(fs.readFileSync(path.join(ROOT,'..','keys.json'),'utf8'))}catch(e){}
try{if(!Object.keys(KEYS).length)KEYS=JSON.parse(fs.readFileSync(path.join(ROOT,'keys.json'),'utf8'))}catch(e){}
const DEEPSEEK=process.env.DEEPSEEK_API_KEY||KEYS.DEEPSEEK_API_KEY||'';
const VISION_KEY=process.env.DASHSCOPE_API_KEY||KEYS.DASHSCOPE_API_KEY||process.env.VISION_API_KEY||KEYS.VISION_API_KEY||'';
const VISION_MODEL=process.env.VISION_MODEL||KEYS.VISION_MODEL||'qwen-vl-max';
const VISION_BASE=(process.env.VISION_BASE_URL||KEYS.VISION_BASE_URL||'https://dashscope.aliyuncs.com/compatible-mode/v1').replace(/\/+$/,'');
const ADMIN_KEY=process.env.ADMIN_TOKEN||KEYS.ADMIN_TOKEN||'';
fs.mkdirSync(path.join(ROOT,'data'),{recursive:true});
let db={users:{},progress:{}};
try{db=JSON.parse(fs.readFileSync(DBF,'utf8'))}catch(e){}
function saveDB(){fs.writeFileSync(DBF,JSON.stringify(db))}
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const sign=o=>crypto.createHmac('sha256',SECRET).update(JSON.stringify(o)).digest('base64url');
function auth(req){const h=req.headers['x-token'];if(!h)return null;try{const[p2,s]=h.split('.');const o=JSON.parse(Buffer.from(p2,'base64url').toString('utf8'));if(sign(o)!==s)return null;if(o.exp&&o.exp<Date.now())return null;return o.u}catch(e){return null}}
const MIME={'.html':'text/html','.js':'application/javascript','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.gif':'image/gif','.css':'text/css','.md':'text/plain','.ico':'image/x-icon','.mp4':'video/mp4','.webm':'video/webm','.glb':'model/gltf-binary','.gltf':'model/gltf+json','.svg':'image/svg+xml','.webp':'image/webp'};
function send(res,code,obj){const b=JSON.stringify(obj);res.writeHead(code,{'Content-Type':'application/json; charset=utf-8'});res.end(b)}
function readBody(req,limit){
  limit=limit||32*1024*1024;
  return new Promise(function(r){
    var d='',too=false;
    req.on('data',function(c){if(too)return;d+=c;if(d.length>limit){too=true;r(null)}});
    req.on('end',function(){if(too)return;var o={};try{o=JSON.parse(d)}catch(e){}r(o)});
  });
}
// ---------- 知识库：从 data.js 提取故障码/案例/题库 ----------
let BANKS_CACHE={banks:[],practical:[]};
let KB={codes:[],cases:[]};
try{
  const t=fs.readFileSync(path.join(ROOT,'data.js'),'utf8');
  const m=t.match(/window\.DATA=(\{.*\});/s);
  const d=JSON.parse(m[1]);
  BANKS_CACHE={banks:d.banks,practical:d.practical};
  KB={codes:d.codes||[],cases:d.cases||[]};
  console.log('题库已加载: banks',d.banks.length,'practical',d.practical.length,'codes',KB.codes.length,'cases',KB.cases.length);
}catch(e){console.log('题库加载失败(不影响运行):',e.message)}
// 按用户描述关键词匹配知识库，拼成提示词片段
function kbText(message){
  const msg=(message||'').toLowerCase();
  const hitWords=(kw)=>String(kw||'').toLowerCase().split(/[,，、\s]+/).filter(Boolean).some(function(k){return msg.indexOf(k)>=0});
  const codes=KB.codes.map(function(c){
    return '【'+c.code+' '+c.name+'】典型现象：'+c.pheno+'\n常见原因：'+c.causes.join('；')+'\n排查步骤：'+c.steps.join('；')+'\n师傅经验：'+(c.note||'');
  }).join('\n\n');
  let mc=KB.cases.filter(function(c){return hitWords((c.tags||[]).join(',')+','+(c.t||'')+','+(c.sym||''))});
  if(!mc.length)mc=KB.cases.slice(0,3);
  const cases=mc.slice(0,3).map(function(c){
    return '【案例】'+c.t+'（'+c.car+'）\n症状：'+c.sym+'\n排查：'+(c.proc||[]).join('；')+'\n根因：'+c.root+'\n修复：'+(c.fix||'');
  }).join('\n\n');
  return '本站故障码知识库（'+KB.codes.length+'条）：\n'+codes+'\n\n本站维修案例（节选'+Math.min(mc.length,3)+'条）：\n'+cases;
}

const server=http.createServer(async(req,res)=>{
  const u=new URL(req.url,'http://x');
  // ---------- API ----------
  if(u.pathname==='/api/ping')return send(res,200,{ok:true,name:'电能带教师傅',time:Date.now()});
  if(u.pathname==='/api/register'&&req.method==='POST'){
    const b=await readBody(req);const name=(b.u||'').trim(),pw=b.p||'';
    if(!/^.{2,12}$/.test(name))return send(res,400,{err:'用户名2-12位'});
    if(pw.length<6)return send(res,400,{err:'密码至少6位'});
    if(db.users[name])return send(res,409,{err:'用户名已存在'});
    const salt=crypto.randomBytes(8).toString('hex');
    db.users[name]={salt,hash:sha(salt+pw),created:new Date().toISOString().slice(0,10)};saveDB();
    const _o={u:name,exp:Date.now()+30*864e5};return send(res,200,{token:Buffer.from(JSON.stringify(_o),'utf8').toString('base64url')+'.'+sign(_o)});
  }
  if(u.pathname==='/api/login'&&req.method==='POST'){
    const b=await readBody(req);const rec=db.users[(b.u||'').trim()];
    if(!rec||rec.hash!==sha(rec.salt+(b.p||'')))return send(res,401,{err:'用户名或密码错误'});
    const o={u:b.u.trim(),exp:Date.now()+30*864e5};
    return send(res,200,{token:Buffer.from(JSON.stringify(o),'utf8').toString('base64url')+'.'+sign(o)});
  }
  if(u.pathname==='/api/banks')return send(res,200,BANKS_CACHE);
  const user=auth(req);
  // ---------- 管理：视频/文件上传（需 ADMIN_TOKEN，支持分块追加） ----------
  if(u.pathname==='/api/admin/put'&&req.method==='POST'){
    const b=await readBody(req,96*1024*1024);
    if(!ADMIN_KEY||b.key!==ADMIN_KEY)return send(res,403,{err:'forbidden'});
    const name=String(b.name||'').replace(/[^a-z0-9_.-]/gi,'').slice(0,80);
    if(!name)return send(res,400,{err:'bad name'});
    const WEB_WHITELIST=['study.js','data.js','lessons.js','cloud.js','index.html','server.js','tools.js','teacher.html'];
    const isWeb=WEB_WHITELIST.indexOf(name)>=0;
    const dir=isWeb?ROOT:path.join(ROOT,'videos');
    try{fs.mkdirSync(dir,{recursive:true})}catch(e){}
    const buf=Buffer.from(String(b.data||''),'base64');
    const fp=path.join(dir,name);
    if(!fp.startsWith(dir))return send(res,403,{err:'forbidden'});
    if(b.append)fs.appendFileSync(fp,buf);else fs.writeFileSync(fp,buf);
    return send(res,200,{ok:true,wrote:buf.length,total:fs.statSync(fp).size});
  }
  if(u.pathname==='/api/progress'&&req.method==='GET'){
    if(!user)return send(res,401,{err:'未登录'});
    return send(res,200,db.progress[user]||{});
  }
  if(u.pathname==='/api/progress'&&req.method==='POST'){
    if(!user)return send(res,401,{err:'未登录'});
    db.progress[user]=(await readBody(req))||{};if(db.users[user])db.users[user].last=Date.now();saveDB();
    return send(res,200,{ok:true});
  }
  // ---------- 管理：删除云端学员（需 ADMIN_TOKEN） ----------
  if(u.pathname==='/api/admin/delstudent'&&req.method==='POST'){
    const b=await readBody(req);
    if(!ADMIN_KEY||b.key!==ADMIN_KEY)return send(res,403,{err:'forbidden'});
    const n=String(b.name||'').slice(0,12);
    if(!n||!db.users[n])return send(res,404,{err:'学员不存在'});
    delete db.users[n];delete db.progress[n];delete db.tapps[n];
    Object.values(db.classes||{}).forEach(function(c){c.students=c.students.filter(function(x){return x!==n})});
    saveDB();
    return send(res,200,{ok:true,deleted:n});
  }
  // ---------- 管理：云端学员总览（需 ADMIN_TOKEN） ----------
  if(u.pathname==='/api/admin/students'&&req.method==='POST'){
    const b=await readBody(req);
    if(!ADMIN_KEY||b.key!==ADMIN_KEY)return send(res,403,{err:'forbidden'});
    const out=Object.keys(db.users).map(function(n){
      return {name:n,created:db.users[n].created,last:db.users[n].last||null,role:db.users[n].role||'student',progress:(db.progress&&db.progress[n])||{}};
    });
    return send(res,200,{students:out,now:Date.now()});
  }
  // ---------- 班级体系 + 教师申请（方案B） ----------
  db.classes=db.classes||{};db.tapps=db.tapps||{};
  const CODE_CHARS='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const newCode=()=>Array.from(crypto.randomBytes(6)).map(x=>CODE_CHARS[x%CODE_CHARS.length]).join('');
  function myClass(name){
    const uid=db.users[name]&&db.users[name].classId;
    if(!uid||!db.classes[uid])return null;
    const c=db.classes[uid];
    return {id:c.id,name:c.name,code:c.code,teacher:c.teacher,open:c.open,created:c.created,students:c.students.length};
  }
  function stuStats(name){
    const p=(db.progress&&db.progress[name])||{};
    const g=(k,d)=>{const v=p[k];return v===undefined?d:v};
    let exam=0;
    BANKS_CACHE.banks.forEach(function(b){
      exam=Math.max(exam,+(g('et_exambest:'+b.id+':'+name,0)||0),+(g('et_exam:'+b.id+':'+name,0)||0));
    });
    return {name:name,
      lessons:(g('et_lessons:'+name,[])||[]).length,
      study:+g('et_study:'+name,0)||0,
      wrong:Object.keys(g('et_wrong:'+name,{})||{}).length,
      examBest:exam*10,
      trainer:+g('et_trainer_n:'+name,0)||0,
      last:db.users[name]&&db.users[name].last||null,
      created:db.users[name]&&db.users[name].created||null};
  }
  // 当前用户信息（含角色/班级/申请状态）
  if(u.pathname==='/api/me'&&req.method==='GET'){
    if(!user)return send(res,401,{err:'未登录'});
    const rec=db.users[user]||{};
    const app=db.tapps[user]||null;
    return send(res,200,{u:user,role:rec.role||'student',classId:rec.classId||null,cls:myClass(user),
      app:app?{status:app.status,org:app.org,time:app.time,reply:app.reply||''}:null});
  }
  // 提交教师申请
  if(u.pathname==='/api/teacher/apply'&&req.method==='POST'){
    if(!user)return send(res,401,{err:'未登录'});
    const b=await readBody(req);
    const tapp={user:user,name:String(b.name||user).slice(0,20),org:String(b.org||'').slice(0,50),reason:String(b.reason||'').slice(0,300),status:'pending',time:new Date().toISOString()};
    db.tapps[user]=tapp;saveDB();
    return send(res,200,{ok:true,status:'pending'});
  }
  // 管理：教师申请列表
  if(u.pathname==='/api/teacher/apps'&&req.method==='POST'){
    const b=await readBody(req);
    if(!ADMIN_KEY||b.key!==ADMIN_KEY)return send(res,403,{err:'forbidden'});
    return send(res,200,{apps:Object.values(db.tapps).sort((a,b2)=>(a.time<b2.time?1:-1))});
  }
  // 管理：审核教师申请
  if(u.pathname==='/api/teacher/approve'&&req.method==='POST'){
    const b=await readBody(req);
    if(!ADMIN_KEY||b.key!==ADMIN_KEY)return send(res,403,{err:'forbidden'});
    const a=db.tapps[String(b.user||'')];
    if(!a)return send(res,404,{err:'申请不存在'});
    a.status=b.ok?'approved':'rejected';a.reply=String(b.reply||'').slice(0,200);
    if(b.ok&&db.users[a.user])db.users[a.user].role='teacher';
    saveDB();
    return send(res,200,{ok:true,status:a.status});
  }
  // 管理：直接任命/撤销教师
  if(u.pathname==='/api/admin/setrole'&&req.method==='POST'){
    const b=await readBody(req);
    if(!ADMIN_KEY||b.key!==ADMIN_KEY)return send(res,403,{err:'forbidden'});
    const n=String(b.user||'').slice(0,12);
    if(!db.users[n])return send(res,404,{err:'学员不存在'});
    db.users[n].role=(b.role==='teacher')?'teacher':'student';
    saveDB();
    return send(res,200,{ok:true,user:n,role:db.users[n].role});
  }
  // 教师：创建班级
  if(u.pathname==='/api/class/create'&&req.method==='POST'){
    if(!user)return send(res,401,{err:'未登录'});
    if(db.users[user].role!=='teacher')return send(res,403,{err:'仅教师可创建班级'});
    const b=await readBody(req);
    const nm=String(b.name||'').trim().slice(0,20);
    if(!nm)return send(res,400,{err:'请填写班级名称'});
    const id='c'+crypto.randomBytes(4).toString('hex');
    db.classes[id]={id:id,name:nm,code:newCode(),teacher:user,students:[],open:true,created:new Date().toISOString().slice(0,10)};
    db.users[user].classId=id;saveDB();
    return send(res,200,{ok:true,cls:db.classes[id]});
  }
  // 学生：凭邀请码加入班级
  if(u.pathname==='/api/class/join'&&req.method==='POST'){
    if(!user)return send(res,401,{err:'未登录'});
    const b=await readBody(req);
    const code=String(b.code||'').trim().toUpperCase();
    const c=Object.values(db.classes).find(x=>x.code===code);
    if(!c)return send(res,404,{err:'邀请码无效'});
    if(!c.open)return send(res,403,{err:'该班级已关闭加入'});
    if(c.students.indexOf(user)>=0)return send(res,200,{ok:true,cls:myClass(user)});
    if(db.users[user].classId&&db.users[user].classId!==c.id&&db.classes[db.users[user].classId]){
      const old=db.classes[db.users[user].classId];
      old.students=old.students.filter(x=>x!==user);
    }
    c.students.push(user);db.users[user].classId=c.id;saveDB();
    return send(res,200,{ok:true,cls:myClass(user)});
  }
  // 学生：退出班级
  if(u.pathname==='/api/class/leave'&&req.method==='POST'){
    if(!user)return send(res,401,{err:'未登录'});
    const cid=db.users[user]&&db.users[user].classId;
    if(!cid||!db.classes[cid])return send(res,400,{err:'你不在任何班级中'});
    const c=db.classes[cid];
    c.students=c.students.filter(x=>x!==user);db.users[user].classId=null;saveDB();
    return send(res,200,{ok:true});
  }
  // 我的班级
  if(u.pathname==='/api/class/mine'&&req.method==='GET'){
    if(!user)return send(res,401,{err:'未登录'});
    return send(res,200,{cls:myClass(user),role:db.users[user].role||'student'});
  }
  // 教师：我创建的班级列表
  if(u.pathname==='/api/class/list'&&req.method==='GET'){
    if(!user)return send(res,401,{err:'未登录'});
    if(db.users[user].role!=='teacher')return send(res,403,{err:'仅教师可用'});
    return send(res,200,{classes:Object.values(db.classes).filter(c=>c.teacher===user)});
  }
  // 教师：班级名单+进度
  if(u.pathname==='/api/class/roster'&&req.method==='POST'){
    if(!user)return send(res,401,{err:'未登录'});
    const b=await readBody(req);
    const c=db.classes[String(b.classId||'')];
    if(!c)return send(res,404,{err:'班级不存在'});
    if(c.teacher!==user&&db.users[user].role!=='teacher')return send(res,403,{err:'无权查看'});
    const students=c.students.map(stuStats);
    return send(res,200,{cls:{id:c.id,name:c.name,code:c.code,open:c.open,teacher:c.teacher,created:c.created},students:students,
      totalLessons:(function(){try{return BANKS_CACHE.banks.length}catch(e){return 0}})()});
  }
  // 教师：移除学生
  if(u.pathname==='/api/class/kick'&&req.method==='POST'){
    if(!user)return send(res,401,{err:'未登录'});
    const b=await readBody(req);
    const c=db.classes[String(b.classId||'')];
    if(!c||c.teacher!==user)return send(res,403,{err:'无权操作'});
    const n=String(b.user||'').slice(0,12);
    c.students=c.students.filter(x=>x!==n);
    if(db.users[n]&&db.users[n].classId===c.id)db.users[n].classId=null;
    saveDB();
    return send(res,200,{ok:true});
  }
  // 教师：开关加入
  if(u.pathname==='/api/class/toggle'&&req.method==='POST'){
    if(!user)return send(res,401,{err:'未登录'});
    const b=await readBody(req);
    const c=db.classes[String(b.classId||'')];
    if(!c||c.teacher!==user)return send(res,403,{err:'无权操作'});
    c.open=!!b.open;saveDB();
    return send(res,200,{ok:true,open:c.open});
  }
  // 教师：重新生成邀请码
  if(u.pathname==='/api/class/newcode'&&req.method==='POST'){
    if(!user)return send(res,401,{err:'未登录'});
    const b=await readBody(req);
    const c=db.classes[String(b.classId||'')];
    if(!c||c.teacher!==user)return send(res,403,{err:'无权操作'});
    c.code=newCode();saveDB();
    return send(res,200,{ok:true,code:c.code});
  }
  // 教师：导出班级数据
  if(u.pathname==='/api/class/export'&&req.method==='POST'){
    if(!user)return send(res,401,{err:'未登录'});
    const b=await readBody(req);
    const c=db.classes[String(b.classId||'')];
    if(!c||c.teacher!==user)return send(res,403,{err:'无权操作'});
    return send(res,200,{export_time:new Date().toISOString(),class:{id:c.id,name:c.name,teacher:c.teacher,created:c.created},students:c.students.map(function(n){
      const s=stuStats(n);s.progress=(db.progress&&db.progress[n])||{};return s;
    })});
  }
  if(u.pathname==='/api/chat'&&req.method==='POST'){
    if(!DEEPSEEK)return send(res,503,{err:'AI问答未配置'});
    const b=await readBody(req);
    try{
      const r=await fetch('https://api.deepseek.com/chat/completions',{method:'POST',
        headers:{'Content-Type':'application/json','Authorization':'Bearer '+DEEPSEEK},
        body:JSON.stringify({model:'deepseek-chat',messages:[
          {role:'system',content:'你是新能源汽修带教师傅。只用中文，简洁、实操、安全第一；涉及高压必须提醒断电验电持证。'},
          {role:'user',content:(b.message||'').slice(0,1000)}],temperature:0.4})});
      const j=await r.json();
      return send(res,200,{reply:j.choices[0].message.content});
    }catch(e){return send(res,502,{err:'AI请求失败'})}
  }
  // ---------- AI 视觉识别：图片/视频抽帧 → 故障识别 + 维修建议 ----------
  if(u.pathname==='/api/analyze'&&req.method==='POST'){
    if(!VISION_KEY)return send(res,503,{err:'图像识别AI未配置（请配置DASHSCOPE_API_KEY）'});
    const b=await readBody(req);
    const isVideo=!!(b.video&&b.video.count);
    let frames=Array.isArray(b.images)?b.images.filter(Boolean):[];
    if(!frames.length)return send(res,400,{err:'没有可分析的图像，请重新上传'});
    if(frames.length>8)return send(res,400,{err:'一次最多分析8张图（含视频抽帧），请减少后重试'});
    const userText=(b.message||'').trim()||(isVideo?'请根据这段故障视频的画面判断故障并给出维修建议。':'请根据这张照片判断故障并给出维修建议。');
    const sys='你是「电能带教师傅」的AI师傅，资深新能源汽修专家。用户上传了'+(isVideo?'故障现场视频（服务器端已抽帧，按时间顺序排列）':'故障现场/仪表/诊断仪照片')+'，请按以下步骤回答：\n1)【画面识别】描述画面中与故障相关的关键信息（故障灯、诊断仪读数/故障码、部件状态、损伤/烧蚀/漏液部位等）；\n2)【原因推断】结合下方本站知识库与你自身的专业知识，推断最可能的故障原因（可列2-3个，按可能性排序）；\n3)【排查与修理建议】给出可执行的排查步骤和修理建议，先易后难；\n4)【安全提示】凡涉及高压母线、接触器、电池包的操作，必须强调断电→验电→挂牌上锁、持证人员作业、修复后绝缘复测与路试验证。\n用中文回答，条理清晰、务实可落地。若画面信息不足，明确说明还需要补充什么照片或数据（如故障码读数、数据流、铭牌等）。\n\n'+kbText(b.message);
    try{
      const content=[{type:'text',text:userText}];
      frames.slice(0,8).forEach(function(f){
        let d=String(f);
        if(d.indexOf('data:')!==0)d='data:image/jpeg;base64,'+d;
        content.push({type:'image_url',image_url:{url:d}});
      });
      const r=await fetch(VISION_BASE+'/chat/completions',{method:'POST',
        headers:{'Content-Type':'application/json','Authorization':'Bearer '+VISION_KEY},
        body:JSON.stringify({model:VISION_MODEL,messages:[{role:'system',content:sys},{role:'user',content:content}],temperature:0.3})});
      const j=await r.json();
      if(!r.ok||!j.choices||!j.choices.length)return send(res,502,{err:'AI请求失败：'+((j.error&&j.error.message)||('HTTP '+r.status))});
      return send(res,200,{reply:j.choices[0].message.content});
    }catch(e){return send(res,502,{err:'AI请求失败'})}
  }
  // ---------- 静态文件（屏蔽密钥/备份等敏感文件） ----------
  if(/keys\.json$|db\.json$|\.bak$|\.log$|^\/?\./i.test(u.pathname))return send(res,403,{err:'forbidden'});
  let fp=path.join(ROOT,decodeURIComponent(u.pathname));
  if(u.pathname==='/')fp=path.join(ROOT,'index.html');
  if(!fp.startsWith(ROOT))return send(res,403,{err:'forbidden'});
  fs.readFile(fp,(e,data)=>{
    if(e){ // SPA回退
      fs.readFile(path.join(ROOT,'index.html'),(e2,d2)=>{if(e2)return send(res,404,{err:'not found'});res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(d2)});
      return;
    }
    const ext=path.extname(fp).toLowerCase();
    const textAsset=['.html','.js','.css','.json','.md','.svg','.gltf'].includes(ext);
    res.writeHead(200,{'Content-Type':(MIME[ext]||'application/octet-stream')+(textAsset?'; charset=utf-8':''),'Cache-Control':textAsset?'no-cache':'max-age=86400'});
    res.end(data);
  });
});
server.listen(PORT,()=>console.log('电能带教师傅 动态版已启动: http://0.0.0.0:'+PORT+' (视觉识别:'+(VISION_KEY?'已配置':'未配置')+')'));
