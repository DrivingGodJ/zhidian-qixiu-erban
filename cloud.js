/* 云端同步补丁：检测到服务器/api时启用云端账号与进度同步，失败则静默回退本地
   同步范围：当前登录用户的全部带后缀学习键（et_lessons:u / et_exam:*:u / et_wrong:u / et_place:u 等） */
(function(){
var TOKEN_KEY='et_cloud_token',USER_KEY='et_cloud_user';
function api(p,opts){return fetch('/api'+p,opts).then(function(r){if(!r.ok)throw new Error(r.status);return r.json()})}
function getLS(k,d){try{var v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}}
function setLS(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function cloudUser(){return getLS(USER_KEY,null)}
function token(){return getLS(TOKEN_KEY,null)}
function collect(){var cu=cloudUser(),o={};if(!cu)return o;var suf=':'+cu;
  for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(k.slice(-suf.length)===suf)o[k]=getLS(k)}
  return o}
function applyRemote(p){if(!p)return;Object.keys(p).forEach(function(k){setLS(k,p[k])})}
function sync(){
  if(!token())return;
  api('/progress',{method:'POST',headers:{'Content-Type':'application/json','x-token':token()},body:JSON.stringify(collect())}).catch(function(){});
}
function cloudLogin(u,p){
  return api('/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({u:u,p:p})})
    .catch(function(){return api('/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({u:u,p:p})})})
    .then(function(r){
      setLS(TOKEN_KEY,r.token);setLS(USER_KEY,u);
      var jc=window.__joinCode;window.__joinCode=null; // 注册时填的班级邀请码
      return api('/progress',{headers:{'x-token':r.token}}).then(function(remote){
        applyRemote(remote); // 服务器数据合并回本地
        if(jc){
          return api('/class/join',{method:'POST',headers:{'Content-Type':'application/json','x-token':r.token},body:JSON.stringify({code:jc})})
            .catch(function(){})
            .then(function(){location.reload()});
        }
        location.reload();
      });
    });
}
function cloudLogout(){localStorage.removeItem(TOKEN_KEY);localStorage.removeItem(USER_KEY)}
// 启动：检测服务器
api('/ping').then(function(){
  // 服务器在线：本地登录成功后自动云登录并启动定时同步
  var _doAuth=window.doAuth;
  window.doAuth=async function(){
    var u=document.getElementById('aUser').value.trim(),p=document.getElementById('aPass').value;
    await _doAuth();
    if(getLS('et_session',null)===u){
      cloudLogin(u,p).catch(function(){});
    }
  };
  var _logout=window.doLogout;
  window.doLogout=function(){cloudLogout();_logout()};
  setInterval(sync,20000);window.addEventListener('beforeunload',sync);
  // 顶部标记
  var chip=document.getElementById('userChip');
  if(chip&&token()){setTimeout(function(){chip.textContent='☁️ '+getLS('et_session','')+'（云端已同步）'},500)}
}).catch(function(){/* 静态部署：静默本地模式 */});
})();
