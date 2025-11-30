import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, ComposedChart, ReferenceDot
} from 'recharts';

function App() {
  // --- STATE: BASIC SIMULATION PARAMETERS ---
  const [initialCost, setInitialCost] = useState(2500000); 
  const [economicLimit, setEconomicLimit] = useState(6500000); 
  
  // Growth Rates
  const [ratePhase1, setRatePhase1] = useState(17.6); 
  const [ratePhase2, setRatePhase2] = useState(3.5);
  const [ratePhase3, setRatePhase3] = useState(0.7);

  // --- STATE: INTERVENTION / RE-FORECAST DATA ---
  const [enableIntervention, setEnableIntervention] = useState(false);
  const [interventionYear, setInterventionYear] = useState(3); // Default to Year 3
  const [interventionCost, setInterventionCost] = useState(4000000); // The new "Real" cost

  // --- STATE: RESULTS ---
  const [data, setData] = useState([]);
  const [inflexionYear, setInflexionYear] = useState(null);
  const [adjustedInflexionYear, setAdjustedInflexionYear] = useState(null);

  // --- LOGIC: CALCULATE BOTH CURVES ---
  useEffect(() => {
    const chartData = [];
    
    // Trackers for the "Baseline" (Original Plan)
    let currentBaselineCost = initialCost;
    let foundBaselineInflexion = null;

    // Trackers for the "Adjusted" (Re-forecasted Plan)
    let currentAdjustedCost = interventionCost; 
    let foundAdjustedInflexion = null;

    // Loop: Year 0 to Year 25
    for (let year = 0; year <= 25; year++) {
      
      // 1. DETERMINE GROWTH RATE FOR THIS YEAR
      let appliedRate = 0;
      if (year > 0) {
        if (year <= 6) appliedRate = ratePhase1;
        else if (year <= 12) appliedRate = ratePhase2;
        else appliedRate = ratePhase3;
      }
      const rateMultiplier = 1 + (appliedRate / 100);

      // 2. CALCULATE BASELINE (Always runs 0-25)
      if (year > 0) {
        currentBaselineCost = currentBaselineCost * rateMultiplier;
      }
      // Check Baseline Inflexion
      if (foundBaselineInflexion === null && currentBaselineCost > economicLimit) {
        foundBaselineInflexion = year;
      }

      // 3. CALCULATE ADJUSTED (The "New Data" Curve)
      let adjustedCostForChart = null; // Default is null (don't draw)

      if (enableIntervention) {
        if (year < interventionYear) {
          // Before the change: Don't draw anything (or match baseline if preferred)
          adjustedCostForChart = null; 
        } else if (year === interventionYear) {
          // The exact year of change: Reset cost to User Input
          currentAdjustedCost = interventionCost;
          adjustedCostForChart = currentAdjustedCost;
        } else {
          // Future years: Grow from the NEW cost using the SAME standard rates
          currentAdjustedCost = currentAdjustedCost * rateMultiplier;
          adjustedCostForChart = currentAdjustedCost;
        }

        // Check Adjusted Inflexion
        if (adjustedCostForChart !== null && foundAdjustedInflexion === null && adjustedCostForChart > economicLimit) {
          foundAdjustedInflexion = year;
        }
      }

      // 4. PUSH DATA
      chartData.push({
        year: `Year ${year}`,
        baselineCost: Math.round(currentBaselineCost),
        adjustedCost: adjustedCostForChart ? Math.round(adjustedCostForChart) : null,
        formattedBaseline: (currentBaselineCost / 1000000).toFixed(2) + 'M',
        formattedAdjusted: adjustedCostForChart ? (adjustedCostForChart / 1000000).toFixed(2) + 'M' : '',
      });
    }

    setData(chartData);
    setInflexionYear(foundBaselineInflexion);
    setAdjustedInflexionYear(foundAdjustedInflexion);

  }, [initialCost, economicLimit, ratePhase1, ratePhase2, ratePhase3, enableIntervention, interventionYear, interventionCost]);

  // --- STYLES ---
  const containerStyle = { display: 'flex', minHeight: '100vh', fontFamily: 'Arial, sans-serif', backgroundColor: '#f4f7f6' };
  const sidebarStyle = { width: '320px', backgroundColor: '#2c3e50', color: 'white', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' };
  const mainStyle = { flex: 1, padding: '30px' };
  const inputGroupStyle = { display: 'flex', flexDirection: 'column', gap: '5px' };
  const inputStyle = { padding: '8px', borderRadius: '4px', border: 'none' };
  const cardStyle = { backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '20px' };
  const interventionBoxStyle = { backgroundColor: '#34495e', padding: '15px', borderRadius: '8px', border: '1px solid #f1c40f' };

  return (
    <div style={containerStyle}>
      
      {/* --- SIDEBAR --- */}
      <aside style={sidebarStyle}>
        <h2 style={{ fontSize: '1.2rem', borderBottom: '1px solid #7f8c8d', paddingBottom: '10px' }}>
          Simulation Parameters
        </h2>

        {/* 1. ORIGINAL PLAN */}
        <div style={inputGroupStyle}>
          <label>Initial Annual Cost ($)</label>
          <input type="number" style={inputStyle} value={initialCost} onChange={(e) => setInitialCost(Number(e.target.value))} />
        </div>

        <div style={inputGroupStyle}>
          <label>Economic Limit ($)</label>
          <input type="number" style={inputStyle} value={economicLimit} onChange={(e) => setEconomicLimit(Number(e.target.value))} />
        </div>

        <hr style={{ width: '100%', borderColor: '#7f8c8d' }} />

        {/* 2. RE-FORECAST / INTERVENTION */}
        <div style={interventionBoxStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <strong style={{ color: '#f1c40f' }}>Re-forecast Data</strong>
            <input 
              type="checkbox" 
              checked={enableIntervention} 
              onChange={(e) => setEnableIntervention(e.target.checked)} 
              style={{ transform: 'scale(1.5)' }}
            />
          </div>
          
          {enableIntervention && (
            <>
              <div style={{ ...inputGroupStyle, marginBottom: '10px' }}>
                <label style={{ fontSize: '0.9rem' }}>At which Year?</label>
                <input 
                  type="number" 
                  min="1" max="24"
                  style={inputStyle} 
                  value={interventionYear} 
                  onChange={(e) => setInterventionYear(Number(e.target.value))} 
                />
              </div>
              <div style={inputGroupStyle}>
                <label style={{ fontSize: '0.9rem' }}>New Actual Cost ($)</label>
                <input 
                  type="number" 
                  style={inputStyle} 
                  value={interventionCost} 
                  onChange={(e) => setInterventionCost(Number(e.target.value))} 
                />
              </div>
              <small style={{ marginTop: '10px', display: 'block', color: '#bdc3c7', fontSize: '0.8rem' }}>
                This creates a new projection curve starting from Year {interventionYear}.
              </small>
            </>
          )}
        </div>

        {/* 3. GROWTH RATES */}
        <h3>Standard Growth (%)</h3>
        <div style={inputGroupStyle}>
          <label>Phase 1 (Y 1-6)</label>
          <input type="number" step="0.1" style={inputStyle} value={ratePhase1} onChange={(e) => setRatePhase1(Number(e.target.value))} />
        </div>
        <div style={inputGroupStyle}>
          <label>Phase 2 (Y 7-12)</label>
          <input type="number" step="0.1" style={inputStyle} value={ratePhase2} onChange={(e) => setRatePhase2(Number(e.target.value))} />
        </div>
        <div style={inputGroupStyle}>
          <label>Phase 3 (Y 13+)</label>
          <input type="number" step="0.1" style={inputStyle} value={ratePhase3} onChange={(e) => setRatePhase3(Number(e.target.value))} />
        </div>
      </aside>

      {/* --- MAIN DASHBOARD --- */}
      <main style={mainStyle}>
        <header style={{ marginBottom: '20px' }}>
          <h1 style={{ color: '#2c3e50', margin: 0 }}>Fleet Degradation Simulator</h1>
          <p style={{ color: '#7f8c8d' }}>MRO Cost Projection & Re-forecasting</p>
        </header>

        {/* COMPARISON RESULT CARD */}
        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 15px 0' }}>Economic Inflexion Analysis</h3>
          
          <div style={{ display: 'flex', gap: '40px' }}>
{/* Original Result */}
            <div style={{ opacity: enableIntervention ? 0.5 : 1 }}>
              <div style={{ fontSize: '0.9rem', color: '#7f8c8d' }}>Original Forecast Limit</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: enableIntervention ? '#95a5a6' : '#c0392b' }}>
                {/* FIX: Check explicitly for null, so Year 0 is displayed correctly */}
                {inflexionYear !== null ? `Year ${inflexionYear}` : 'Safe'}
              </div>
            </div>

            {/* Adjusted Result (Only shows if toggle is ON) */}
            {enableIntervention && (
              <div style={{ borderLeft: '2px solid #eee', paddingLeft: '40px' }}>
                 <div style={{ fontSize: '0.9rem', color: '#2980b9' }}>Adjusted Forecast Limit</div>
                 <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#2980b9' }}>
                   {/* FIX: Check explicitly for null here too */}
                   {adjustedInflexionYear !== null ? `Year ${adjustedInflexionYear}` : 'Safe'}
                 </div>
                 <div style={{ fontSize: '0.8rem', color: '#27ae60', marginTop: '5px' }}>
                   Based on new data from Year {interventionYear}
                 </div>
              </div>
            )}
          </div>
        </div>

        {/* CHART AREA */}
        <div style={{ ...cardStyle, height: '500px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis tickFormatter={(val) => `$${val/1000000}M`} />
              <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
              <Legend verticalAlign="top" height={36}/>
              
              <ReferenceLine y={economicLimit} label="Limit" stroke="red" strokeDasharray="5 5" />
              
              {/* 1. BASELINE CURVE (Changes to Gray/Dashed if intervention is ON) */}
              <Line 
                type="monotone" 
                dataKey="baselineCost" 
                name="Original Plan" 
                stroke={enableIntervention ? "#bdc3c7" : "#c0392b"} 
                strokeWidth={enableIntervention ? 2 : 3}
                strokeDasharray={enableIntervention ? "5 5" : ""} 
                dot={!enableIntervention}
              />

              {/* 2. ADJUSTED CURVE (Only visible if enabled) */}
              {enableIntervention && (
                <Line 
                  type="monotone" 
                  dataKey="adjustedCost" 
                  name="Re-forecasted (Actual)" 
                  stroke="#2980b9" 
                  strokeWidth={4}
                  activeDot={{ r: 8 }}
                />
              )}

              {/* 3. VISUAL DOT to mark the change */}
              {enableIntervention && (
                <ReferenceDot x={`Year ${interventionYear}`} y={interventionCost} r={6} fill="#f1c40f" stroke="none" />
              )}
              
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </main>
    </div>
  );
}

export default App;