import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { CalendarDays, Swords, Shield, Clock, Download, Plus, Minus, BookText } from 'lucide-react'

function formatNowTaipeiMinutes() {
  const fmt = new Intl.DateTimeFormat('zh-Hant', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  const parts = fmt.formatToParts(new Date())
  const obj = Object.fromEntries(parts.filter(p => p.type !== 'literal').map(p => [p.type, p.value]))
  return `${obj.year}/${obj.month}/${obj.day}  ${obj.hour}:${obj.minute}`
}

function clamp(n, min, max) { return Math.max(min, Math.min(max, n)) }
function makeBlocks(filled, total) {
  const on = '▮'.repeat(filled)
  const off = '░'.repeat(Math.max(0, total - filled))
  return on + off
}

const DEFAULT_STATE = {
  level: 12,
  exp: 86,
  hp: 240,
  maxHp: 240,
  showAP: false,
  ap: 100,
  today: { mcq: 3, boss: 0 },
  total: { mcq: 60, boss: 6 },
  weekly: { zhonghui_done: 0, zhonghui_target: 3, essay_done: 0, essay_target: 5 },
}
const STORAGE_KEY = 'cpa115-react-panel-v6-state'

function usePersistentState() {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) return JSON.parse(raw)
    } catch {}
    return DEFAULT_STATE
  })
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch {}
  }, [state])
  return [state, setState]
}

export default function App() {
  const [state, setState] = usePersistentState()
  const [updateStr, setUpdateStr] = useState(formatNowTaipeiMinutes())
  const [daysLabel, setDaysLabel] = useState('D-339')

  useEffect(() => {
    const id = setInterval(() => setUpdateStr(formatNowTaipeiMinutes()), 30_000)
    return () => clearInterval(id)
  }, [])

  const expBlocks = useMemo(() => {
    const filled = clamp(Math.round((state.exp / 100) * 20), 0, 20)
    return makeBlocks(filled, 20)
  }, [state.exp])
  const hpBlocks = useMemo(() => {
    const filled = clamp(Math.round((state.hp / state.maxHp) * 20), 0, 20)
    return makeBlocks(filled, 20)
  }, [state.hp, state.maxHp])

function gainExpHp({ exp = 0, hp = 0 }) {
  setState(prev => {
    let level = prev.level;
    let expSum = prev.exp + exp;              // 新增 EXP 累計
    let hpVal  = clamp(prev.hp + hp, 0, prev.maxHp);

    // 允許一次加很多經驗，連續升級
    while (expSum >= 100) {
      level += 1;
      expSum -= 100;                           // 每級固定 100
    }
    // 也處理被扣到負數（理論上不會用到，但保險）
    while (expSum < 0 && level > 1) {
      level -= 1;
      expSum += 100;
    }

    // 確保落在 0..99
    expSum = clamp(Math.round(expSum), 0, 99);

    return { ...prev, level, exp: expSum, hp: hpVal };
  });
}
  function doStudyHour() { gainExpHp({ exp: 10, hp: -10 }) }
  function doMCQ(n = 1) {
    setState(prev => ({
      ...prev,
      today: { ...prev.today, mcq: prev.today.mcq + n },
      total: { ...prev.total, mcq: prev.total.mcq + n },
    }))
    gainExpHp({ exp: 2 * n, hp: -5 * n })
  }
  function doBoss(n = 1) {
    setState(prev => ({
      ...prev,
      today: { ...prev.today, boss: prev.today.boss + n },
      total: { ...prev.total, boss: prev.total.boss + n },
    }))
    gainExpHp({ exp: 10 * n, hp: -20 * n })
  }
  function healFull() { setState(prev => ({ ...prev, hp: prev.maxHp })) }
  function toggleAP() { setState(prev => ({ ...prev, showAP: !prev.showAP })) }
  function incZhonghui(v) {
    setState(prev => ({ ...prev, weekly: { ...prev.weekly, zhonghui_done: clamp(prev.weekly.zhonghui_done + v, 0, prev.weekly.zhonghui_target) }}))
  }
  function incEssay(v) {
    setState(prev => ({ ...prev, weekly: { ...prev.weekly, essay_done: clamp(prev.weekly.essay_done + v, 0, prev.weekly.essay_target) }}))
  }
  function resetWeekly() { setState(prev => ({ ...prev, weekly: { ...prev.weekly, zhonghui_done: 0, essay_done: 0 }})) }

  function downloadMarkdownSnapshot() {
    const md = `## Snapshot — ${updateStr}\n**115 CPA Online  ⏳ ${daysLabel}**  \nRoy  Lv.${state.level}　${updateStr}\n\n`+
      `EXP: [${expBlocks}]   ${Math.round(state.exp)} / 100  \n`+
      `HP : [${hpBlocks}] ${state.hp} / ${state.maxHp}  \n\n`+
      `⚔️ Today: MCQ ${state.today.mcq}   Boss ${state.today.boss}  \n`+
      `🗡️ Total: MCQ ${state.total.mcq}   Boss ${state.total.boss}\n\n`+
      `<details>\n<summary>Raw (for程式/比對)</summary>\n\n`+
      '```json\n' +
      JSON.stringify({ title: `115 CPA Online  ⏳ ${daysLabel}`, player: 'Roy', level: state.level, update: updateStr, exp: { current: Math.round(state.exp), max: 100 }, hp: { current: state.hp, max: state.maxHp }, today: { ...state.today }, total: { ...state.total }, weekly: { ...state.weekly } }, null, 2) + '\n```\n</details>\n\n---\n'

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `115_CPA_Online_Permanent_Save_${updateStr.replaceAll('/', '-').replaceAll(' ', '_').replaceAll(':', '-')}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const Btn = ({ children, onClick, variant='solid' }) => (
    <button
      onClick={onClick}
      className={
        'px-3 py-2 rounded-xl text-sm font-medium transition ' +
        (variant==='outline' ? 'border border-slate-300 bg-white hover:bg-slate-50' :
         variant==='danger' ? 'bg-rose-600 text-white hover:bg-rose-700' :
         variant==='secondary' ? 'bg-slate-200 hover:bg-slate-300' :
         'bg-slate-900 text-white hover:bg-slate-800')
      }>
      {children}
    </button>
  )

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-white to-slate-50 p-6">
      <div className="mx-auto max-w-3xl space-y-4">
        <header className="flex items-center justify-between">
          <div className="text-xl font-bold tracking-wide">
            115 CPA Online <span className="mx-2">⏳</span> {daysLabel}
          </div>
          <div className="text-sm text-slate-600 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="font-medium">Roy</span>
            <span>Lv.{state.level}</span>
            <span className="tabular-nums">{updateStr}</span>
          </div>
        </header>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div className="rounded-2xl shadow-sm border bg-white">
            <div className="p-4 border-b text-base flex items-center gap-2">
              <Shield className="h-4 w-4" /> 狀態列
            </div>
            <div className="p-4 space-y-3">
              <div className="font-mono text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">EXP</span>
                  <span className="tabular-nums">{Math.round(state.exp)} / 100</span>
                </div>
                <div className="mt-1 rounded-lg bg-slate-100 p-2 text-center select-all">
                  {expBlocks}
                </div>
              </div>

              <div className="font-mono text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">HP</span>
                  <span className="tabular-nums">{state.hp} / {state.maxHp}</span>
                </div>
                <div className="mt-1 rounded-lg bg-slate-100 p-2 text-center select-all">
                  {hpBlocks}
                </div>
              </div>

              {state.showAP && (
                <div className="font-mono text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">AP</span>
                    <span className="tabular-nums">{state.ap} / 100</span>
                  </div>
                  <div className="mt-1 rounded-lg bg-slate-100 p-2 text-center select-all">
                    {makeBlocks(Math.round((state.ap / 100) * 20), 20)}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <div className="rounded-xl bg-slate-50 p-3 border">
                  <div className="flex items-center gap-2 text-slate-700"><Swords className="h-4 w-4" /> Today</div>
                  <div className="mt-1 font-mono text-sm">⚔️ MCQ {state.today.mcq}　👹 Boss {state.today.boss}</div>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 border">
                  <div className="flex items-center gap-2 text-slate-700"><BookText className="h-4 w-4" /> Total</div>
                  <div className="mt-1 font-mono text-sm">🗡️ MCQ {state.total.mcq}　👹 Boss {state.total.boss}</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="rounded-2xl shadow-sm border bg-white">
          <div className="p-4 border-b text-base flex items-center gap-2"><CalendarDays className="h-4 w-4" /> Weekly Mission 📌</div>
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div>中會：{state.weekly.zhonghui_done} / {state.weekly.zhonghui_target} 堂</div>
              <div className="flex gap-2">
                <Btn variant='outline' onClick={() => incZhonghui(-1)}><Minus className='inline h-4 w-4' /></Btn>
                <Btn onClick={() => incZhonghui(1)}><Plus className='inline h-4 w-4' /></Btn>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div>申論：{state.weekly.essay_done} / {state.weekly.essay_target} 題</div>
              <div className="flex gap-2">
                <Btn variant='outline' onClick={() => incEssay(-1)}><Minus className='inline h-4 w-4' /></Btn>
                <Btn onClick={() => incEssay(1)}><Plus className='inline h-4 w-4' /></Btn>
              </div>
            </div>
            <div className="pt-1">
              <Btn variant='outline' onClick={resetWeekly}>週重置</Btn>
            </div>
          </div>
        </div>

        <div className="rounded-2xl shadow-sm border bg-white">
          <div className="p-4 border-b text-base">操作</div>
          <div className="p-4 flex flex-wrap gap-2">
            <Btn onClick={doStudyHour}>+1 小時看書（+10EXP / -10HP）</Btn>
            <Btn variant='secondary' onClick={() => doMCQ(1)}>+1 MCQ（+2 / -5）</Btn>
            <Btn variant='secondary' onClick={() => doMCQ(5)}>+5 MCQ</Btn>
            <Btn variant='danger' onClick={() => doBoss(1)}>+1 Boss（+10 / -20）</Btn>
            <Btn variant='outline' onClick={healFull}>抱抱回血（HP 全滿）</Btn>
            <Btn variant='outline' onClick={toggleAP}>{state.showAP ? '隱藏 AP' : '顯示 AP'}</Btn>
            <Btn variant='outline' onClick={downloadMarkdownSnapshot}><Download className='inline mr-2 h-4 w-4' />匯出永久保存（.md）</Btn>
          </div>
        </div>

        <footer className="text-center text-xs text-slate-400 pt-2">
          規格：時間顯示到分鐘、EXP 每級 100、AP 預設隱藏。狀態會自動儲存於瀏覽器。
        </footer>
      </div>
    </div>
  )
}
