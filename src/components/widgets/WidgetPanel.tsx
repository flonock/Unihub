'use client';

import React, { useState, useEffect } from 'react';

export default function WidgetPanel({ appConfig }: { appConfig: any }) {
  const [activeWidget, setActiveWidget] = useState(0);
  const widgetNames = ["Pomodoro", "Converter", "Astro Clock", "Data Encoder", "Telemetry"];

  // Widget 0: Pomodoro
  const [pomoTime, setPomoTime] = useState(1500);
  const [pomoActive, setPomoActive] = useState(false);
  const [pomoMode, setPomoMode] = useState<'WORK' | 'BREAK'>('WORK');

  // Widget 1: Converter
  const [convValue, setConvValue] = useState('1');
  const [convType, setConvType] = useState('lb_to_kg');

  // Widget 2: Astro Clock
  const [jd, setJd] = useState('');
  const [utc, setUtc] = useState('');

  // Widget 3: Data Encoder
  const [encInput, setEncInput] = useState('AEROSPACE');
  const [encMode, setEncMode] = useState<'HEX' | 'BIN'>('HEX');

  // Widget 4: Telemetry
  const [pingData, setPingData] = useState<number[]>([12, 14, 15, 12, 18, 11, 13, 14, 16, 12]);

  useEffect(() => {
    let int: NodeJS.Timeout;
    if (pomoActive && pomoTime > 0) {
       int = setInterval(() => setPomoTime(p => p - 1), 1000);
    } else if (pomoTime === 0) {
       setPomoActive(false);
       if (appConfig?.enableFlicker) {
           document.body.style.animation = 'flicker 0.2s 5';
           setTimeout(() => document.body.style.animation = '', 1000);
       }
       alert(pomoMode === 'WORK' ? 'Work block complete. Take a break!' : 'Break complete. Back to work!');
    }
    return () => clearInterval(int);
  }, [pomoActive, pomoTime, pomoMode, appConfig]);

  useEffect(() => {
     const int = setInterval(() => {
         const now = new Date();
         setUtc(now.toISOString().substring(11, 19) + ' Z');
         const julian = (now.getTime() / 86400000) + 2440587.5;
         setJd(julian.toFixed(5));
     }, 1000);
     return () => clearInterval(int);
  }, []);

  useEffect(() => {
      const int = setInterval(() => {
          setPingData(prev => {
              const nd = [...prev];
              nd.shift();
              nd.push(10 + Math.floor(Math.random() * 15));
              return nd;
          });
      }, 2000);
      return () => clearInterval(int);
  }, []);

  let convertedValue = '--';
  const cv = parseFloat(convValue);
  if (!isNaN(cv)) {
      switch (convType) {
          case 'lb_to_kg': convertedValue = (cv * 0.453592).toFixed(2) + ' kg'; break;
          case 'kg_to_lb': convertedValue = (cv * 2.20462).toFixed(2) + ' lb'; break;
          case 'mi_to_km': convertedValue = (cv * 1.60934).toFixed(2) + ' km'; break;
          case 'km_to_mi': convertedValue = (cv * 0.621371).toFixed(2) + ' mi'; break;
          case 'f_to_c': convertedValue = ((cv - 32) * 5/9).toFixed(2) + ' °C'; break;
          case 'c_to_f': convertedValue = ((cv * 9/5) + 32).toFixed(2) + ' °F'; break;
          case 'psi_to_pa': convertedValue = (cv * 6894.76).toFixed(0) + ' Pa'; break;
          case 'pa_to_psi': convertedValue = (cv / 6894.76).toFixed(4) + ' psi'; break;
          case 'sec_to_hr': convertedValue = (cv / 3600).toFixed(4) + ' hr'; break;
          case 'hr_to_sec': convertedValue = (cv * 3600).toFixed(0) + ' s'; break;
          case 'day_to_hr': convertedValue = (cv * 24).toFixed(1) + ' hr'; break;
          case 'hr_to_day': convertedValue = (cv / 24).toFixed(4) + ' day'; break;
          case 'j_to_cal': convertedValue = (cv / 4.184).toFixed(2) + ' cal'; break;
          case 'cal_to_j': convertedValue = (cv * 4.184).toFixed(2) + ' J'; break;
          case 'w_to_hp': convertedValue = (cv / 745.7).toFixed(4) + ' hp'; break;
          case 'hp_to_w': convertedValue = (cv * 745.7).toFixed(2) + ' W'; break;
          case 'm_s_to_km_h': convertedValue = (cv * 3.6).toFixed(2) + ' km/h'; break;
          case 'km_h_to_m_s': convertedValue = (cv / 3.6).toFixed(2) + ' m/s'; break;
      }
  }

  let encodedValue = '';
  if (encMode === 'HEX') {
      encodedValue = Array.from(encInput).map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join(' ').toUpperCase();
  } else {
      encodedValue = Array.from(encInput).map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');
  }

  return (
    <div className="widget" style={{marginTop: 'auto'}}>
      <div className="widget-title">
        <span>--- {widgetNames[activeWidget].toUpperCase()} ---</span>
        <div style={{ display: 'flex', gap: '5px', cursor: 'pointer' }}>
          <span onClick={() => setActiveWidget((prev) => (prev - 1 + widgetNames.length) % widgetNames.length)} style={{color: 'var(--foam)'}}>[&lt;]</span>
          <span onClick={() => setActiveWidget((prev) => (prev + 1) % widgetNames.length)} style={{color: 'var(--foam)'}}>[&gt;]</span>
        </div>
      </div>

      {activeWidget === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '5px 0' }}>
           <div style={{ fontSize: '2rem', color: pomoActive ? 'var(--love)' : 'var(--text)', fontWeight: 'bold', textShadow: pomoActive ? '0 0 10px var(--love)' : 'none' }}>
              {Math.floor(pomoTime / 60).toString().padStart(2, '0')}:{(pomoTime % 60).toString().padStart(2, '0')}
           </div>
           <div style={{ display: 'flex', gap: '5px', width: '100%' }}>
              <button className="button" style={{ flex: 1, padding: '4px', fontSize: '0.75rem', borderColor: pomoActive ? 'var(--love)' : 'var(--foam)', color: pomoActive ? 'var(--love)' : 'var(--foam)' }} onClick={() => setPomoActive(!pomoActive)}>
                 {pomoActive ? 'PAUSE' : 'START'}
              </button>
              <button className="button" style={{ flex: 1, padding: '4px', fontSize: '0.75rem' }} onClick={() => { setPomoActive(false); setPomoTime(pomoMode === 'WORK' ? (appConfig?.pomoWorkTime || 25) * 60 : (appConfig?.pomoBreakTime || 5) * 60); }}>
                 RESET
              </button>
           </div>
           <div style={{ display: 'flex', gap: '10px', fontSize: '0.7rem' }}>
              <span style={{ cursor: 'pointer', color: pomoMode === 'WORK' ? 'var(--gold)' : 'var(--subtle)' }} onClick={() => { setPomoMode('WORK'); setPomoActive(false); setPomoTime((appConfig?.pomoWorkTime || 25) * 60); }}>[ WORK ]</span>
              <span style={{ cursor: 'pointer', color: pomoMode === 'BREAK' ? 'var(--gold)' : 'var(--subtle)' }} onClick={() => { setPomoMode('BREAK'); setPomoActive(false); setPomoTime((appConfig?.pomoBreakTime || 5) * 60); }}>[ BREAK ]</span>
           </div>
        </div>
      )}

      {activeWidget === 1 && (
        <div style={{ padding: '5px 0' }}>
          <div style={{display: 'flex', gap: '5px', marginBottom: '8px'}}>
             <input type="number" value={convValue} onChange={e => setConvValue(e.target.value)} style={{ flex: 1, background: 'var(--overlay)', color: 'var(--text)', border: '1px solid var(--muted)', padding: '4px', fontSize: '0.9rem', width: '50%' }} />
             <select value={convType} onChange={e => setConvType(e.target.value)} style={{ flex: 1, background: 'var(--overlay)', color: 'var(--text)', border: '1px solid var(--muted)', padding: '4px', fontSize: '0.8rem', width: '50%', cursor: 'pointer' }}>
                <option value="lb_to_kg">lb &rarr; kg</option>
                <option value="kg_to_lb">kg &rarr; lb</option>
                <option value="mi_to_km">mi &rarr; km</option>
                <option value="km_to_mi">km &rarr; mi</option>
                <option value="f_to_c">°F &rarr; °C</option>
                <option value="c_to_f">°C &rarr; °F</option>
                <option value="psi_to_pa">psi &rarr; Pa</option>
                <option value="pa_to_psi">Pa &rarr; psi</option>
                <option disabled>──────</option>
                <option value="sec_to_hr">sec &rarr; hr</option>
                <option value="hr_to_sec">hr &rarr; sec</option>
                <option value="day_to_hr">day &rarr; hr</option>
                <option value="hr_to_day">hr &rarr; day</option>
                <option disabled>──────</option>
                <option value="j_to_cal">J &rarr; cal</option>
                <option value="cal_to_j">cal &rarr; J</option>
                <option value="w_to_hp">W &rarr; hp</option>
                <option value="hp_to_w">hp &rarr; W</option>
                <option disabled>──────</option>
                <option value="m_s_to_km_h">m/s &rarr; km/h</option>
                <option value="km_h_to_m_s">km/h &rarr; m/s</option>
             </select>
          </div>
          <div style={{ fontSize: '1rem', color: 'var(--pine)', fontWeight: 'bold', textAlign: 'center', padding: '5px', background: 'var(--hl-low)', border: '1px dashed var(--pine)' }}>
             {convertedValue}
          </div>
        </div>
      )}

      {activeWidget === 2 && (
        <div style={{ padding: '10px 0', textAlign: 'center' }}>
          <div style={{fontSize: '0.75rem', color: 'var(--subtle)'}}>UTC TIME</div>
          <div style={{fontSize: '1rem', color: 'var(--foam)', marginBottom: '10px'}}>{utc}</div>
          <div style={{fontSize: '0.75rem', color: 'var(--subtle)'}}>JULIAN DATE</div>
          <div style={{fontSize: '1rem', color: 'var(--rose)'}}>{jd}</div>
        </div>
      )}

      {activeWidget === 3 && (
        <div style={{ padding: '5px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <input value={encInput} onChange={e => setEncInput(e.target.value)} placeholder="Type text..." style={{ width: '100%', background: 'var(--overlay)', color: 'var(--text)', border: '1px solid var(--muted)', padding: '6px', fontSize: '0.8rem' }} />
          <div style={{ display: 'flex', gap: '5px' }}>
              <button className="button" style={{ flex: 1, padding: '4px', fontSize: '0.7rem', borderColor: encMode === 'HEX' ? 'var(--gold)' : 'var(--muted)', color: encMode === 'HEX' ? 'var(--gold)' : 'var(--text)' }} onClick={() => setEncMode('HEX')}>HEX</button>
              <button className="button" style={{ flex: 1, padding: '4px', fontSize: '0.7rem', borderColor: encMode === 'BIN' ? 'var(--gold)' : 'var(--muted)', color: encMode === 'BIN' ? 'var(--gold)' : 'var(--text)' }} onClick={() => setEncMode('BIN')}>BIN</button>
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--iris)', fontFamily: 'monospace', padding: '8px', background: 'var(--hl-low)', border: '1px dashed var(--iris)', wordBreak: 'break-all', maxHeight: '80px', overflowY: 'auto' }}>
             {encodedValue || '...'}
          </div>
        </div>
      )}

      {activeWidget === 4 && (
        <div style={{ padding: '5px 0' }}>
           <div style={{ fontSize: '0.75rem', color: 'var(--subtle)', display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span>UPLINK STATUS</span>
              <span style={{ color: 'var(--pine)', animation: 'blinkCursor 1s infinite' }}>SECURE</span>
           </div>
           <div style={{ display: 'flex', alignItems: 'flex-end', height: '40px', gap: '2px', borderBottom: '1px solid var(--muted)', paddingBottom: '2px' }}>
              {pingData.map((p, i) => (
                 <div key={i} style={{ flex: 1, background: 'var(--foam)', opacity: 0.6 + (p/20)*0.4, height: `${(p/25)*100}%`, transition: 'height 0.2s' }}></div>
              ))}
           </div>
           <div style={{ fontSize: '0.7rem', color: 'var(--subtle)', marginTop: '5px', textAlign: 'right' }}>
              Avg Latency: {Math.round(pingData.reduce((a,b)=>a+b,0)/pingData.length)}ms
           </div>
        </div>
      )}
    </div>
  );
}
