/* Real DOM smoke test. Reuse an existing agent-owned Ego Lite TaskSpace. */
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const space=Number(process.env.UI_QA_SPACE);if(!Number.isSafeInteger(space)||space<1){console.error('Set UI_QA_SPACE to an existing agent-owned TaskSpace ID.');process.exit(1)}
let script=fs.readFileSync(path.join(__dirname,'verify-ui-focus.browser.mjs'),'utf8');
// The browser runner has its own environment, so resolve explicit task settings here.
script=script.replace(/^const task=.*$/m,'const task=await taskSpace('+space+'),page=task.page('+JSON.stringify(process.env.UI_QA_PAGE||'p1')+');').replace(/^const base=.*$/m,'const base='+JSON.stringify(process.env.UI_QA_URL||'http://localhost:8088')+';');
const result=spawnSync('ego-browser',['nodejs'],{input:script,encoding:'utf8',env:process.env,timeout:120000,maxBuffer:1024*1024});
if(result.stdout)process.stdout.write(result.stdout);if(result.stderr)process.stderr.write(result.stderr);
if(result.error){console.error(result.error.message);process.exit(1)}process.exit(result.status??1);
