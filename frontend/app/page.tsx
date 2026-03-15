'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase, isConfigured, Article } from '@/lib/supabase'

// ─── Category meta ────────────────────────────────────────────────────────────
const SECTION_META = {
  design:  { label: 'Design',  color: 'bg-violet-100 text-violet-700', dot: 'bg-violet-500' },
  it:      { label: 'Tech',    color: 'bg-sky-100 text-sky-700',       dot: 'bg-sky-500'    },
  startup: { label: 'Startup', color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
} as const

// ─── Company watch list ───────────────────────────────────────────────────────
type Company = { name: string; category: keyof typeof SECTION_META; x: string; linkedin: string; youtube: string }
const COMPANIES: Company[] = [
  { name:'Adobe',      category:'design',  x:'Adobe',        linkedin:'adobe',          youtube:'@Adobe'         },
  { name:'Runway',     category:'design',  x:'runwayml',     linkedin:'runwayml',       youtube:'@runwayml'      },
  { name:'Figma',      category:'design',  x:'figma',        linkedin:'figma',          youtube:'@figma'         },
  { name:'Framer',     category:'design',  x:'framer',       linkedin:'framer',         youtube:'@framer'        },
  { name:'OpenAI',     category:'it',      x:'OpenAI',       linkedin:'openai',         youtube:'@OpenAI'        },
  { name:'Anthropic',  category:'it',      x:'AnthropicAI',  linkedin:'anthropic',      youtube:'@anthropic-ai'  },
  { name:'Cursor',     category:'it',      x:'cursor_ai',    linkedin:'anysphere-inc',  youtube:'@cursorai'      },
  { name:'Vercel',     category:'it',      x:'vercel',       linkedin:'vercel',         youtube:'@VercelHQ'      },
  { name:'Replit',     category:'it',      x:'replit',       linkedin:'replit',         youtube:'@Replit'        },
  { name:'Lovable',    category:'startup', x:'lovabledev',   linkedin:'lovable-dev',    youtube:'@lovabledev'    },
  { name:'Linear',     category:'startup', x:'linear',       linkedin:'linear-app',     youtube:'@linear_app'    },
  { name:'YC',         category:'startup', x:'ycombinator',  linkedin:'y-combinator',   youtube:'@ycombinator'   },
]

// ─── Sample data ──────────────────────────────────────────────────────────────
const SAMPLE: Article[] = [
  { id:'1',  category:'design',  source:'Motionographer',       title:'Buck Design drops stunning 3D motion reel — a masterclass in visual storytelling', summary:'LA-based studio showcases fluid 3D transitions and bold color work.', url:'#', image_url:'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&q=80', published_at:new Date(Date.now()-1*3600000).toISOString(), collected_at:'' },
  { id:'2',  category:'design',  source:'YouTube · School of Motion', title:'After Effects 2026: Every new feature explained in depth', summary:'AI motion blur, native 3D engine, generative fill tools covered.', url:'#', image_url:'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=600&q=80', published_at:new Date(Date.now()-2*3600000).toISOString(), collected_at:'' },
  { id:'3',  category:'design',  source:'Adobe Blog',           title:'Adobe Firefly 3: text-to-vector and real-time style matching lands in Illustrator', summary:'Vector generation and live style transfer into Illustrator workflows.', url:'#', image_url:'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&q=80', published_at:new Date(Date.now()-3*3600000).toISOString(), collected_at:'' },
  { id:'4',  category:'design',  source:'Motion Array Blog',    title:'Top 10 kinetic typography trends dominating motion graphics in 2026', summary:'Variable fonts, 3D extrusion, and AI-generated type take center stage.', url:'#', image_url:'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=600&q=80', published_at:new Date(Date.now()-4*3600000).toISOString(), collected_at:'' },
  { id:'5',  category:'startup', source:'a16z',                 title:'Diagram raises $23M to build AI-native design tools for product teams', summary:'a16z leads the round for the SF-based design automation startup.', url:'#', image_url:'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=600&q=80', published_at:new Date(Date.now()-4*3600000).toISOString(), collected_at:'' },
  { id:'6',  category:'startup', source:'TechCrunch',           title:'Perplexity AI secures $500M Series D at $9B valuation led by SoftBank', summary:'5x user growth year-over-year, now expanding into enterprise market.', url:'#', image_url:'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=600&q=80', published_at:new Date(Date.now()-5*3600000).toISOString(), collected_at:'' },
  { id:'7',  category:'it',      source:'The Verge',            title:"OpenAI's new model scores record highs on reasoning benchmarks", summary:'Significant improvements in multi-step reasoning and code generation.', url:'#', image_url:'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80', published_at:new Date(Date.now()-5*3600000).toISOString(), collected_at:'' },
  { id:'8',  category:'it',      source:'Wired',                title:'AI power shortage is now the biggest bottleneck for data center growth', summary:'Data centers straining US power grids at unprecedented rates.', url:'#', image_url:'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=600&q=80', published_at:new Date(Date.now()-6*3600000).toISOString(), collected_at:'' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STOP = new Set(['the','a','an','in','on','at','to','for','of','and','or','but','is','are','was','were','be','been','have','has','had','do','does','did','will','would','could','should','may','might','it','its','this','that','these','those','with','from','by','as','how','why','what','when','where','who','which','new','more','most','about','after','before','into','up','out','all','just','than','then','so','if','not','no','here','there','over','get','gets','says','said','via','now','can','your','their','our','his','her','my','we','you','he','she','they','i','one','two','us','vs','every','next','first','last','year','years','days'])
const FUNDING_RE = /\$[\d.]+\s*[BMK]/i
const RAISE_RE   = /^(.+?)\s+(?:raises?|secures?|lands?|gets?|closes?)\s+\$[\d.]+\s*[BMK]/i
const VC_SOURCES = new Set(['a16z','Sequoia Capital','NFX','TechCrunch Startups','VentureBeat'])
const HOURS_48   = 48 * 3_600_000

function extractKeywords(articles: Article[]) {
  const freq: Record<string,number> = {}
  articles.forEach(a => a.title.toLowerCase().replace(/[^a-z0-9\s]/g,' ').split(/\s+/).filter(w=>w.length>3&&!STOP.has(w)).forEach(w=>{freq[w]=(freq[w]||0)+1}))
  return Object.entries(freq).filter(([,n])=>n>=2).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([w])=>w)
}
function extractFunding(articles: Article[]) {
  const seen = new Set<string>()
  return articles.filter(a=>a.category==='startup').flatMap(a=>{
    const amount = a.title.match(FUNDING_RE)?.[0]
    const m = a.title.match(RAISE_RE)
    if(amount&&m){const name=m[1].trim().split(' ').slice(0,3).join(' ');const k=name.toLowerCase();if(!seen.has(k)){seen.add(k);return [{name,amount,source:a.source}]}}
    return []
  }).slice(0,5)
}
function extractViral(articles: Article[]) {
  return articles.filter(a=>{
    const t=a.title.toLowerCase();const s=(a.summary||'').toLowerCase()
    if(/viral|blew up|everyone is|breaks record/.test(t))return true
    const hnScore=s.match(/(\d+)\s*points/);if(hnScore&&parseInt(hnScore[1])>300)return true
    const up=s.match(/(\d+)\s*upvotes/i);if(up&&parseInt(up[1])>1000)return true
    const amt=a.title.match(FUNDING_RE)?.[0];if(amt){const n=parseFloat(amt.replace(/[$BMK]/gi,''));const u=amt.slice(-1).toUpperCase();if((u==='B'?n*1e9:u==='M'?n*1e6:n*1e3)>=100_000_000)return true}
    return false
  }).slice(0,6)
}
function isNew(article?: Article) { return !!article && Date.now()-new Date(article.published_at).getTime()<HOURS_48 }
function timeAgo(d:string){const diff=Date.now()-new Date(d).getTime();const h=Math.floor(diff/3_600_000);const m=Math.floor(diff/60_000);if(h>=24)return`${Math.floor(h/24)}d ago`;if(h>0)return`${h}h ago`;return`${m}m ago`}
function xUrl(q:string){return`https://x.com/search?q=${encodeURIComponent(q)}&f=live`}

// ─── Left Sidebar: Pulse ──────────────────────────────────────────────────────
function PulseSidebar({ articles }: { articles: Article[] }) {
  const keywords = useMemo(()=>extractKeywords(articles),[articles])
  const funding  = useMemo(()=>extractFunding(articles),[articles])
  const viral    = useMemo(()=>extractViral(articles),[articles])

  return (
    <div className="space-y-5">

      {/* Viral */}
      {viral.length > 0 && (
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-100 flex items-center gap-2">
            <span className="text-base">🔥</span>
            <h3 className="text-sm font-semibold text-neutral-800">Viral Now</h3>
          </div>
          <div className="divide-y divide-neutral-50">
            {viral.map(a=>(
              <a key={a.id} href={a.url} target="_blank" rel="noopener noreferrer"
                className="flex items-start gap-3 px-4 py-3 hover:bg-neutral-50 transition-colors group">
                {a.image_url && <img src={a.image_url} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0 bg-neutral-100"/>}
                <p className="text-xs text-neutral-700 leading-snug group-hover:text-neutral-900 line-clamp-2">{a.title}</p>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Trending keywords */}
      {keywords.length > 0 && (
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-100">
            <h3 className="text-sm font-semibold text-neutral-800">Trending Keywords</h3>
          </div>
          <div className="px-4 py-3 flex flex-wrap gap-1.5">
            {keywords.map(kw=>(
              <a key={kw} href={xUrl(kw)} target="_blank" rel="noopener noreferrer"
                className="text-xs px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-600 hover:bg-neutral-800 hover:text-white transition-colors">
                {kw}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Funding */}
      {funding.length > 0 && (
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-100">
            <h3 className="text-sm font-semibold text-neutral-800">Funding Rounds</h3>
          </div>
          <div className="divide-y divide-neutral-50">
            {funding.map(f=>(
              <a key={f.name} href={xUrl(`${f.name} funding`)} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-between px-4 py-3 hover:bg-neutral-50 transition-colors group">
                <span className="text-sm text-neutral-700 group-hover:text-neutral-900 font-medium">{f.name}</span>
                <span className="text-sm font-bold text-emerald-600">{f.amount}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Right Sidebar: Company Watch ─────────────────────────────────────────────
function CompanyWatchSidebar({ articles }: { articles: Article[] }) {
  function getLatestVideo(c: Company): Article|undefined {
    return articles.filter(a=>a.source.toLowerCase().includes(c.name.toLowerCase())&&a.source.toLowerCase().includes('youtube')).sort((a,b)=>new Date(b.published_at).getTime()-new Date(a.published_at).getTime())[0]
  }
  const sorted = useMemo(()=>[...COMPANIES].sort((a,b)=>{
    const va=getLatestVideo(a);const vb=getLatestVideo(b)
    const sa=isNew(va)?2:va?1:0;const sb=isNew(vb)?2:vb?1:0
    if(sa!==sb)return sb-sa
    if(va&&vb)return new Date(vb.published_at).getTime()-new Date(va.published_at).getTime()
    return 0
  }),[articles])
  const newCount = sorted.filter(c=>isNew(getLatestVideo(c))).length

  return (
    <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-800">Company Watch</h3>
        {newCount>0 && <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">{newCount} new</span>}
      </div>
      <div className="divide-y divide-neutral-50">
        {sorted.map(c=>{
          const video = getLatestVideo(c)
          const hasNew = isNew(video)
          const meta = SECTION_META[c.category]
          return (
            <div key={c.name} className="px-4 py-3 hover:bg-neutral-50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-neutral-800">{c.name}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${meta.color}`}>{meta.label}</span>
                </div>
                {hasNew && <span className="text-xs font-bold text-red-500">NEW</span>}
              </div>
              {video?(
                <a href={video.url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2 group">
                  {video.image_url&&<img src={video.image_url} alt="" className="w-14 h-10 rounded object-cover shrink-0 bg-neutral-100"/>}
                  <div className="min-w-0">
                    <p className="text-xs text-neutral-600 leading-snug group-hover:text-neutral-900 line-clamp-2">{video.title}</p>
                    <p className="text-xs text-neutral-400 mt-0.5">{timeAgo(video.published_at)}</p>
                  </div>
                </a>
              ):(
                <div className="flex items-center gap-2">
                  {[
                    {href:`https://x.com/${c.x}`, label:'X'},
                    {href:`https://www.youtube.com/${c.youtube}`, label:'YT'},
                    {href:`https://www.linkedin.com/company/${c.linkedin}`, label:'Li'},
                  ].map(btn=>(
                    <a key={btn.label} href={btn.href} target="_blank" rel="noopener noreferrer"
                      className="text-xs px-2 py-0.5 rounded bg-neutral-100 text-neutral-500 hover:bg-neutral-800 hover:text-white transition-colors">
                      {btn.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Article card ─────────────────────────────────────────────────────────────
function ArticleCard({ a, variant='grid' }: { a: Article; variant?: 'grid'|'list' }) {
  const [imgFailed, setImgFailed] = useState(false)
  const meta    = SECTION_META[a.category]
  const viral   = extractViral([a]).length > 0
  const brandNew = Date.now()-new Date(a.published_at).getTime() < 6*3_600_000

  if (variant === 'list') {
    return (
      <a href={a.url} target="_blank" rel="noopener noreferrer"
        className="fade-in flex items-start gap-3 py-3 hover:bg-neutral-50 transition-colors group px-4 -mx-4 rounded-lg">
        {a.image_url&&!imgFailed
          ? <img src={a.image_url} alt="" className="w-16 h-12 rounded-lg object-cover shrink-0 bg-neutral-100" onError={()=>setImgFailed(true)}/>
          : <div className="w-16 h-12 rounded-lg bg-neutral-100 shrink-0"/>
        }
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${meta.color}`}>{meta.label}</span>
            {viral && <span className="text-xs">🔥</span>}
            {brandNew && <span className="text-xs font-semibold text-green-600">New</span>}
          </div>
          <h3 className="text-sm font-semibold text-neutral-900 leading-snug group-hover:text-black line-clamp-2">{a.title}</h3>
          <p className="text-xs text-neutral-400 mt-1">{a.source} · {timeAgo(a.published_at)}</p>
        </div>
      </a>
    )
  }

  return (
    <a href={a.url} target="_blank" rel="noopener noreferrer"
      className="fade-in flex flex-col bg-white rounded-xl border border-neutral-200 hover:border-neutral-300 hover:shadow-sm transition-all group overflow-hidden">
      {a.image_url&&!imgFailed?(
        <div className="h-40 bg-neutral-100 overflow-hidden shrink-0 relative">
          <img src={a.image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={()=>setImgFailed(true)}/>
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
            {viral&&<span className="text-xs font-semibold bg-black/80 text-white px-2 py-0.5 rounded-full">🔥 Viral</span>}
            {brandNew&&!viral&&<span className="text-xs font-semibold bg-white text-neutral-900 px-2 py-0.5 rounded-full shadow-sm">New</span>}
          </div>
        </div>
      ):(
        <div className="h-1.5 bg-neutral-100 shrink-0"/>
      )}
      <div className="flex flex-col flex-1 p-4 gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className={`text-xs px-2 py-0.5 rounded font-medium ${meta.color}`}>{meta.label}</span>
          <span className="text-xs text-neutral-400">{timeAgo(a.published_at)}</span>
        </div>
        <h3 className="text-sm font-semibold text-neutral-900 leading-snug group-hover:text-black line-clamp-3">{a.title}</h3>
        {a.summary&&<p className="text-xs text-neutral-500 leading-relaxed line-clamp-2">{a.summary}</p>}
        <p className="text-xs text-neutral-400 mt-auto pt-1 truncate">{a.source}</p>
      </div>
    </a>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden animate-pulse">
      <div className="h-40 bg-neutral-100"/>
      <div className="p-4 space-y-2.5">
        <div className="h-3 w-14 bg-neutral-100 rounded-full"/>
        <div className="h-4 bg-neutral-100 rounded"/>
        <div className="h-4 w-4/5 bg-neutral-100 rounded"/>
        <div className="h-3 w-24 bg-neutral-100 rounded mt-2"/>
      </div>
    </div>
  )
}

// ─── Category section ─────────────────────────────────────────────────────────
function CategorySection({ categoryKey, articles }: { categoryKey: string; articles: Article[] }) {
  const meta = SECTION_META[categoryKey as keyof typeof SECTION_META]
  const [showAll, setShowAll] = useState(false)
  if (articles.length===0) return null
  const visible = showAll ? articles : articles.slice(0, 6)
  return (
    <section className="mb-8">
      <div className="flex items-center gap-2.5 mb-4">
        <span className={`w-2.5 h-2.5 rounded-full ${meta.dot}`}/>
        <h2 className="text-base font-bold text-neutral-900">{meta.label}</h2>
        <span className="text-sm text-neutral-400">{articles.length} articles</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {visible.map(a=><ArticleCard key={a.id} a={a} variant="grid"/>)}
      </div>
      {articles.length > 6 && (
        <button onClick={()=>setShowAll(!showAll)}
          className="mt-3 w-full py-2.5 text-sm text-neutral-500 hover:text-neutral-800 border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors">
          {showAll ? 'Show less' : `Show ${articles.length-6} more`}
        </button>
      )}
    </section>
  )
}

function ArticleGrid({ articles }: { articles: Article[] }) {
  if (articles.length===0) return (
    <div className="text-center py-32 text-neutral-400">
      <p className="text-base font-semibold">No articles yet</p>
      <p className="text-sm mt-1">Run the collector to fetch today's news.</p>
    </div>
  )
  return <div className="grid grid-cols-2 gap-3">{articles.map(a=><ArticleCard key={a.id} a={a} variant="grid"/>)}</div>
}

// ─── Page ─────────────────────────────────────────────────────────────────────
const TABS = [{key:'all',label:'All'},{key:'design',label:'Design'},{key:'it',label:'Tech'},{key:'startup',label:'Startup'}]

export default function Dashboard() {
  const [articles, setArticles] = useState<Article[]>([])
  const [category, setCategory] = useState('all')
  const [loading,  setLoading]  = useState(true)
  const [isDemo,   setIsDemo]   = useState(false)

  useEffect(()=>{
    if(!isConfigured||!supabase){setArticles(SAMPLE);setIsDemo(true);setLoading(false);return}
    setLoading(true)
    let q = supabase.from('articles').select('*').order('published_at',{ascending:false}).limit(200)
    if(category!=='all') q=q.eq('category',category)
    q.then(({data,error})=>{if(!error&&data&&data.length>0)setArticles(data);else{setArticles(SAMPLE);setIsDemo(true)};setLoading(false)})
  },[category])

  const funding  = useMemo(()=>extractFunding(articles),[articles])
  const byCategory = (k:string)=>articles.filter(a=>a.category===k)

  const designCount  = articles.filter(a=>a.category==='design').length
  const itCount      = articles.filter(a=>a.category==='it').length
  const startupCount = articles.filter(a=>a.category==='startup').length

  const today = new Date().toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})

  return (
    <div className="min-h-screen bg-[#f5f3f0]">

      {/* ── Header ── */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-20">
        <div className="max-w-[1400px] mx-auto px-6 h-14 flex items-center justify-between gap-6">

          {/* Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <h1 className="text-base font-bold text-neutral-900 tracking-tight">Morning Brief</h1>
            <div className="flex items-center gap-1.5 bg-emerald-50 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"/>
              <span className="text-xs font-medium text-emerald-700">Live</span>
            </div>
            {isDemo&&<span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">Demo</span>}
          </div>

          {/* Tabs */}
          <nav className="flex items-center gap-1">
            {TABS.map(t=>(
              <button key={t.key} onClick={()=>setCategory(t.key)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  category===t.key ? 'bg-neutral-900 text-white' : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100'
                }`}>
                {t.label}
              </button>
            ))}
          </nav>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-neutral-500 shrink-0">
            <span><b className="text-neutral-800 font-semibold">{articles.length}</b> articles</span>
            <div className="flex items-center gap-3 text-xs">
              {[['Design',designCount,'text-violet-600'],['Tech',itCount,'text-sky-600'],['Startup',startupCount,'text-emerald-600']].map(([l,n,c])=>(
                n>0 && <span key={l as string}><b className={`font-semibold ${c}`}>{n}</b> {l}</span>
              ))}
            </div>
            <span className="text-neutral-400">{today}</span>
          </div>
        </div>
      </header>

      {/* ── Body: 3-column ── */}
      <div className="max-w-[1400px] mx-auto px-6 py-6 flex gap-5 items-start">

        {/* Left sidebar */}
        <aside className="w-52 shrink-0 sticky top-20">
          <PulseSidebar articles={articles}/>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {loading ? (
            <div className="space-y-8">
              {['Design','Tech','Startup'].map(n=>(
                <div key={n}>
                  <div className="h-5 w-24 bg-neutral-200 rounded animate-pulse mb-4"/>
                  <div className="grid grid-cols-2 gap-3">
                    {Array.from({length:4}).map((_,i)=><SkeletonCard key={i}/>)}
                  </div>
                </div>
              ))}
            </div>
          ) : category==='all' ? (
            <div>
              <CategorySection categoryKey="design"  articles={byCategory('design')}/>
              <CategorySection categoryKey="it"      articles={byCategory('it')}/>
              <CategorySection categoryKey="startup" articles={byCategory('startup')}/>
            </div>
          ) : (
            <ArticleGrid articles={articles}/>
          )}
          <p className="text-center text-neutral-400 text-xs mt-10">
            {articles.length} articles · {isDemo ? 'demo mode' : 'updated daily 02:00 UTC'}
          </p>
        </main>

        {/* Right sidebar */}
        <aside className="w-64 shrink-0 sticky top-20">
          <CompanyWatchSidebar articles={articles}/>
        </aside>

      </div>
    </div>
  )
}
