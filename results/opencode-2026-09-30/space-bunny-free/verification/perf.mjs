import { chromium } from 'playwright'
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, resolve } from 'node:path'
const ROOT = resolve(process.argv[2])
const TYPES={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.woff2':'font/woff2','.webp':'image/webp','.avif':'image/avif','.png':'image/png'}
const server=createServer(async(req,res)=>{const u=new URL(req.url,'http://l');let f=join(ROOT,decodeURIComponent(u.pathname));try{if((await stat(f)).isDirectory())f=join(f,'index.html')}catch{res.writeHead(404).end();return}try{res.writeHead(200,{'content-type':TYPES[extname(f)]??'application/octet-stream'}).end(await readFile(f))}catch{res.writeHead(404).end()}})
await new Promise(r=>server.listen(0,r))
const base=`http://localhost:${server.address().port}`
const b=await chromium.launch()

// --- Paint + frame budget, with 4x CPU throttling --------------------------
const ctx = await b.newContext({ viewport:{width:1440,height:900} })
const p = await ctx.newPage()
const cdp = await ctx.newCDPSession(p)
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })

const t0 = Date.now()
await p.goto(`${base}/`, { waitUntil:'load' })
const loadMs = Date.now() - t0
await p.waitForTimeout(2500)
const paint = await p.evaluate(()=>{
  const f = performance.getEntriesByType('paint')
  const n = performance.getEntriesByType('navigation')[0]
  const res = performance.getEntriesByType('resource')
    .filter(r=>r.initiatorType!=='beacon')
    .reduce((a,r)=>a+r.transferSize,0)
  return { fcp: f.find(x=>x.name==='first-contentful-paint')?.startTime, domContentLoaded: n.domContentLoadedEventEnd, transfer: res, count: res.length }
})
console.log(`load event            ${loadMs} ms (CPU 4x throttled)`)
console.log(`FCP                   ${paint.fcp?.toFixed(0)} ms`)
console.log(`DOMContentLoaded      ${paint.domContentLoaded?.toFixed(0)} ms`)
console.log(`transferred           ${(paint.transfer/1024).toFixed(0)} kB across ${paint.count} requests`)

// Frame rate while the clock is live.
const fps = await p.evaluate(()=>new Promise(res=>{
  let frames=0; const start=performance.now();
  const tick=()=>{frames++; if(performance.now()-start<3000) requestAnimationFrame(tick); else res(frames/((performance.now()-start)/1000))}
  requestAnimationFrame(tick)
}))
console.log(`sustained fps         ${fps.toFixed(1)} (4x throttled, 2 canvases + rAF hands)`)

// Long tasks over a 5s window.
const longTasks = await p.evaluate(()=>new Promise(res=>{
  const found=[]; const obs=new PerformanceObserver(l=>{for(const e of l.getEntries()) found.push(Math.round(e.duration))})
  try{obs.observe({entryTypes:['longtask']})}catch{return res([])}
  setTimeout(()=>{obs.disconnect();res(found)},5000)
}))
console.log(`long tasks in 5s      ${longTasks.length ? longTasks.join(', ')+' ms' : 'none'}`)

// --- JS heap ----------------------------------------------------------------
const heap = await p.evaluate(()=> performance.memory ? Math.round(performance.memory.usedJSHeapSize/1048576) : null)
console.log(`JS heap               ${heap} MB`)

// --- Render-blocking resources ---------------------------------------------
const blocking = await p.evaluate(()=>performance.getEntriesByType('resource')
  .filter(r=>r.renderBlockingStatus==='blocking')
  .map(r=>`${r.name.split('/').pop()} (${Math.round(r.duration)}ms)`))
console.log(`render-blocking       ${blocking.length ? blocking.join(', ') : 'none'}`)

// --- Mobile, 4x throttled, on the first viewport ---------------------------
const mctx = await b.newContext({ viewport:{width:390,height:844}, isMobile:true, hasTouch:true, deviceScaleFactor:3 })
const m = await mctx.newPage()
const mcdp = await mctx.newCDPSession(m)
await mcdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
await m.goto(`${base}/`, { waitUntil:'load' })
await m.waitForTimeout(2500)
const mv = await m.evaluate(()=>{
  const res = performance.getEntriesByType('resource')
  const above = res.filter(r=>r.startTime < 2000)
  return { fcp: performance.getEntriesByType('paint').find(x=>x.name==='first-contentful-paint')?.startTime,
    firstScreen: above.reduce((a,r)=>a+r.transferSize,0), n: above.length }
})
console.log(`mobile FCP            ${mv.fcp?.toFixed(0)} ms (4x throttled, dpr 3)`)
console.log(`mobile first screen   ${(mv.firstScreen/1024).toFixed(0)} kB in ${mv.n} requests`)

await b.close(); server.close()
