(() => {
  'use strict';

  const TABS = [
    { id: 'overview', icon: '📊', zh: 'REV B03 总览', mm: 'REV B03 အကျဉ်းချုပ်', bottom: true },
    { id: 'boq', icon: '📐', zh: '算量与钢筋', mm: 'BOQ တွက်ချက်', bottom: true },
    { id: 'notes', icon: '📝', zh: '离线演练账本', mm: 'ယာယီ မှတ်တမ်း', bottom: true },
    { id: 'prompts', icon: '🎨', zh: '工业风提示词', mm: 'AI ပုံထုတ် နမူနာ', bottom: true },
    { id: 'about', icon: '🛡️', zh: '治理与边界', mm: 'စည်းမျဉ်းများ', bottom: true },
  ];

  const STORAGE_KEY = 'win_crown_static_ui_notes_v1';

  const REV_B03 = {
    clearWidth: "38′9″ (11,811 mm)",
    lateralLayout: "2 ft + 32′9″ + 4 ft",
    footings: "21 F1 基础 · 21 根短柱 (7×3 阵列原位保留)",
    steelCols: "14 根主钢柱 (两侧各 7 根 · 中间无柱)",
    roof: "约 39 ft 钢结构屋盖 · 两侧不等长屋檐与独立天沟 · A/B 栋独立承载",
    deprecated: "44′9″ 扩跨度旧方案已废弃（仅留历史记录）",
    eccentricity: "B 栋侧 6 ft F1 底板偏心避让待现场开挖/表面核实（严禁假定同心）",
  };

  const BOQ_BASELINES = [
    {
      code: 'STAGE4',
      label_zh: 'STAGE4 历史工程量基准 (冻结对照)',
      label_mm: 'STAGE4 သမိုင်းဝင် အင်ဂျင်နီယာ ပမာဏ',
      concrete: '66.45 m³',
      lean: '5.352 m³',
      gravel: '21.408 m³',
      formwork: '107.303 m²',
      status: 'HISTORICAL_REFERENCE',
    },
    {
      code: 'GB24',
      label_zh: 'GB24 新版候选基准 (12×24 in 地梁)',
      label_mm: 'GB24 အသစ် အခြေခံ (12×24 လက်မ)',
      concrete: '76.429 m³',
      lean: '5.352 m³',
      gravel: '21.408 m³',
      formwork: '124.85 m²',
      status: 'CANDIDATE',
    },
  ];

  const state = {
    lang: 'bi',
    tab: 'overview',
    presets: null,
  };

  const $ = (id) => document.getElementById(id);

  function esc(v) {
    return String(v ?? '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  function bi(zh, mm) {
    if (state.lang === 'zh') return zh;
    if (state.lang === 'mm') return mm || zh;
    return mm ? `${zh} / ${mm}` : zh;
  }

  function fmtNum(n) {
    const num = Number(n);
    return Number.isFinite(num) ? num.toLocaleString('en-US') : String(n ?? '');
  }

  function toast(msg) {
    const el = $('toast');
    el.textContent = msg;
    el.style.display = 'block';
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { el.style.display = 'none'; }, 2800);
  }

  function loadDrafts() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function saveDrafts(list) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {
      toast('浏览器存储空间受限，未能保存');
    }
  }

  function renderNav() {
    $('sidebarNav').innerHTML = TABS.map((t) => `
      <button type="button" class="side-btn ${state.tab === t.id ? 'active' : ''}" data-tab="${t.id}">
        <span>${t.icon} ${esc(t.zh)}</span>
        <small>${esc(t.mm)}</small>
      </button>
    `).join('') + `
      <a class="side-btn" href="./boq.html" style="margin-top:10px;border:1px solid var(--border);background:var(--brand-soft);color:var(--brand);font-weight:700">
        <span>📐 打开 SMART BOQ V1.0</span>
        <small>BOQ နှင့် BBS စနစ် အပြည့်အစုံ</small>
      </a>
    `;

    $('mobileStrip').innerHTML = TABS.map((t) => `
      <button type="button" class="pill-btn ${state.tab === t.id ? 'active' : ''}" data-tab="${t.id}">
        ${t.icon} ${esc(bi(t.zh, t.mm))}
      </button>
    `).join('');

    $('bottomNav').innerHTML = TABS.map((t) => `
      <button type="button" class="${state.tab === t.id ? 'active' : ''}" data-tab="${t.id}">
        <span style="font-size:18px">${t.icon}</span>
        <span>${esc(state.lang === 'mm' ? t.mm : t.zh)}</span>
      </button>
    `).join('');

    document.querySelectorAll('[data-tab]').forEach((btn) => {
      btn.onclick = () => switchTab(btn.dataset.tab);
    });
  }

  async function loadPresets() {
    if (state.presets) return state.presets;
    try {
      const r = await fetch('./data/win_crown_prompt_presets.json');
      if (r.ok) {
        state.presets = await r.json();
        return state.presets;
      }
    } catch {
      // ignore offline file:// fallback
    }
    state.presets = { presets: [], default_negative_prompt: '' };
    return state.presets;
  }

  async function switchTab(tabId) {
    state.tab = tabId;
    renderNav();
    if (tabId === 'overview') renderOverview();
    else if (tabId === 'boq') renderBoq();
    else if (tabId === 'notes') renderNotes();
    else if (tabId === 'prompts') await renderPrompts();
    else if (tabId === 'about') renderAbout();
  }

  function renderOverview() {
    const drafts = loadDrafts();
    $('viewRoot').innerHTML = `
      <div class="card">
        <h2>
          <span>📊 ${esc(bi('WIN CROWN — REV B03 最新唯一横向现场基准', 'WIN CROWN REV B03 စီမံကိန်း အကျဉ်းချုပ်'))}</span>
          <button type="button" class="btn no-print" onclick="window.print()">🖨️ ${esc(bi('打印水印汇报页', 'ပရင့်ထုတ်ရန်'))}</button>
        </h2>
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-label">${esc(bi('墙间净宽 (唯一基准)', 'နံရံကြား အကျယ်'))}</div>
            <div class="kpi-val">${esc(REV_B03.clearWidth)}</div>
            <span class="badge ok">REV B03 VERIFIED</span>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">${esc(bi('横向三段定位', 'အလျားလိုက် တိုင်းတာချက်'))}</div>
            <div class="kpi-val">${esc(REV_B03.lateralLayout)}</div>
            <span class="badge ok">闭合误差 0.000 mm</span>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">${esc(bi('F1 基础与短柱', 'F1 အောက်ခြေခံနှင့် တိုင်တို'))}</div>
            <div class="kpi-val">21 基础 / 21 短柱</div>
            <span class="badge">7×3 原位保留</span>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">${esc(bi('上部主钢柱方案', 'သံမဏိတိုင် အရေအတွက်'))}</div>
            <div class="kpi-val">14 根主钢柱</div>
            <span class="badge">两侧各 7 根</span>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">${esc(bi('屋盖与排水体系', 'အမိုးနှင့် ရေတံလျှောက်'))}</div>
            <div class="kpi-val">约 39 ft 不等长屋檐</div>
            <span class="badge warn">独立天沟 · A/B独立承载</span>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">${esc(bi('本机浏览器演练草稿', 'စက်တွင်း ယာယီမှတ်တမ်း'))}</div>
            <div class="kpi-val">${drafts.length} 条记录</div>
            <span class="badge">OFFLINE LOCAL</span>
          </div>
        </div>
        <div class="btn-row no-print">
          <a class="btn btn-primary" href="./boq.html">📐 ${esc(bi('进入 ALAN SMART BOQ V1.0 完整算量与 XLSX 导出', 'SMART BOQ V1.0 ဖွင့်ရန်'))}</a>
          <button type="button" class="btn" id="jumpPromptsBtn">🎨 ${esc(bi('查看工业风建筑提示词模板', 'AI ပုံထုတ် နမူနာကြည့်ရန်'))}</button>
        </div>
      </div>

      <div class="card">
        <h2>🚦 ${esc(bi('REV B03 关键核查与施工门禁条款', 'REV B03 စစ်ဆေးရန် အချက်များ'))}</h2>
        <div class="table-wrap">
          <table>
            <thead><tr>
              <th>${esc(bi('项目', 'အကြောင်းအရာ'))}</th>
              <th>${esc(bi('现行口径 (REV B03)', 'လက်ရှိ သတ်မှတ်ချက်'))}</th>
              <th>${esc(bi('状态', 'အခြေအနေ'))}</th>
            </tr></thead>
            <tbody>
              <tr><td>墙间净宽与横向定位</td><td>${esc(REV_B03.clearWidth)} = ${esc(REV_B03.lateralLayout)}</td><td><span class="badge ok">LOCKED</span></td></tr>
              <tr><td>既有基础与短柱</td><td>${esc(REV_B03.footings)}</td><td><span class="badge ok">RETAINED</span></td></tr>
              <tr><td>上部钢构与屋盖</td><td>${esc(REV_B03.steelCols)}；${esc(REV_B03.roof)}</td><td><span class="badge warn">FOR DISCUSSION</span></td></tr>
              <tr><td>旧方案处置</td><td>${esc(REV_B03.deprecated)}</td><td><span class="badge danger">DEPRECATED</span></td></tr>
              <tr><td>B 栋侧 6 ft 底板核查</td><td>${esc(REV_B03.eccentricity)}</td><td><span class="badge warn">PENDING SITE CHECK</span></td></tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
    $('jumpPromptsBtn').onclick = () => switchTab('prompts');
  }

  function renderBoq() {
    const cards = BOQ_BASELINES.map((b) => `
      <div class="kpi-card">
        <div class="kpi-label">${esc(bi(b.label_zh, b.label_mm))}</div>
        <div class="kpi-val">${esc(b.concrete)} 混凝土</div>
        <div>垫层 ${esc(b.lean)} · 碎石 ${esc(b.gravel)} · 模板 ${esc(b.formwork)}</div>
        <span class="badge ${b.code === 'GB24' ? 'warn' : ''}">${esc(b.status)}</span>
      </div>
    `).join('');

    $('viewRoot').innerHTML = `
      <div class="card">
        <h2>
          <span>📐 ${esc(bi('双基准工程量对照与完整算量入口', 'BOQ နှိုင်းယှဉ်ချက်'))}</span>
          <a class="btn btn-primary" href="./boq.html">↗ ${esc(bi('打开完整 SMART BOQ (含图纸校准与 XLSX 导出)', 'SMART BOQ အပြည့်အစုံ ဖွင့်ရန်'))}</a>
        </h2>
        <div class="grid-2">${cards}</div>
      </div>

      <div class="card">
        <h2>🧮 ${esc(bi('纯前端离线钢筋重量与定尺试算器 (d² / 162.198)', 'သံချောင်း အလေးချိန် တွက်စက်'))}</h2>
        <form id="rebarForm">
          <div class="form-grid">
            <label class="field">${esc(bi('直径 d (mm)', 'အချင်း (mm)'))}<input type="number" name="dia" value="16" step="any" min="6" max="40" required></label>
            <label class="field">${esc(bi('单根长度 (m)', 'တစ်ချောင်း အရှည် (m)'))}<input type="number" name="len" value="9.2" step="any" min="0.1" max="50" required></label>
            <label class="field">${esc(bi('每构件根数', 'တစ်ခုလျှင် အရေအတွက်'))}<input type="number" name="qpu" value="6" min="1" required></label>
            <label class="field">${esc(bi('构件数', 'အစိတ်အပိုင်း အရေအတွက်'))}<input type="number" name="units" value="32" min="1" required></label>
            <label class="field">${esc(bi('损耗率 (%)', 'အလေအလွင့် (%)'))}<input type="number" name="waste" value="3" step="any" min="0" max="30" required></label>
            <label class="field">${esc(bi('模拟单价 (MMK/kg)', 'ဈေးနှုန်း MMK/kg'))}<input type="number" name="price" value="3600" step="any" min="0" required></label>
          </div>
          <div class="btn-row"><button type="submit" class="btn btn-primary">${esc(bi('浏览器实时计算', 'တွက်ချက်မည်'))}</button></div>
        </form>
        <div id="rebarResult" style="margin-top:12px"></div>
      </div>
    `;

    const calc = () => {
      const fd = new FormData($('rebarForm'));
      const d = Number(fd.get('dia'));
      const len = Number(fd.get('len'));
      const qpu = Number(fd.get('qpu'));
      const units = Number(fd.get('units'));
      const waste = Number(fd.get('waste'));
      const price = Number(fd.get('price'));
      const unitKgM = (d * d) / 162.198;
      const totalBars = qpu * units;
      const netLen = totalBars * len;
      const netKg = netLen * unitKgM;
      const grossKg = netKg * (1 + waste / 100);
      const bars12 = Math.ceil((netLen * (1 + waste / 100)) / 12);
      const est = Math.round(grossKg * price);
      $('rebarResult').innerHTML = `
        <div class="notice ok">
          总根数：<strong>${fmtNum(totalBars)} 根</strong> · 净长：<strong>${netLen.toFixed(2)} m</strong> ·
          理论净重：<strong>${netKg.toFixed(2)} kg</strong> · 含损耗毛重：<strong>${grossKg.toFixed(2)} kg</strong> ·
          折合 12m 定尺约 <strong>${fmtNum(bars12)} 根</strong> · 模拟估算：<strong>${fmtNum(est)} MMK</strong>
          <br><small>公式：kg = 总根数 × 单根长 × (d² / 162.198) | FOR DISCUSSION ONLY</small>
        </div>`;
    };
    $('rebarForm').onsubmit = (e) => { e.preventDefault(); calc(); };
    calc();
  }

  function renderNotes() {
    const drafts = loadDrafts();
    const today = new Date().toISOString().slice(0, 10);
    const rows = drafts.map((d, idx) => `
      <tr>
        <td>${esc(d.date)}</td>
        <td><span class="badge">${esc(d.branch)}</span></td>
        <td>${esc(d.kind)}</td>
        <td>${esc(d.title)}</td>
        <td>${esc(d.qty || '-')}</td>
        <td>${esc(d.note || '-')}</td>
        <td><button type="button" class="btn btn-danger" data-del-idx="${idx}">${esc(bi('删除', 'ဖျက်'))}</button></td>
      </tr>
    `).join('');

    $('viewRoot').innerHTML = `
      <div class="notice">ℹ️ ${esc(bi('纯浏览器本地缓存（localStorage）草稿本：仅保存在当前手机/电脑浏览器，不上传服务器、不涉及任何正式财务账本。', 'ဤမှတ်တမ်းများကို လက်ရှိစက်၏ Browser တွင်သာ သိမ်းဆည်းပါသည်။'))}</div>
      <div class="card">
        <h2>➕ ${esc(bi('新增现场演练 / 盘点 / 备忘草稿', 'ယာယီမှတ်တမ်းအသစ် ထည့်ရန်'))}</h2>
        <form id="noteForm">
          <div class="form-grid">
            <label class="field">${esc(bi('日期', 'ရက်စွဲ'))}<input type="date" name="date" value="${today}" required></label>
            <label class="field">${esc(bi('工程分支', 'အပိုင်း'))}
              <select name="branch"><option>F1</option><option>C1</option><option>R-AB</option><option>全厂通用</option></select>
            </label>
            <label class="field">${esc(bi('类型', 'အမျိုးအစား'))}
              <select name="kind"><option>现场复测</option><option>物料盘点草稿</option><option>询价模拟</option><option>会议备忘</option></select>
            </label>
            <label class="field">${esc(bi('事项摘要 (中文 / 缅文)', 'အကြောင်းအရာ'))}<input name="title" required placeholder="例如：B栋侧 6ft 底板现场开挖核对"></label>
            <label class="field">${esc(bi('数量 / 尺寸', 'အရေအတွက် / အတိုင်းအတာ'))}<input name="qty" placeholder="如 2 ft / 500 kg"></label>
            <label class="field">${esc(bi('备注', 'မှတ်ချက်'))}<input name="note" placeholder="经手人 / 核实状态"></label>
          </div>
          <div class="btn-row">
            <button type="submit" class="btn btn-primary">${esc(bi('保存到本机浏览器', 'သိမ်းဆည်းမည်'))}</button>
            <button type="button" class="btn" id="exportCsvBtn">⬇️ ${esc(bi('导出 CSV (UTF-8 BOM)', 'CSV ဒေါင်းလုဒ်'))}</button>
          </div>
        </form>
      </div>

      <div class="card">
        <h2>📋 ${esc(bi('本机浏览器草稿清单', 'ယာယီမှတ်တမ်း စာရင်း'))} (${drafts.length})</h2>
        <div class="table-wrap">
          <table>
            <thead><tr><th>日期</th><th>分支</th><th>类型</th><th>摘要</th><th>数量/尺寸</th><th>备注</th><th>操作</th></tr></thead>
            <tbody>${rows || '<tr><td colspan="7" style="color:var(--muted)">暂无记录</td></tr>'}</tbody>
          </table>
        </div>
      </div>
    `;

    $('noteForm').onsubmit = (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const list = loadDrafts();
      list.unshift(Object.fromEntries(fd.entries()));
      saveDrafts(list);
      toast('已保存到本机浏览器缓存');
      renderNotes();
    };

    document.querySelectorAll('[data-del-idx]').forEach((b) => {
      b.onclick = () => {
        const list = loadDrafts();
        list.splice(Number(b.dataset.delIdx), 1);
        saveDrafts(list);
        toast('已删除');
        renderNotes();
      };
    });

    $('exportCsvBtn').onclick = () => {
      const list = loadDrafts();
      const lines = ['date,branch,kind,title,qty,note'];
      list.forEach((r) => {
        lines.push([r.date, r.branch, r.kind, r.title, r.qty, r.note].map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','));
      });
      const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
      const u = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = u;
      a.download = 'WIN_CROWN_STATIC_DRAFTS.csv';
      a.click();
      setTimeout(() => URL.revokeObjectURL(u), 1000);
    };
  }

  async function renderPrompts() {
    const data = await loadPresets();
    const presets = data.presets || [];
    const neg = data.default_negative_prompt || '';

    const cards = presets.map((pr, idx) => `
      <div class="kpi-card">
        <div style="display:flex;justify-content:space-between;gap:8px;align-items:center">
          <strong>${esc(bi(pr.title_zh, pr.title_mm))}</strong>
          <span class="badge ok">${esc(pr.badge)}</span>
        </div>
        <p style="margin:8px 0 6px;color:var(--muted)">${esc(pr.prompt_zh)}</p>
        <div class="mono" style="background:var(--surface-2);padding:10px;border-radius:8px;border:1px solid var(--border)">${esc(pr.prompt_en)}</div>
        <div class="btn-row">
          <button type="button" class="btn btn-primary" data-copy-en="${idx}">📋 ${esc(bi('复制英文 Prompt', 'Prompt ကူးယူမည်'))}</button>
          <span class="badge">${esc(pr.recommended_size)} · ${esc(pr.recommended_steps)} steps</span>
        </div>
      </div>
    `).join('');

    $('viewRoot').innerHTML = `
      <div class="card">
        <h2>🎨 ${esc(bi('《WIN_CROWN 钢结构厂房工业风概念图》标准中英提示词库', 'WIN_CROWN စက်ရုံ ပုံထုတ် နမူနာများ'))}</h2>
        <div class="notice">纯静态版本可直接一键复制英文提示词到任意生图工具；不包含本地端口或私密密钥配置。</div>
        <div class="grid-2">${cards}</div>
        ${neg ? `<div style="margin-top:14px"><h3>通用负向排除词 (Negative Prompt)</h3><div class="mono" style="background:var(--surface-2);padding:10px;border-radius:8px;border:1px solid var(--border)">${esc(neg)}</div></div>` : ''}
      </div>
    `;

    document.querySelectorAll('[data-copy-en]').forEach((btn) => {
      btn.onclick = async () => {
        const pr = presets[Number(btn.dataset.copyEn)];
        if (!pr) return;
        try {
          await navigator.clipboard.writeText(pr.prompt_en);
          toast('已复制英文 Prompt：' + pr.badge);
        } catch {
          toast('请手动长按选中复制');
        }
      };
    });
  }

  function renderAbout() {
    $('viewRoot').innerHTML = `
      <div class="card">
        <h2>🛡️ ${esc(bi('静态展示版安全与工程边界说明', 'လုံခြုံရေးနှင့် အသုံးပြုမှု စည်းမျဉ်းများ'))}</h2>
        <div class="notice lock">
          <strong>FOR DISCUSSION ONLY — NOT FOR CONSTRUCTION</strong><br>
          本页面所有几何基准、算量模板与提示词仅供项目讨论、汇报与算量演练；正式施工放行须以现场复测与责任工程师签章图纸为准。
        </div>
        <ul style="padding-left:20px">
          <li>本静态站为纯前端发布版（适配 Cloudflare Pages），已剥离所有后端接口、本地端口、内网地址、磁盘路径及私密凭据。</li>
          <li>所有算量与备忘数据仅保存在当前设备浏览器的 <code>localStorage</code> 中，支持一键导出 CSV / XLSX / JSON 及打印水印报告。</li>
          <li>正式财务账本与原始历史工程档案均在外部独立隔离保护，不纳入公开前端静态仓库。</li>
        </ul>
      </div>
    `;
  }

  document.querySelectorAll('.lang-switch button').forEach((btn) => {
    btn.onclick = () => {
      state.lang = btn.dataset.lang;
      document.querySelectorAll('.lang-switch button').forEach((b) => b.classList.toggle('active', b === btn));
      switchTab(state.tab);
    };
  });

  renderNav();
  switchTab('overview');
})();
