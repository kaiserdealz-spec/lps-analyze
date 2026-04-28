import { useState, useEffect } from 'react';
import './App.css';

const SCENARIOS = [
  {
    id: 'standard',
    title: 'Standard Processing',
    desc: 'Interchange-plus. Best for in-person — contractors, retail, service businesses.',
    rate: 0.0199,
    txn: 0.10,
    mo: 10,
  },
  {
    id: 'cash',
    title: 'Cash Discount',
    desc: 'Non-cash adjustment passed to cardholder. Near-zero cost for the merchant.',
    rate: 0,
    txn: 0,
    mo: 10,
    surcharge: 0.04,
  },
  {
    id: 'flat',
    title: 'Square / Stripe Flat Rate',
    desc: 'Simple flat-rate pricing for eCommerce, subscriptions, and digital services.',
    rate: 0.029,
    txn: 0.30,
    mo: 0,
  },
  {
    id: 'ecomm',
    title: 'Online / eCommerce',
    desc: 'Optimized interchange-plus for card-not-present and online transactions.',
    rate: 0.0249,
    txn: 0.15,
    mo: 15,
  },
];

const fmt$ = (n) =>
  isNaN(n) || n === undefined
    ? '—'
    : '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtPct = (n) => (isNaN(n) ? '—' : (n * 100).toFixed(2) + '%');

export default function App() {
  const [tab, setTab] = useState('analyzer');
  const [scen, setScen] = useState('standard');
  const [f, setF] = useState({
    biz: '', proc: '', vol: '', txns: '', tick: '', crate: '', cmo: '', ctxn: '',
  });
  const [results, setResults] = useState(null);

  const num = (k) => parseFloat(f[k]) || 0;

  const set = (k) => (e) => {
    const v = e.target.value;
    setF((prev) => {
      const next = { ...prev, [k]: v };
      if (k === 'vol' || k === 'txns') {
        const vol = parseFloat(k === 'vol' ? v : prev.vol) || 0;
        const txns = parseFloat(k === 'txns' ? v : prev.txns) || 0;
        if (vol && txns) next.tick = (vol / txns).toFixed(2);
      }
      return next;
    });
  };

  useEffect(() => {
    const vol = num('vol'), txns = num('txns');
    const cr = num('crate') / 100, cmo = num('cmo'), ctx = num('ctxn');
    if (!vol || !txns) { setResults(null); return; }

    const s = SCENARIOS.find((x) => x.id === scen);
    const curTotal = vol * cr + txns * ctx + cmo;
    const curEff = curTotal / vol;

    let propProc, propTxn, propTotal, note;
    if (s.id === 'cash') {
      propProc = 0; propTxn = 0; propTotal = s.mo;
      note = '4% non-cash adjustment applied to cardholder — merchant pays only the monthly fee';
    } else {
      propProc = vol * s.rate; propTxn = txns * s.txn; propTotal = propProc + propTxn + s.mo;
      note = null;
    }
    const propEff = propTotal / vol;
    const save = curTotal - propTotal;

    setResults({
      vol, txns, avgTick: vol / txns,
      curTotal, curEff, curProc: vol * cr, curTxn: txns * ctx, curMo: cmo,
      propTotal, propEff, propProc, propTxn, propMo: s.mo,
      save, aSave: save * 12, pSave: curTotal > 0 ? save / curTotal : 0,
      note, sLabel: s.title,
      sRate: s.id === 'cash' ? '~0.00%' : fmtPct(s.rate),
      sTxn: s.id === 'cash' ? '$0.00' : fmt$(s.txn),
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f, scen]);

  const hasData = num('vol') > 0 && num('txns') > 0;

  return (
    <div className="app">
      {/* ── Header ── */}
      <div className="hdr">
        <div className="hdr-logo">LPS</div>
        <div>
          <div className="hdr-title">Louisville Payment Specialists</div>
          <div className="hdr-sub">MERCHANT ANALYSIS TOOL · BETTER PAYMENTS. BETTER BUSINESS.</div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="tabs">
        {[['analyzer', 'Cost Analyzer'], ['compare', 'Scenario Compare'], ['summary', 'Client Summary']].map(([id, label]) => (
          <button key={id} className={`tab ${tab === id ? 'on' : ''}`} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      {/* ══ ANALYZER ══ */}
      {tab === 'analyzer' && (
        <div>
          <div className="card">
            <div className="card-title">Merchant Information</div>
            <div className="g2">
              <Field label="Business Name"><input className="inp" placeholder="e.g. Donnie's Roofing LLC" value={f.biz} onChange={set('biz')} /></Field>
              <Field label="Current Processor"><input className="inp" placeholder="e.g. Square, Stripe, First Data…" value={f.proc} onChange={set('proc')} /></Field>
            </div>
          </div>

          <div className="card">
            <div className="card-title">Monthly Processing Volume</div>
            <div className="g3">
              <Field label="Monthly Volume"><Pfx><input className="inp" type="number" placeholder="0.00" value={f.vol} onChange={set('vol')} /></Pfx></Field>
              <Field label="Transactions / Mo"><input className="inp" type="number" placeholder="0" value={f.txns} onChange={set('txns')} /></Field>
              <Field label="Average Ticket"><Pfx><input className="inp" type="number" placeholder="auto" value={f.tick} onChange={set('tick')} /></Pfx></Field>
            </div>
          </div>

          <div className="card">
            <div className="card-title">Current Fees</div>
            <div className="g3">
              <Field label="Effective Rate (%)"><PfxPct><input className="inp" type="number" step="0.01" placeholder="e.g. 2.75" value={f.crate} onChange={set('crate')} /></PfxPct></Field>
              <Field label="Monthly Fee"><Pfx><input className="inp" type="number" placeholder="0.00" value={f.cmo} onChange={set('cmo')} /></Pfx></Field>
              <Field label="Per-Transaction Fee"><Pfx><input className="inp" type="number" step="0.01" placeholder="0.10" value={f.ctxn} onChange={set('ctxn')} /></Pfx></Field>
            </div>
          </div>

          <div className="card">
            <div className="card-title">LPS Recommended Scenario</div>
            <div className="sg">
              {SCENARIOS.map((s) => (
                <div key={s.id} className={`sc ${scen === s.id ? 'on' : ''}`} onClick={() => setScen(s.id)}>
                  <div className="sc-t">{s.title}</div>
                  <div className="sc-d">{s.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {hasData && results ? (
            <div className="fade-up">
              {results.save > 0 ? (
                <div className="sbanner">
                  <div>
                    <div className="slbl">Monthly Savings</div>
                    <div className="sbig">{fmt$(results.save)}</div>
                    <div className="syr">First Year: {fmt$(results.aSave)} saved</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="slbl">% Reduction</div>
                    <div className="sbig">{(results.pSave * 100).toFixed(0)}%</div>
                    <div className="syr">vs current processor</div>
                  </div>
                </div>
              ) : (
                <div className="warn">Based on the rates entered, the current processor may already be competitive for this scenario. Try a different scenario or verify the current rate.</div>
              )}

              <div className="card">
                <div className="card-title">Analysis Results — {results.sLabel}</div>
                {results.note && <div className="note">⚡ {results.note}</div>}
                <div className="g3r">
                  <Stat label="Current Monthly Cost" value={fmt$(results.curTotal)} sub={`Eff. rate ${fmtPct(results.curEff)}`} color="red" />
                  <Stat label="LPS Monthly Cost" value={fmt$(results.propTotal)} sub={`Eff. rate ${fmtPct(results.propEff)}`} color="green" />
                  <Stat label="Monthly Savings" value={fmt$(Math.abs(results.save))} sub={results.save > 0 ? 'Savings' : 'Additional cost'} color={results.save > 0 ? 'gold' : 'red'} />
                  <Stat label="First Year Savings" value={fmt$(Math.abs(results.aSave))} sub="12-month projection" color={results.aSave > 0 ? 'gold' : 'red'} />
                  <Stat label="LPS Rate" value={results.sRate} sub={`+ ${results.sTxn} / txn`} color="gold" />
                  <Stat label="Average Ticket" value={fmt$(results.avgTick)} sub={`${results.txns.toLocaleString()} transactions`} color="gold" />
                </div>

                <div className="divd" />

                <table className="tbl">
                  <thead>
                    <tr><th>Fee Component</th><th>Current</th><th>LPS Proposed</th><th>Difference</th></tr>
                  </thead>
                  <tbody>
                    {[
                      ['Processing Fees', results.curProc, results.propProc],
                      ['Per-Transaction Fees', results.curTxn, results.propTxn],
                      ['Monthly Fee', results.curMo, results.propMo],
                      ['Total Monthly', results.curTotal, results.propTotal],
                    ].map(([label, cur, prop]) => {
                      const diff = cur - prop;
                      return (
                        <tr key={label} style={label === 'Total Monthly' ? { background: 'rgba(255,255,255,0.025)' } : {}}>
                          <td className="td-metric">{label}</td>
                          <td className="td-cur">{fmt$(cur)}</td>
                          <td className="td-pro">{fmt$(prop)}</td>
                          <td className="td-dif" style={{ color: diff > 0 ? 'var(--gn)' : diff < 0 ? 'var(--rd)' : 'var(--gr)' }}>
                            {diff > 0 ? '+' : ''}{fmt$(diff)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <CTA biz={f.biz} aSave={results.aSave} />
            </div>
          ) : (
            <div className="ph">
              <h3>Enter Merchant Details Above</h3>
              <p>Fill in monthly volume, transaction count, and current fees<br />to see your instant cost comparison.</p>
            </div>
          )}
        </div>
      )}

      {/* ══ COMPARE ══ */}
      {tab === 'compare' && (
        <div className="card">
          <div className="card-title">All Scenario Comparison</div>
          {!hasData ? (
            <div className="ph"><h3>Enter data in the Analyzer tab first</h3><p>Monthly volume and transaction count required.</p></div>
          ) : (() => {
            const vol = num('vol'), txns = num('txns'), cr = num('crate') / 100, cmo = num('cmo'), ctx = num('ctxn');
            const curTotal = vol * cr + txns * ctx + cmo;
            return (
              <div style={{ overflowX: 'auto' }}>
                <table className="tbl" style={{ tableLayout: 'fixed', minWidth: 520 }}>
                  <thead>
                    <tr><th style={{ width: '26%' }}>Scenario</th><th>Monthly Cost</th><th>Eff. Rate</th><th>Mo. Savings</th><th>First Year</th></tr>
                  </thead>
                  <tbody>
                    <tr style={{ background: 'rgba(232,74,74,.05)' }}>
                      <td><div style={{ fontWeight: 600, fontSize: 12 }}>Current Processor</div><div style={{ fontSize: 10, color: 'var(--gr)' }}>{f.proc || '—'}</div></td>
                      <td className="td-cur">{fmt$(curTotal)}</td>
                      <td style={{ color: 'var(--rd)', fontWeight: 700, fontSize: 14 }}>{fmtPct(cr)}</td>
                      <td style={{ color: 'var(--gr)' }}>—</td>
                      <td style={{ color: 'var(--gr)' }}>—</td>
                    </tr>
                    {SCENARIOS.map((s) => {
                      const pt = s.id === 'cash' ? s.mo : vol * s.rate + txns * s.txn + s.mo;
                      const sv = curTotal - pt;
                      const isSel = scen === s.id;
                      return (
                        <tr key={s.id} style={isSel ? { background: 'rgba(201,160,0,.05)' } : {}}>
                          <td>
                            <div style={{ fontWeight: 600, fontSize: 12, color: isSel ? 'var(--gh)' : 'var(--wh)' }}>
                              {s.title}{isSel && <span className="badge-sel">SELECTED</span>}
                            </div>
                          </td>
                          <td className="td-pro">{fmt$(pt)}</td>
                          <td style={{ color: 'var(--gn)', fontWeight: 700, fontSize: 14 }}>{s.id === 'cash' ? '~0.00%' : fmtPct(s.rate)}</td>
                          <td style={{ color: sv > 0 ? 'var(--gn)' : 'var(--rd)', fontWeight: 700, fontSize: 14 }}>{sv > 0 ? '+' : ''}{fmt$(sv)}</td>
                          <td style={{ color: 'var(--gh)', fontWeight: 700, fontSize: 14 }}>{sv > 0 ? fmt$(sv * 12) : '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </div>
      )}

      {/* ══ SUMMARY ══ */}
      {tab === 'summary' && (
        <div className="card">
          <div className="card-title">Client Summary</div>
          {!hasData || !results ? (
            <div className="ph"><h3>Complete the Analyzer first</h3><p>This tab generates a shareable summary once analysis is complete.</p></div>
          ) : (
            <>
              <div className="sum-hdr">
                <div>
                  <div className="sum-biz">{f.biz || 'Your Business'}</div>
                  <div style={{ fontSize: 11, color: 'var(--gr)', marginTop: 2 }}>Merchant Cost Analysis — Louisville Payment Specialists</div>
                </div>
                <span className="badge-gold">{results.sLabel}</span>
              </div>

              <div className="g2" style={{ marginBottom: 16 }}>
                {[['Monthly Volume', fmt$(results.vol)], ['Transactions / Mo', results.txns.toLocaleString()], ['Average Ticket', fmt$(results.avgTick)], ['Current Processor', f.proc || '—']].map(([l, v]) => (
                  <div key={l} className="sum-stat"><div className="sum-stat-l">{l}</div><div className="sum-stat-v">{v}</div></div>
                ))}
              </div>

              <div className="divd" />

              <div className="g3" style={{ marginBottom: 16 }}>
                <div className="sum-box red-box"><div className="sum-box-l">Current Cost</div><div className="sum-box-v" style={{ color: 'var(--rd)' }}>{fmt$(results.curTotal)}</div><div className="sum-box-s">/month</div></div>
                <div className="sum-box gn-box"><div className="sum-box-l">LPS Cost</div><div className="sum-box-v" style={{ color: 'var(--gn)' }}>{fmt$(results.propTotal)}</div><div className="sum-box-s">/month</div></div>
                <div className="sum-box gd-box"><div className="sum-box-l">You Save</div><div className="sum-box-v sum-save-v">{fmt$(results.save)}</div><div className="sum-box-s">/month</div></div>
              </div>

              <div className="sum-metrics">
                {[['First Year Savings', fmt$(results.aSave)], ['LPS Effective Rate', fmtPct(results.propEff)], ['Current Effective Rate', fmtPct(results.curEff)], ['% Cost Reduction', (results.pSave * 100).toFixed(1) + '%']].map(([l, v]) => (
                  <div key={l}><div className="sum-m-l">{l}</div><div className="sum-m-v">{v}</div></div>
                ))}
              </div>

              <CTA biz={f.biz} aSave={results.aSave} />
            </>
          )}
        </div>
      )}

      <div className="footer">
        <div className="footer-logo">LOUISVILLE PAYMENT SPECIALISTS</div>
        <p>Better Payments. Better Business. · Local Support. Real Savings. · Louisville, KY</p>
      </div>
    </div>
  );
}

// ── Small components ─────────────────────────────────────────
function Field({ label, children }) {
  return <div className="field"><label className="lbl">{label}</label>{children}</div>;
}
function Pfx({ children }) {
  return <div className="pfx"><span className="px">$</span>{children}</div>;
}
function PfxPct({ children }) {
  return <div className="pfx"><span className="px" style={{ color: 'var(--grl)' }}>%</span>{children}</div>;
}
function Stat({ label, value, sub, color }) {
  return (
    <div className="stat">
      <div className="sl">{label}</div>
      <div className={`sv ${color}`}>{value}</div>
      <div className="ss">{sub}</div>
    </div>
  );
}
function CTA({ biz, aSave }) {
  return (
    <div className="cta">
      <h3>Let's Fix That.</h3>
      <p>{biz || 'Your business'} could save {fmt$(aSave)} in the first year alone.<br />Louisville Payment Specialists — Local support. Real savings. No gotchas.</p>
      <a className="cta-btn" href="mailto:info@louisvillepaymentspecialists.com">Book a Free Review</a>
    </div>
  );
}
