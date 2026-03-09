import { useState, useEffect } from "react";

// ─── Storage ──────────────────────────────────────────────────────────────────
const DATA_VERSION = "v7";
const db = {
  async get(k)   { try { const v=localStorage.getItem(k); return v?JSON.parse(v):null; } catch{return null;} },
  async set(k,v) { try { localStorage.setItem(k,JSON.stringify(v)); } catch{} },
};

// ─── Roadmap Algorithm ────────────────────────────────────────────────────────
function buildRoadmap(reqs, xferCodes) {
  const SEMS = ["Sophomore · Fall","Sophomore · Spring","Junior · Fall","Junior · Spring","Senior · Fall","Senior · Spring"];
  const remaining = reqs.filter(r => !xferCodes.has(r.code) && !xferCodes.has(r.equiv));
  const sorted = [...remaining].sort((a,b) => (a.semHint||9)-(b.semHint||9) || a.code.localeCompare(b.code));
  const out = []; let idx=0, cr=0, items=[];
  for (const r of sorted) {
    const c = r.credits||3;
    if (cr+c > 16 && items.length) { out.push({sem:SEMS[idx]||`Semester ${idx+1}`,courses:items}); idx++; items=[]; cr=0; }
    items.push({code:r.code, name:r.name, credits:c});
    cr+=c;
  }
  if (items.length) out.push({sem:SEMS[idx]||`Semester ${idx+1}`,courses:items});
  return out;
}

// ─── Seed Data ────────────────────────────────────────────────────────────────
const SEED_SCHOOLS = [
  // Universities
  {id:"uic",       name:"University of Illinois Chicago",          short:"UIC",    type:"university"},
  {id:"illinois",  name:"Univ. of Illinois Urbana-Champaign",      short:"UIUC",   type:"university"},
  {id:"northwestern",name:"Northwestern University",               short:"NU",     type:"university"},
  {id:"depaul",    name:"DePaul University",                       short:"DePaul", type:"university"},
  // Community Colleges
  {id:"cod",       name:"College of DuPage",                       short:"COD",    type:"community"},
  {id:"truman",    name:"Harry S Truman College",                  short:"Truman", type:"community"},
  {id:"oakton",    name:"Oakton Community College",                short:"Oakton", type:"community"},
];
const SEED_PROGRAMS = [
  // Chemical Engineering — offered at UIC and UIUC
  {id:"che_uic",   name:"Chemical Engineering", school:"uic",      totalCredits:132, icon:"⚗️"},
  {id:"che_uiuc",  name:"Chemical Engineering", school:"illinois", totalCredits:130, icon:"⚗️"},
  // Computer Science
  {id:"cs_uic",    name:"Computer Science",     school:"uic",      totalCredits:120, icon:"💻"},
  // Business
  {id:"bus_uic",   name:"Business Administration",school:"uic",    totalCredits:120, icon:"📊"},
  {id:"bus_depaul",name:"Business Administration",school:"depaul", totalCredits:120, icon:"📊"},
  // Nursing
  {id:"nurs_uic",  name:"Nursing (BSN)",         school:"uic",     totalCredits:128, icon:"🏥"},
  // Mechanical Engineering
  {id:"me_uiuc",   name:"Mechanical Engineering",school:"illinois",totalCredits:130, icon:"⚙️"},
  // Psychology
  {id:"psyc_nu",   name:"Psychology",            school:"northwestern",totalCredits:120,icon:"🧠"},
  // Finance
  {id:"fin_depaul",name:"Finance",               school:"depaul",  totalCredits:120, icon:"💰"},
];
// CC courses are keyed by CC school ID
// Each course has: code, name, credits, transferable, mapsTo (university course code)
const SEED_CC = {
  // ── College of DuPage ──────────────────────────────────────────────────────
  cod:[
    {code:"MATH 2231",name:"Calculus I",credits:5,transferable:true,mapsTo:"MATH 180"},
    {code:"MATH 2232",name:"Calculus II",credits:4,transferable:true,mapsTo:"MATH 181"},
    {code:"MATH 2233",name:"Calculus III",credits:4,transferable:true,mapsTo:"MATH 210"},
    {code:"MATH 2255",name:"Differential Equations",credits:3,transferable:true,mapsTo:"MATH 220"},
    {code:"PHYS 2111",name:"Physics I — Mechanics",credits:4,transferable:true,mapsTo:"PHYS 141"},
    {code:"PHYS 2112",name:"Physics II — E&M",credits:4,transferable:true,mapsTo:"PHYS 142"},
    {code:"CHEM 1551",name:"General Chemistry I",credits:4,transferable:true,mapsTo:"CHEM 122"},
    {code:"CHEM 1552",name:"General Chemistry II",credits:4,transferable:true,mapsTo:"CHEM 123"},
    {code:"CHEM 1553",name:"Gen. Chemistry Lab I",credits:1,transferable:true,mapsTo:"CHEM 124"},
    {code:"CHEM 1554",name:"Gen. Chemistry Lab II",credits:1,transferable:true,mapsTo:"CHEM 125"},
    {code:"CHEM 2210",name:"Organic Chemistry I",credits:4,transferable:true,mapsTo:"CHEM 232"},
    {code:"ENGR 1100",name:"Introduction to Engineering",credits:1,transferable:true,mapsTo:"ENGR 100"},
    {code:"CIS 2531",name:"Scientific Programming",credits:3,transferable:true,mapsTo:"CS 109"},
    {code:"ENGL 1101",name:"Composition I",credits:3,transferable:true,mapsTo:"ENGL 160"},
    {code:"ECON 2201",name:"Microeconomics",credits:3,transferable:true,mapsTo:"ECON 121"},
    {code:"ECON 2202",name:"Macroeconomics",credits:3,transferable:true,mapsTo:"ECON 120"},
    {code:"ACCT 1101",name:"Financial Accounting",credits:4,transferable:true,mapsTo:"ACTG 210"},
    {code:"BIOL 1151",name:"Anatomy & Physiology I",credits:4,transferable:true,mapsTo:"BIOS 250"},
    {code:"BIOL 1152",name:"Anatomy & Physiology II",credits:4,transferable:true,mapsTo:"BIOS 251"},
    {code:"BIOL 2210",name:"Microbiology",credits:4,transferable:true,mapsTo:"BIOS 220"},
    {code:"PSYC 1100",name:"General Psychology",credits:3,transferable:true,mapsTo:"PSYC 100"},
  ],
  // ── Harry S Truman College ─────────────────────────────────────────────────
  truman:[
    {code:"MTH 205",name:"Calculus I",credits:5,transferable:true,mapsTo:"MATH 180"},
    {code:"MTH 206",name:"Calculus II",credits:4,transferable:true,mapsTo:"MATH 181"},
    {code:"MTH 207",name:"Calculus III",credits:4,transferable:true,mapsTo:"MATH 210"},
    {code:"MTH 212",name:"Differential Equations",credits:3,transferable:true,mapsTo:"MATH 220"},
    {code:"PHY 201",name:"Physics I — Mechanics",credits:4,transferable:true,mapsTo:"PHYS 141"},
    {code:"PHY 202",name:"Physics II — E&M",credits:4,transferable:true,mapsTo:"PHYS 142"},
    {code:"CHM 201",name:"General Chemistry I",credits:4,transferable:true,mapsTo:"CHEM 122"},
    {code:"CHM 202",name:"General Chemistry II",credits:4,transferable:true,mapsTo:"CHEM 123"},
    {code:"CHM 201L",name:"Gen. Chemistry Lab I",credits:1,transferable:true,mapsTo:"CHEM 124"},
    {code:"CHM 202L",name:"Gen. Chemistry Lab II",credits:1,transferable:true,mapsTo:"CHEM 125"},
    {code:"CHM 211",name:"Organic Chemistry I",credits:4,transferable:true,mapsTo:"CHEM 232"},
    {code:"ENG 101",name:"Composition I",credits:3,transferable:true,mapsTo:"ENGL 160"},
    {code:"CSC 111",name:"Intro to Programming",credits:3,transferable:true,mapsTo:"CS 109"},
    {code:"ECO 201",name:"Microeconomics",credits:3,transferable:true,mapsTo:"ECON 121"},
    {code:"ECO 202",name:"Macroeconomics",credits:3,transferable:true,mapsTo:"ECON 120"},
    {code:"ACC 101",name:"Financial Accounting",credits:4,transferable:true,mapsTo:"ACTG 210"},
    {code:"BIO 201",name:"Anatomy & Physiology I",credits:4,transferable:true,mapsTo:"BIOS 250"},
    {code:"BIO 202",name:"Anatomy & Physiology II",credits:4,transferable:true,mapsTo:"BIOS 251"},
    {code:"PSY 101",name:"General Psychology",credits:3,transferable:true,mapsTo:"PSYC 100"},
  ],
  // ── Oakton Community College ───────────────────────────────────────────────
  oakton:[
    {code:"MAT 251",name:"Calculus I",credits:5,transferable:true,mapsTo:"MATH 180"},
    {code:"MAT 252",name:"Calculus II",credits:4,transferable:true,mapsTo:"MATH 181"},
    {code:"MAT 253",name:"Calculus III",credits:4,transferable:true,mapsTo:"MATH 210"},
    {code:"MAT 260",name:"Differential Equations",credits:3,transferable:true,mapsTo:"MATH 220"},
    {code:"PHY 221",name:"Physics I — Mechanics",credits:4,transferable:true,mapsTo:"PHYS 141"},
    {code:"PHY 222",name:"Physics II — E&M",credits:4,transferable:true,mapsTo:"PHYS 142"},
    {code:"CHM 210",name:"General Chemistry I",credits:4,transferable:true,mapsTo:"CHEM 122"},
    {code:"CHM 211",name:"General Chemistry II",credits:4,transferable:true,mapsTo:"CHEM 123"},
    {code:"CHM 210L",name:"Gen. Chemistry Lab I",credits:1,transferable:true,mapsTo:"CHEM 124"},
    {code:"CHM 211L",name:"Gen. Chemistry Lab II",credits:1,transferable:true,mapsTo:"CHEM 125"},
    {code:"CHM 220",name:"Organic Chemistry I",credits:4,transferable:true,mapsTo:"CHEM 232"},
    {code:"EGL 101",name:"Composition I",credits:3,transferable:true,mapsTo:"ENGL 160"},
    {code:"CSC 155",name:"Scientific Programming",credits:3,transferable:true,mapsTo:"CS 109"},
    {code:"ECN 211",name:"Microeconomics",credits:3,transferable:true,mapsTo:"ECON 121"},
    {code:"ECN 212",name:"Macroeconomics",credits:3,transferable:true,mapsTo:"ECON 120"},
    {code:"ACT 101",name:"Financial Accounting",credits:4,transferable:true,mapsTo:"ACTG 210"},
    {code:"BIO 231",name:"Anatomy & Physiology I",credits:4,transferable:true,mapsTo:"BIOS 250"},
    {code:"BIO 232",name:"Anatomy & Physiology II",credits:4,transferable:true,mapsTo:"BIOS 251"},
    {code:"PSY 101",name:"General Psychology",credits:3,transferable:true,mapsTo:"PSYC 100"},
  ],
};
const SEED_REQS = {
  che_uic:[
    // ── SOPHOMORE (Year 1 at UIC after transfer) ──
    // These are satisfied if student transferred the equiv CC course
    {code:"ENGR 100",name:"Introduction to Engineering",credits:1,equiv:"ENGR 100",semHint:1},
    {code:"MATH 180",name:"Calculus I",credits:5,equiv:"MATH 150",semHint:1},
    {code:"MATH 181",name:"Calculus II",credits:4,equiv:"MATH 229",semHint:1},
    {code:"CHEM 122",name:"General Chemistry I",credits:3,equiv:"CHEM 101",semHint:1},
    {code:"CHEM 123",name:"General Chemistry II",credits:3,equiv:"CHEM 102",semHint:1},
    {code:"CHEM 124",name:"Gen. Chemistry Lab I",credits:1,equiv:"CHEM 103",semHint:1},
    {code:"CHEM 125",name:"Gen. Chemistry Lab II",credits:1,equiv:"CHEM 104",semHint:1},
    {code:"PHYS 141",name:"Physics I — Mechanics",credits:4,equiv:"PHYS 201",semHint:1},
    {code:"CS 109",name:"Intro to Scientific Programming",credits:3,equiv:"CS 111",semHint:1},
    // ── SOPHOMORE continued ──
    {code:"MATH 210",name:"Calculus III",credits:3,equiv:"MATH 230",semHint:2},
    {code:"MATH 220",name:"Differential Equations",credits:3,equiv:"MATH 252",semHint:2},
    {code:"PHYS 142",name:"Physics II — E&M",credits:4,equiv:"PHYS 202",semHint:2},
    {code:"CHEM 232",name:"Organic Chemistry I",credits:3,equiv:"CHEM 201",semHint:2},
    // ── SOPHOMORE CHE core ──
    {code:"CHE 201",name:"Material & Energy Balances",credits:3,equiv:null,semHint:2},
    {code:"CHE 205",name:"CHE Thermodynamics I",credits:3,equiv:null,semHint:2},
    {code:"CHE 210",name:"CHE Lab I",credits:2,equiv:null,semHint:2},
    // ── JUNIOR Year ──
    {code:"CHE 301",name:"CHE Thermodynamics II",credits:3,equiv:null,semHint:3},
    {code:"CHE 311",name:"Fluid Mechanics",credits:3,equiv:null,semHint:3},
    {code:"CHE 312",name:"Heat Transfer",credits:3,equiv:null,semHint:3},
    {code:"CHE 313",name:"Mass Transfer",credits:3,equiv:null,semHint:3},
    {code:"CHE 321",name:"Chemical Reaction Engineering",credits:3,equiv:null,semHint:3},
    {code:"CHE 342",name:"Process Dynamics & Control",credits:3,equiv:null,semHint:3},
    {code:"CHEM 222",name:"Organic Chemistry II",credits:3,equiv:null,semHint:3},
    {code:"CHEM 230",name:"Organic Chemistry Lab",credits:1,equiv:null,semHint:3},
    {code:"CHEM 233",name:"Analytical Chemistry Lab",credits:2,equiv:null,semHint:3},
    {code:"CHEM 234",name:"Quantitative Analysis",credits:3,equiv:null,semHint:3},
    {code:"CME 322",name:"Intro to Materials Science",credits:3,equiv:null,semHint:3},
    {code:"ECE 210",name:"Electrical Circuits",credits:3,equiv:null,semHint:4},
    {code:"CME 260",name:"Mechanics of Materials",credits:3,equiv:null,semHint:4},
    // ── SENIOR Year ──
    {code:"CHE 330",name:"CHE Lab II",credits:3,equiv:null,semHint:4},
    {code:"CHE 341",name:"Process Design I",credits:3,equiv:null,semHint:4},
    {code:"CHE 381",name:"Technical Elective I",credits:3,equiv:null,semHint:5},
    {code:"CHE 382",name:"Technical Elective II",credits:3,equiv:null,semHint:5},
    {code:"CHE 396",name:"Professional Development",credits:1,equiv:null,semHint:5},
    {code:"CHE 397",name:"Technical Communication",credits:2,equiv:null,semHint:5},
    {code:"CHE 451",name:"Process Design II",credits:3,equiv:null,semHint:5},
    {code:"CHE 499",name:"Senior Capstone (Fall only)",credits:3,equiv:null,semHint:6},
    {code:"CHE 4xx",name:"Advanced Technical Elective",credits:3,equiv:null,semHint:6},
  ],
  cs_uic:[
    {code:"CS 211",name:"Data Structures",credits:3,equiv:"CS 122",semHint:1},
    {code:"MATH 215",name:"Linear Algebra",credits:3,equiv:null,semHint:1},
    {code:"CS 261",name:"Machine Organization",credits:3,equiv:null,semHint:1},
    {code:"CS 301",name:"Languages & Automata",credits:3,equiv:null,semHint:2},
    {code:"CS 341",name:"System Programming",credits:3,equiv:null,semHint:2},
    {code:"CS 385",name:"Algorithms",credits:3,equiv:null,semHint:2},
    {code:"CS 362",name:"Software Design",credits:3,equiv:null,semHint:2},
    {code:"CS 401",name:"Computer Systems",credits:3,equiv:null,semHint:3},
    {code:"CS 422",name:"UI Design",credits:3,equiv:null,semHint:3},
    {code:"CS 480",name:"CS Elective I",credits:3,equiv:null,semHint:3},
    {code:"CS 495",name:"Senior Capstone",credits:3,equiv:null,semHint:4},
    {code:"CS 484",name:"Parallel Computing",credits:3,equiv:null,semHint:4},
    {code:"CS 481",name:"CS Elective II",credits:3,equiv:null,semHint:4},
  ],
  bus_uic:[
    {code:"MGMT 340",name:"Organizational Behavior",credits:3,equiv:null,semHint:1},
    {code:"MKT 360",name:"Marketing",credits:3,equiv:null,semHint:1},
    {code:"FIN 300",name:"Corporate Finance",credits:3,equiv:null,semHint:1},
    {code:"MGMT 410",name:"Strategy",credits:3,equiv:null,semHint:2},
    {code:"ACCT 310",name:"Managerial Accounting",credits:3,equiv:"ACCT 101",semHint:2},
    {code:"MIS 300",name:"Information Systems",credits:3,equiv:null,semHint:2},
    {code:"MGMT 490",name:"Entrepreneurship",credits:3,equiv:null,semHint:3},
    {code:"FIN 410",name:"Investments",credits:3,equiv:null,semHint:3},
    {code:"BUSN 351",name:"Business Elective",credits:3,equiv:null,semHint:3},
    {code:"MGMT 499",name:"Capstone",credits:3,equiv:null,semHint:4},
    {code:"BUSN 353",name:"Free Elective",credits:3,equiv:null,semHint:4},
  ],
  nurs_uic:[
    {code:"NURS 310",name:"Fundamentals of Nursing",credits:4,equiv:null,semHint:1},
    {code:"NURS 320",name:"Pharmacology",credits:3,equiv:null,semHint:1},
    {code:"NURS 315",name:"Health Assessment",credits:3,equiv:null,semHint:1},
    {code:"NURS 300",name:"Pathophysiology",credits:3,equiv:null,semHint:1},
    {code:"NURS 330",name:"Med-Surg Nursing I",credits:4,equiv:null,semHint:2},
    {code:"NURS 340",name:"OB Nursing",credits:3,equiv:null,semHint:2},
    {code:"NURS 360",name:"Clinical Practicum I",credits:3,equiv:null,semHint:2},
    {code:"NURS 410",name:"Med-Surg Nursing II",credits:4,equiv:null,semHint:3},
    {code:"NURS 420",name:"Psychiatric Nursing",credits:3,equiv:null,semHint:3},
    {code:"NURS 440",name:"Clinical Practicum II",credits:3,equiv:null,semHint:3},
    {code:"NURS 490",name:"Senior Capstone",credits:3,equiv:null,semHint:4},
    {code:"NURS 480",name:"Nursing Leadership",credits:3,equiv:null,semHint:4},
    {code:"NURS 495",name:"Clinical Practicum III",credits:4,equiv:null,semHint:4},
  ],
};

const ADMINS = {
  // Universities
  "admin@uic.edu":         {password:"uic2024",   schoolId:"uic",         schoolName:"University of Illinois Chicago",     schoolType:"university"},
  "admin@illinois.edu":    {password:"uiuc2024",  schoolId:"illinois",    schoolName:"UIUC",                               schoolType:"university"},
  "admin@northwestern.edu":{password:"nu2024",    schoolId:"northwestern",schoolName:"Northwestern University",            schoolType:"university"},
  "admin@depaul.edu":      {password:"depaul2024",schoolId:"depaul",      schoolName:"DePaul University",                 schoolType:"university"},
  // Community Colleges
  "admin@cod.edu":         {password:"cod2024",   schoolId:"cod",         schoolName:"College of DuPage",                 schoolType:"community"},
  "admin@truman.edu":      {password:"truman2024",schoolId:"truman",      schoolName:"Harry S Truman College",            schoolType:"community"},
  "admin@oakton.edu":      {password:"oakton2024",schoolId:"oakton",      schoolName:"Oakton Community College",          schoolType:"community"},
};

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Inter:wght@300;400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #0a0a0f;
    --bg1: #12121a;
    --bg2: #1a1a26;
    --bg3: #22223a;
    --border: rgba(255,255,255,0.07);
    --border-hi: rgba(255,255,255,0.14);
    --text0: #f0f0ff;
    --text1: #b8b8d0;
    --text2: #7070a0;
    --text3: #404060;
    --accent: #6c63ff;
    --accent2: #ff6b6b;
    --accent3: #ffd93d;
    --accent4: #6bcb77;
    --grad: linear-gradient(135deg, #6c63ff, #ff6b6b);
    --grad2: linear-gradient(135deg, #6bcb77, #6c63ff);
    --radius: 16px;
    --radius-sm: 10px;
  }
  html { font-size: 16px; }
  body { background: var(--bg); font-family: 'Inter', sans-serif; color: var(--text0); -webkit-font-smoothing: antialiased; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border-hi); border-radius: 4px; }
  input, select { font-family: 'Inter', sans-serif; }
  input::placeholder { color: var(--text3); }

  /* Layout */
  .app { min-height: 100vh; display: flex; flex-direction: column; align-items: center; }

  /* Hero Nav */
  .nav { width: 100%; max-width: 900px; padding: 20px 24px; display: flex; align-items: center; justify-content: space-between; }
  .logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }
  .logo-mark { width: 36px; height: 36px; border-radius: 10px; background: var(--grad); display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; box-shadow: 0 4px 20px rgba(108,99,255,0.4); }
  .logo-text { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800; color: var(--text0); letter-spacing: -0.5px; }
  .logo-sub { font-size: 9px; color: var(--text3); letter-spacing: 0.12em; text-transform: uppercase; line-height: 1; }

  /* Hero */
  .hero { width: 100%; max-width: 900px; padding: 40px 24px 32px; text-align: center; }
  .hero-badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 100px; background: rgba(108,99,255,0.12); border: 1px solid rgba(108,99,255,0.3); font-size: 11px; color: #a599ff; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 20px; font-weight: 600; }
  .hero-title { font-family: 'Syne', sans-serif; font-size: clamp(32px, 6vw, 56px); font-weight: 800; line-height: 1.1; letter-spacing: -1px; margin-bottom: 16px; }
  .hero-title span { background: var(--grad); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
  .hero-sub { font-size: 16px; color: var(--text1); max-width: 480px; margin: 0 auto 32px; line-height: 1.6; }
  .hero-stats { display: flex; justify-content: center; gap: 32px; flex-wrap: wrap; margin-bottom: 40px; }
  .hero-stat { text-align: center; }
  .hero-stat-n { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; background: var(--grad); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
  .hero-stat-l { font-size: 11px; color: var(--text2); margin-top: 2px; }
  .hero-cta { display: inline-flex; align-items: center; gap: 8px; padding: 16px 32px; border-radius: 100px; background: var(--grad); color: #fff; font-size: 15px; font-weight: 600; border: none; cursor: pointer; box-shadow: 0 8px 32px rgba(108,99,255,0.35); transition: transform 0.2s, box-shadow 0.2s; }
  .hero-cta:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(108,99,255,0.5); }

  /* Card */
  .card { width: 100%; max-width: 760px; background: var(--bg1); border: 1px solid var(--border); border-radius: 24px; padding: 32px; margin: 0 16px 40px; box-shadow: 0 24px 80px rgba(0,0,0,0.5); }

  /* Progress bar */
  .progress-wrap { margin-bottom: 32px; }
  .progress-steps { display: flex; align-items: center; gap: 0; margin-bottom: 12px; }
  .ps-item { display: flex; align-items: center; flex: 1; }
  .ps-item:last-child { flex: none; }
  .ps-dot { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; transition: all 0.3s; }
  .ps-dot.done { background: var(--accent4); color: #000; }
  .ps-dot.active { background: var(--grad); color: #fff; box-shadow: 0 0 0 4px rgba(108,99,255,0.2); }
  .ps-dot.todo { background: var(--bg3); color: var(--text3); }
  .ps-line { flex: 1; height: 2px; background: var(--bg3); margin: 0 6px; margin-bottom: 18px; }
  .ps-line.done { background: var(--accent4); }
  .ps-labels { display: flex; justify-content: space-between; }
  .ps-lbl { font-size: 10px; color: var(--text3); text-transform: uppercase; letter-spacing: 0.06em; text-align: center; flex: 1; }
  .ps-lbl.active { color: var(--accent); }
  .ps-lbl.done { color: var(--accent4); }

  /* Step titles */
  .step-title { font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 800; margin-bottom: 6px; letter-spacing: -0.5px; }
  .step-sub { font-size: 14px; color: var(--text2); margin-bottom: 24px; line-height: 1.5; }

  /* Search */
  .search-box { position: relative; margin-bottom: 16px; }
  .search-icon { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); font-size: 16px; }
  .search-input { width: 100%; padding: 14px 16px 14px 44px; border-radius: var(--radius); background: var(--bg2); border: 1px solid var(--border); color: var(--text0); font-size: 14px; outline: none; transition: border-color 0.2s; }
  .search-input:focus { border-color: var(--accent); }

  /* School pills */
  .school-pills { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; align-items: center; }
  .pill-label { font-size: 11px; color: var(--text3); text-transform: uppercase; letter-spacing: 0.1em; }
  .school-pill { padding: 6px 14px; border-radius: 100px; border: 1px solid var(--border); background: transparent; color: var(--text2); font-size: 12px; cursor: pointer; transition: all 0.2s; font-family: 'Inter', sans-serif; }
  .school-pill:hover { border-color: var(--border-hi); color: var(--text1); }
  .school-pill.active { background: rgba(108,99,255,0.15); border-color: var(--accent); color: #a599ff; }

  /* Program cards */
  .prog-grid { display: flex; flex-direction: column; gap: 8px; max-height: 340px; overflow-y: auto; padding-right: 4px; }
  .prog-card { display: flex; align-items: center; gap: 14px; padding: 14px 16px; border-radius: var(--radius-sm); border: 2px solid var(--border); background: var(--bg2); cursor: pointer; transition: all 0.2s; user-select: none; }
  .prog-card:hover { border-color: var(--border-hi); background: var(--bg3); }
  .prog-card.selected { border-color: var(--accent); background: rgba(108,99,255,0.08); }
  .prog-icon { font-size: 24px; flex-shrink: 0; }
  .prog-info { flex: 1; }
  .prog-name { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; color: var(--text0); margin-bottom: 2px; }
  .prog-meta { font-size: 12px; color: var(--text2); }
  .prog-check { width: 22px; height: 22px; border-radius: 50%; border: 2px solid var(--border); display: flex; align-items: center; justify-content: center; font-size: 11px; color: #fff; flex-shrink: 0; transition: all 0.2s; }
  .prog-check.on { background: var(--accent); border-color: var(--accent); }

  /* Selected bar */
  .selected-bar { margin-top: 20px; padding: 16px 20px; border-radius: var(--radius); background: rgba(108,99,255,0.08); border: 1px solid rgba(108,99,255,0.25); display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
  .selected-info { flex: 1; }
  .selected-label { font-size: 10px; color: var(--accent); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 3px; font-weight: 600; }
  .selected-name { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; color: var(--text0); }

  /* Buttons */
  .btn { display: inline-flex; align-items: center; gap: 8px; padding: 14px 28px; border-radius: 100px; font-size: 14px; font-weight: 600; border: none; cursor: pointer; transition: all 0.2s; font-family: "Inter", sans-serif; letter-spacing: 0.02em; }
  .btn-primary { background: var(--grad); color: #fff; box-shadow: 0 4px 20px rgba(108,99,255,0.3); }
  .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 28px rgba(108,99,255,0.45); }
  .btn-primary:disabled { opacity: 0.35; cursor: not-allowed; transform: none; }
  .btn-ghost { background: transparent; color: var(--text1); border: 1px solid var(--border-hi); }
  .btn-ghost:hover { background: var(--bg3); color: var(--text0); }
  .btn-row { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-top: 28px; padding-top: 20px; border-top: 1px solid var(--border); flex-wrap: wrap; }

  /* Credits bar */
  .credit-bar { display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; border-radius: var(--radius-sm); background: var(--bg2); border: 1px solid var(--border); margin-bottom: 16px; flex-wrap: wrap; gap: 12px; }
  .credit-item { text-align: center; }
  .credit-num { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; }
  .credit-lbl { font-size: 10px; color: var(--text3); text-transform: uppercase; letter-spacing: 0.06em; margin-top: 1px; }
  .credit-num.green { color: var(--accent4); }
  .credit-num.purple { color: var(--accent); }

  /* Course list */
  .course-list { display: flex; flex-direction: column; gap: 6px; max-height: 340px; overflow-y: auto; padding-right: 4px; margin-bottom: 4px; }
  .course-row { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: var(--radius-sm); border: 1px solid var(--border); background: var(--bg2); cursor: pointer; transition: all 0.2s; user-select: none; }
  .course-row:hover { border-color: var(--border-hi); }
  .course-row.on { border-color: var(--accent); background: rgba(108,99,255,0.06); }
  .checkbox { width: 20px; height: 20px; border-radius: 6px; border: 2px solid var(--border-hi); display: flex; align-items: center; justify-content: center; font-size: 11px; flex-shrink: 0; transition: all 0.2s; }
  .checkbox.on { background: var(--accent); border-color: var(--accent); color: #fff; }
  .course-code { font-size: 11px; color: var(--accent); font-weight: 600; width: 75px; flex-shrink: 0; font-family: 'Syne', sans-serif; }
  .course-name { font-size: 13px; color: var(--text1); flex: 1; }
  .course-row.on .course-name { color: var(--text0); }
  .course-cr { font-size: 11px; color: var(--text3); flex-shrink: 0; }
  .course-xfer { font-size: 10px; flex-shrink: 0; padding: 2px 8px; border-radius: 100px; }
  .course-xfer.yes { background: rgba(107,203,119,0.12); color: var(--accent4); }
  .course-xfer.no { background: rgba(255,107,107,0.1); color: var(--accent2); }

  /* Report */
  .stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
  .stat-box { padding: 18px 14px; border-radius: var(--radius); text-align: center; border: 1px solid var(--border); }
  .stat-box.g { background: rgba(107,203,119,0.06); border-color: rgba(107,203,119,0.2); }
  .stat-box.p { background: rgba(108,99,255,0.06); border-color: rgba(108,99,255,0.2); }
  .stat-box.a { background: rgba(255,217,61,0.06); border-color: rgba(255,217,61,0.2); }
  .stat-num { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; }
  .stat-box.g .stat-num { color: var(--accent4); }
  .stat-box.p .stat-num { color: var(--accent); }
  .stat-box.a .stat-num { color: var(--accent3); }
  .stat-lbl { font-size: 10px; color: var(--text3); text-transform: uppercase; letter-spacing: 0.06em; margin-top: 4px; }
  .stat-sub { font-size: 10px; color: var(--text3); margin-top: 2px; }
  .prog-bar-bg { height: 6px; border-radius: 3px; background: var(--bg3); overflow: hidden; margin-bottom: 24px; }
  .prog-bar-fill { height: 100%; border-radius: 3px; background: var(--grad2); transition: width 0.6s ease; }
  .section-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 10px; display: flex; align-items: center; gap: 6px; }
  .section-label.green { color: var(--accent4); }
  .section-label.red { color: var(--accent2); }
  .result-list { display: flex; flex-direction: column; gap: 6px; margin-bottom: 20px; }
  .result-row { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: var(--radius-sm); }
  .result-row.xfer { background: rgba(107,203,119,0.05); border: 1px solid rgba(107,203,119,0.15); }
  .result-row.noxfer { background: rgba(255,107,107,0.05); border: 1px solid rgba(255,107,107,0.1); }
  .r-code { font-size: 11px; font-weight: 600; width: 72px; flex-shrink: 0; font-family: 'Syne', sans-serif; }
  .r-code.g { color: var(--accent4); }
  .r-code.r { color: var(--accent2); }
  .r-name { font-size: 12px; color: var(--text1); flex: 1; }
  .r-tag { font-size: 10px; color: var(--text3); background: var(--bg3); padding: 2px 8px; border-radius: 100px; flex-shrink: 0; white-space: nowrap; }
  .r-tag.g { color: var(--accent4); background: rgba(107,203,119,0.1); }

  /* Roadmap */
  .roadmap-banner { padding: 16px 20px; border-radius: var(--radius); background: linear-gradient(135deg, rgba(108,99,255,0.1), rgba(255,107,107,0.08)); border: 1px solid rgba(108,99,255,0.2); margin-bottom: 24px; }
  .roadmap-banner-title { font-size: 10px; color: var(--accent); text-transform: uppercase; letter-spacing: 0.1em; font-weight: 600; margin-bottom: 12px; }
  .roadmap-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
  .rm-stat { text-align: center; }
  .rm-stat-n { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; }
  .rm-stat-l { font-size: 9px; color: var(--text3); text-transform: uppercase; letter-spacing: 0.06em; margin-top: 2px; }
  .timeline { position: relative; padding-left: 20px; }
  .timeline::before { content: ''; position: absolute; left: 11px; top: 0; bottom: 0; width: 2px; background: linear-gradient(180deg, var(--accent), transparent); }
  .tl-item { position: relative; margin-bottom: 20px; }
  .tl-dot { position: absolute; left: -24px; top: 4px; width: 24px; height: 24px; border-radius: 50%; background: var(--bg3); border: 2px solid var(--accent); display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; color: var(--accent); z-index: 1; }
  .tl-dot.grad { background: var(--grad); border: none; color: #fff; font-size: 13px; }
  .tl-sem { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; color: var(--text0); margin-bottom: 8px; }
  .tl-courses { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
  .tl-course { padding: 8px 12px; border-radius: 8px; background: var(--bg2); border: 1px solid var(--border); }
  .tl-course-code { font-size: 10px; color: var(--accent); font-weight: 600; font-family: 'Syne', sans-serif; }
  .tl-course-name { font-size: 11px; color: var(--text2); margin-top: 1px; }
  .tl-course-cr { font-size: 9px; color: var(--text3); }
  .grad-box { padding: 16px 20px; border-radius: var(--radius); background: linear-gradient(135deg, rgba(107,203,119,0.08), rgba(108,99,255,0.08)); border: 1px solid rgba(107,203,119,0.2); display: flex; align-items: center; gap: 14px; }
  .grad-icon { font-size: 32px; }
  .grad-title { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 800; color: var(--text0); }
  .grad-sub { font-size: 12px; color: var(--text2); margin-top: 3px; }
  .met-toggle { font-size: 11px; color: var(--accent4); cursor: pointer; margin-bottom: 12px; background: none; border: none; font-family: 'Inter', sans-serif; padding: 0; display: flex; align-items: center; gap: 4px; }
  .advisor-note { margin-top: 20px; padding: 12px 16px; border-radius: var(--radius-sm); background: var(--bg2); border: 1px solid var(--border); font-size: 12px; color: var(--text3); line-height: 1.6; }

  /* All met */
  .all-met { padding: 32px; border-radius: var(--radius); background: linear-gradient(135deg, rgba(107,203,119,0.08), rgba(108,99,255,0.08)); border: 1px solid rgba(107,203,119,0.25); text-align: center; }
  .all-met-icon { font-size: 48px; margin-bottom: 12px; }
  .all-met-title { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; margin-bottom: 8px; }
  .all-met-sub { font-size: 14px; color: var(--text2); }

  /* Empty */
  .empty { color: var(--text3); font-size: 13px; padding: 24px 0; text-align: center; }

  /* Animations */
  @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  .fade { animation: fadeUp 0.35s ease; }

  /* Mobile */
  @media (max-width: 600px) {
    .card { padding: 20px 16px; margin: 0 8px 32px; }
    .stat-grid { grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
    .stat-num { font-size: 22px; }
    .tl-courses { grid-template-columns: 1fr; }
    .roadmap-stats { grid-template-columns: repeat(2, 1fr); }
    .hero-stats { gap: 20px; }
    .hero-title { font-size: 28px; }
    .hero-sub { font-size: 14px; }
    .selected-bar { flex-direction: column; align-items: flex-start; }
  }
`;

// ─── Steps ──────────────────────────────────────────────────────────────────
function Steps({step}) {
  const labels = ["Program","School","My Courses","Report","Roadmap"];
  return (
    <div className="progress-wrap">
      <div className="progress-steps">
        {labels.map((lbl,i) => {
          const n=i+1, done=n<step, active=n===step;
          return (
            <div key={i} className="ps-item">
              <div className={`ps-dot ${done?"done":active?"active":"todo"}`}>
                {done ? "✓" : n}
              </div>
              {i < labels.length-1 && <div className={`ps-line ${done?"done":""}`}/>}
            </div>
          );
        })}
      </div>
      <div className="ps-labels">
        {labels.map((lbl,i) => {
          const n=i+1, done=n<step, active=n===step;
          return <div key={i} className={`ps-lbl ${done?"done":active?"active":""}`}>{lbl}</div>;
        })}
      </div>
    </div>
  );
}

// ─── Step 1: Select Program ───────────────────────────────────────────────────
function StepProgram({programs, onSelect}) {
  const [q,setQ] = useState("");
  const [picked,setPicked] = useState(null);

  // Get unique program names across all schools
  const uniqueNames = [...new Set(programs.map(p=>p.name))];
  const filtered = uniqueNames.filter(n => !q.trim() || n.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="fade">
      <h2 className="step-title">What do you want to study?</h2>
      <p className="step-sub">Search for your intended degree program. We'll find which universities offer it.</p>
      <div className="search-box">
        <span className="search-icon">🔍</span>
        <input className="search-input" value={q} onChange={e=>setQ(e.target.value)} placeholder="e.g. Chemical Engineering, Nursing, Computer Science…"/>
      </div>
      <div className="prog-grid">
        {filtered.length===0 && <p className="empty">No programs found. Try a different search.</p>}
        {filtered.map(name => {
          const progs = programs.filter(p=>p.name===name);
          const p = progs[0];
          const sel = picked===name;
          return (
            <div key={name} onClick={()=>setPicked(x=>x===name?null:name)} className={`prog-card ${sel?"selected":""}`}>
              <span className="prog-icon">{p.icon||"📚"}</span>
              <div className="prog-info">
                <div className="prog-name">{name}</div>
                <div className="prog-meta">{progs.length} school{progs.length!==1?"s":""} offer this program</div>
              </div>
              <div className={`prog-check ${sel?"on":""}`}>{sel&&"✓"}</div>
            </div>
          );
        })}
      </div>
      {picked && (
        <div className="selected-bar">
          <div className="selected-info">
            <div className="selected-label">✓ Selected</div>
            <div className="selected-name">{programs.find(p=>p.name===picked)?.icon} {picked}</div>
          </div>
        </div>
      )}
      <div className="btn-row">
        <span style={{fontSize:"12px",color:"var(--text3)"}}>
          {!picked && "← Select a program above"}
        </span>
        <button className="btn btn-primary" disabled={!picked} onClick={()=>onSelect(picked)}>
          Next: Choose School →
        </button>
      </div>
    </div>
  );
}

// ─── Step 2: Select University + CC ──────────────────────────────────────────
function StepSchool({programName, programs, schools, onSelect, onBack}) {
  const [pickedUni,setPickedUni] = useState(null);
  const [pickedCC,setPickedCC]   = useState(null);
  const matching = programs.filter(p=>p.name===programName);
  const ccs = schools.filter(s=>s.type==="community");

  return (
    <div className="fade">
      <h2 className="step-title">Choose Your Schools</h2>
      <p className="step-sub">Select which university you are transferring to and which community college you attended.</p>

      <div className="section-label" style={{color:"var(--accent)",marginBottom:10}}>🏛 Transfer To — Universities offering {programName}</div>
      <div className="prog-grid" style={{marginBottom:20}}>
        {matching.map(p => {
          const sc = schools.find(s=>s.id===p.school);
          const sel = pickedUni?.id===p.id;
          return (
            <div key={p.id} onClick={()=>setPickedUni(x=>x?.id===p.id?null:p)} className={`prog-card ${sel?"selected":""}`}>
              <span className="prog-icon">🏛</span>
              <div className="prog-info">
                <div className="prog-name">{sc?.name||p.school}</div>
                <div className="prog-meta">{p.name} · {p.totalCredits} credits to graduate</div>
              </div>
              <div className={`prog-check ${sel?"on":""}`}>{sel&&"✓"}</div>
            </div>
          );
        })}
      </div>

      <div className="section-label" style={{color:"var(--accent3)",marginBottom:10}}>🎓 Transferring From — Your Community College</div>
      <div className="prog-grid">
        {ccs.map(cc => {
          const sel = pickedCC?.id===cc.id;
          return (
            <div key={cc.id} onClick={()=>setPickedCC(x=>x?.id===cc.id?null:cc)} className={`prog-card ${sel?"selected":""}`}>
              <span className="prog-icon">🎓</span>
              <div className="prog-info">
                <div className="prog-name">{cc.name}</div>
                <div className="prog-meta">Community College · {cc.short}</div>
              </div>
              <div className={`prog-check ${sel?"on":""}`}>{sel&&"✓"}</div>
            </div>
          );
        })}
      </div>

      {pickedUni && pickedCC && (
        <div className="selected-bar" style={{marginTop:16}}>
          <div className="selected-info">
            <div className="selected-label">✓ Ready</div>
            <div className="selected-name">🏛 {schools.find(s=>s.id===pickedUni.school)?.short} ← 🎓 {pickedCC.name}</div>
          </div>
        </div>
      )}

      <div className="btn-row">
        <button className="btn btn-ghost" onClick={onBack}>← Back</button>
        <button className="btn btn-primary" disabled={!pickedUni||!pickedCC} onClick={()=>onSelect(pickedUni, pickedCC.id)}>
          Next: My CC Courses →
        </button>
      </div>
    </div>
  );
}

// ─── Step 3: Enter CC Courses ─────────────────────────────────────────────────
function StepCourses({program, ccSchoolId, ccCourses, onSubmit, onBack}) {
  const available = ccCourses[ccSchoolId]||[];
  const [q,setQ] = useState("");
  const [sel,setSel] = useState(new Set());

  const toggle = code => setSel(p=>{const s=new Set(p);s.has(code)?s.delete(code):s.add(code);return s;});
  const chosen = available.filter(c=>sel.has(c.code));
  const xferCr = chosen.filter(c=>c.transferable).reduce((a,c)=>a+c.credits,0);
  const xferCount = chosen.filter(c=>c.transferable).length;

  const filtered = available.filter(c =>
    !q.trim() ||
    c.code.toLowerCase().includes(q.toLowerCase()) ||
    c.name.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="fade">
      <h2 className="step-title">Your CC Courses</h2>
      <p className="step-sub">Search and select every course you completed at community college.</p>

      <div className="search-box" style={{marginBottom:12}}>
        <span className="search-icon">🔍</span>
        <input className="search-input" value={q} onChange={e=>setQ(e.target.value)} placeholder="Search by course code or name…"/>
      </div>

      <div className="credit-bar">
        <div className="credit-item">
          <div className="credit-num purple">{chosen.length}</div>
          <div className="credit-lbl">Selected</div>
        </div>
        <div className="credit-item">
          <div className="credit-num green">{xferCount}</div>
          <div className="credit-lbl">Transferable</div>
        </div>
        <div className="credit-item">
          <div className="credit-num green">{xferCr}</div>
          <div className="credit-lbl">Transfer Credits</div>
        </div>
        <div className="credit-item">
          <div className="credit-num" style={{color:"var(--text2)"}}>{program.totalCredits}</div>
          <div className="credit-lbl">Credits to Graduate</div>
        </div>
      </div>

      {available.length===0 ? (
        <p className="empty">No courses have been uploaded for this program yet. Contact the university.</p>
      ) : filtered.length===0 ? (
        <p className="empty">No courses match your search.</p>
      ) : (
        <div className="course-list">
          {filtered.map(c => {
            const on = sel.has(c.code);
            return (
              <div key={c.code} onClick={()=>toggle(c.code)} className={`course-row ${on?"on":""}`}>
                <div className={`checkbox ${on?"on":""}`}>{on&&"✓"}</div>
                <span className="course-code">{c.code}</span>
                <span className="course-name">{c.name}</span>
                <span className="course-cr">{c.credits}cr</span>
                <span className={`course-xfer ${c.transferable?"yes":"no"}`}>
                  {c.transferable ? "✓ transfers" : "✗ no transfer"}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div className="btn-row">
        <button className="btn btn-ghost" onClick={onBack}>← Back</button>
        <button className="btn btn-primary" disabled={sel.size===0} onClick={()=>onSubmit(chosen)}>
          See Transfer Report →
        </button>
      </div>
    </div>
  );
}

// ─── Step 4: Transfer Report ──────────────────────────────────────────────────
function StepResults({program, courses, schools, onNext, onBack}) {
  const yes = courses.filter(c=>c.transferable);
  const no  = courses.filter(c=>!c.transferable);
  const cr  = yes.reduce((a,c)=>a+c.credits,0);
  const pct = Math.min(100, Math.round((cr/program.totalCredits)*100));
  const sc  = schools.find(s=>s.id===program.school);
  return (
    <div className="fade">
      <h2 className="step-title">Transfer Report</h2>
      <p className="step-sub">{program.icon} {program.name} at {sc?.short} · Here's what transfers.</p>
      <div className="stat-grid">
        <div className="stat-box g">
          <div className="stat-num">{cr}</div>
          <div className="stat-lbl">Credits In</div>
          <div className="stat-sub">{yes.length} course{yes.length!==1?"s":""}</div>
        </div>
        <div className="stat-box a">
          <div className="stat-num">{program.totalCredits-cr}</div>
          <div className="stat-lbl">Still Needed</div>
        </div>
        <div className="stat-box p">
          <div className="stat-num">{pct}%</div>
          <div className="stat-lbl">Done</div>
        </div>
      </div>
      <div className="prog-bar-bg">
        <div className="prog-bar-fill" style={{width:pct+"%"}}/>
      </div>
      {yes.length>0 && <>
        <div className="section-label green">✓ Transfers ({yes.length} courses · {cr} credits)</div>
        <div className="result-list">
          {yes.map(c=>(
            <div key={c.code} className="result-row xfer">
              <span className="r-code g">{c.code}</span>
              <span className="r-name">{c.name}</span>
              <span className="r-tag g">{c.credits}cr → {c.mapsTo}</span>
            </div>
          ))}
        </div>
      </>}
      {no.length>0 && <>
        <div className="section-label red">✗ Does Not Transfer ({no.length} courses)</div>
        <div className="result-list">
          {no.map(c=>(
            <div key={c.code} className="result-row noxfer">
              <span className="r-code r">{c.code}</span>
              <span className="r-name" style={{color:"var(--text3)"}}>{c.name}</span>
              <span className="r-tag">{c.credits}cr · not accepted</span>
            </div>
          ))}
        </div>
      </>}
      <div className="btn-row">
        <button className="btn btn-ghost" onClick={onBack}>← Back</button>
        <button className="btn btn-primary" onClick={onNext}>Build My Roadmap →</button>
      </div>
    </div>
  );
}

// ─── Step 5: Roadmap ──────────────────────────────────────────────────────────
function StepRoadmap({program, courses, schools, requirements, onRestart, onBack}) {
  const [showMet, setShowMet] = useState(false);
  const xferCodes = new Set(courses.filter(c=>c.transferable).flatMap(c=>[c.code,c.mapsTo].filter(Boolean)));
  const reqs = requirements[program.id]||[];
  const road = buildRoadmap(reqs, xferCodes);
  const met  = reqs.filter(r=>xferCodes.has(r.code)||xferCodes.has(r.equiv));
  const sc   = schools.find(s=>s.id===program.school);
  return (
    <div className="fade">
      <h2 className="step-title">Your Roadmap 🎓</h2>
      <p className="step-sub">{program.icon} {program.name} · {sc?.name} · Personalized to your transfer credits.</p>
      <div className="roadmap-banner">
        <div className="roadmap-banner-title">✦ Auto-Generated From Your Transfer Credits</div>
        <div className="roadmap-stats">
          {[
            {n:reqs.length,         l:"Total Requirements", c:"var(--text1)"},
            {n:met.length,          l:"Already Met",        c:"var(--accent4)"},
            {n:reqs.length-met.length, l:"Still Needed",    c:"var(--accent3)"},
            {n:road.length,         l:"Semesters Left",     c:"var(--accent)"},
          ].map(s=>(
            <div key={s.l} className="rm-stat">
              <div className="rm-stat-n" style={{color:s.c}}>{s.n}</div>
              <div className="rm-stat-l">{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {reqs.length===0 && <p className="empty">Degree requirements not yet uploaded by {sc?.name}. Check back soon.</p>}

      {reqs.length>0 && road.length===0 && (
        <div className="all-met">
          <div className="all-met-icon">🎉</div>
          <div className="all-met-title">All Requirements Met!</div>
          <p className="all-met-sub">Your transfer credits satisfy all {reqs.length} graduation requirements for {program.name}.</p>
        </div>
      )}

      {road.length>0 && <>
        {met.length>0 && <>
          <button className="met-toggle" onClick={()=>setShowMet(x=>!x)}>
            ✓ {met.length} requirements already satisfied by transfer {showMet?"▲":"▼"}
          </button>
          {showMet && (
            <div className="result-list" style={{marginBottom:20}}>
              {met.map(r=>(
                <div key={r.code} className="result-row xfer">
                  <span className="r-code g">{r.code}</span>
                  <span className="r-name">{r.name}</span>
                  <span className="r-tag g">✓ satisfied</span>
                </div>
              ))}
            </div>
          )}
        </>}
        <div className="section-label" style={{color:"var(--text2)",marginBottom:16}}>
          Remaining courses — {road.length} semester{road.length!==1?"s":""}
        </div>
        <div className="timeline">
          {road.map((sem,i)=>(
            <div key={i} className="tl-item">
              <div className="tl-dot">{i+1}</div>
              <div className="tl-sem">{sem.sem}</div>
              <div className="tl-courses">
                {sem.courses.map((c,j)=>(
                  <div key={j} className="tl-course">
                    <div className="tl-course-code">{c.code}</div>
                    <div className="tl-course-name">{c.name}</div>
                    <div className="tl-course-cr">{c.credits} credits</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="tl-item">
            <div className="tl-dot grad">🎓</div>
            <div className="grad-box">
              <div className="grad-icon">🎓</div>
              <div>
                <div className="grad-title">Graduation!</div>
                <div className="grad-sub">B.S. in {program.name} · {program.totalCredits} total credits · {sc?.name}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="advisor-note">
          ⚠️ This roadmap is automatically generated based on your transfer credits and degree requirements uploaded by {sc?.name}. Course availability and prerequisites may vary — always confirm your plan with your academic advisor.
        </div>
      </>}

      <div className="btn-row">
        <button className="btn btn-ghost" onClick={onBack}>← Back</button>
        <button className="btn btn-ghost" onClick={onRestart}>Start Over</button>
        <button className="btn btn-primary" onClick={()=>window.print()}>Save / Print</button>
      </div>
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [step,setStep]           = useState(0);
  const [programName,setProgramName] = useState(null);
  const [program,setProgram]     = useState(null);
  const [ccSchool,setCcSchool]   = useState(null);
  const [courses,setCourses]     = useState([]);
  const [schools,setSchools]     = useState(SEED_SCHOOLS);
  const [programs,setPrograms]   = useState(SEED_PROGRAMS);
  const [ccCourses,setCcCourses] = useState(SEED_CC);
  const [requirements,setRequirements] = useState(SEED_REQS);
  const [ready,setReady]         = useState(false);

  useEffect(()=>{
    (async()=>{
      const ver = await db.get("scrt:version");
      if(ver !== DATA_VERSION){
        // New version — wipe old cache, write fresh seed data
        await db.set("scrt:version",      DATA_VERSION);
        await db.set("scrt:schools",      SEED_SCHOOLS);
        await db.set("scrt:programs",     SEED_PROGRAMS);
        await db.set("scrt:courses",      SEED_CC);
        await db.set("scrt:requirements", SEED_REQS);
        // Use seed data directly (already in state as defaults)
      } else {
        // Same version — load admin-edited data from cache
        const ss=await db.get("scrt:schools");      if(ss) setSchools(ss);
        const sp=await db.get("scrt:programs");     if(sp) setPrograms(sp);
        const sc=await db.get("scrt:courses");      if(sc) setCcCourses(sc);
        const sr=await db.get("scrt:requirements"); if(sr) setRequirements(sr);
      }
      setReady(true);
    })();
  },[]);

  const restart = () => { setStep(0); setProgramName(null); setProgram(null); setCcSchool(null); setCourses([]); };

  return (
    <>
      <style>{CSS}</style>
      <div className="app">
        <nav className="nav">
          <div className="logo" onClick={restart} style={{cursor:"pointer"}}>
            <div className="logo-mark">🎓</div>
            <div>
              <div className="logo-text">SCRt</div>
              <div className="logo-sub">Start College Right</div>
            </div>
          </div>
        </nav>

        {!ready ? (
          <p style={{color:"var(--text3)",marginTop:80}}>Loading…</p>
        ) : step===0 ? (
          <div className="hero fade">
            <div className="hero-badge">🎓 Free Transfer Planning Tool</div>
            <h1 className="hero-title">
              Your Transfer.<br/><span>Your Plan.</span>
            </h1>
            <p className="hero-sub">
              Find out exactly which community college courses transfer, how many credits you bring in, and get a personalized semester-by-semester graduation roadmap — in minutes.
            </p>
            <div className="hero-stats">
              <div className="hero-stat"><div className="hero-stat-n">12.4M</div><div className="hero-stat-l">CC Students</div></div>
              <div className="hero-stat"><div className="hero-stat-n">49%</div><div className="hero-stat-l">Plan to Transfer</div></div>
              <div className="hero-stat"><div className="hero-stat-n">70%</div><div className="hero-stat-l">Overspend to Graduate</div></div>
            </div>
            <button className="hero-cta" onClick={()=>setStep(1)}>Plan My Transfer →</button>
          </div>
        ) : (
          <div className="card">
            <Steps step={step}/>
            {step===1 && <StepProgram programs={programs} onSelect={name=>{setProgramName(name);setStep(2);}}/>}
            {step===2 && <StepSchool programName={programName} programs={programs} schools={schools} onSelect={(p,ccId)=>{setProgram(p);setCcSchool(ccId);setStep(3);}} onBack={()=>setStep(1)}/>}
            {step===3 && <StepCourses program={program} ccSchoolId={ccSchool} ccCourses={ccCourses} onSubmit={cs=>{setCourses(cs);setStep(4);}} onBack={()=>setStep(2)}/>}
            {step===4 && <StepResults program={program} courses={courses} schools={schools} onNext={()=>setStep(5)} onBack={()=>setStep(3)}/>}
            {step===5 && <StepRoadmap program={program} courses={courses} schools={schools} requirements={requirements} onRestart={restart} onBack={()=>setStep(4)}/>}
          </div>
        )}

        <footer style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:"var(--text3)",letterSpacing:"0.06em",paddingBottom:24}}>
          SCRt · Start College Right · Built for Community College Students
        </footer>
      </div>
    </>
  );
}
