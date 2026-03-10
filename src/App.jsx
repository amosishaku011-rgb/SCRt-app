import { useState, useEffect } from "react";

// ─── Storage ──────────────────────────────────────────────────────────────────
const DATA_VERSION = "v10";
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
// DATA ARCHITECTURE:
// SEED_SCHOOLS  → all schools (universities + community colleges)
// SEED_PROGRAMS → degree programs offered by universities
// SEED_CC       → CC courses keyed by CC id. Just the course catalog — no transfer info.
//                 {code, name, credits}
// SEED_TRANSFER → transfer rules keyed by programId → array of rules set by UNIVERSITY admin
//                 {ccId, ccCode, mapsTo, acceptedCredits, type:"degree"|"elective"|"none"}
//                 "degree"   = counts toward degree requirements
//                 "elective" = accepted but as free elective only
//                 "none"     = not accepted at all
// SEED_REQS     → degree requirements keyed by programId → array of courses still needed at university
//                 {code, name, credits, semHint}

const SEED_SCHOOLS = [
  // Universities
  {id:"uic",         name:"University of Illinois Chicago",     short:"UIC",    type:"university"},
  {id:"illinois",    name:"Univ. of Illinois Urbana-Champaign", short:"UIUC",   type:"university"},
  {id:"northwestern",name:"Northwestern University",            short:"NU",     type:"university"},
  {id:"depaul",      name:"DePaul University",                  short:"DePaul", type:"university"},
  // Community Colleges
  {id:"cod",         name:"College of DuPage",                  short:"COD",    type:"community"},
  {id:"truman",      name:"Harry S Truman College",             short:"Truman", type:"community"},
  {id:"oakton",      name:"Oakton Community College",           short:"Oakton", type:"community"},
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
// ── CC Course Catalogs (uploaded by CC admins) ────────────────────────────────
// Just the course list — no transfer info here. University decides what transfers.
const SEED_CC = {
  cod:[
    {code:"MATH 2231",name:"Calculus I",                  credits:5},
    {code:"MATH 2232",name:"Calculus II",                 credits:4},
    {code:"MATH 2233",name:"Calculus III",                credits:4},
    {code:"MATH 2255",name:"Differential Equations",      credits:3},
    {code:"PHYS 2111",name:"Physics I — Mechanics",       credits:4},
    {code:"PHYS 2112",name:"Physics II — E&M",            credits:4},
    {code:"CHEM 1551",name:"General Chemistry I",         credits:4},
    {code:"CHEM 1552",name:"General Chemistry II",        credits:4},
    {code:"CHEM 1553",name:"Gen. Chemistry Lab I",        credits:1},
    {code:"CHEM 1554",name:"Gen. Chemistry Lab II",       credits:1},
    {code:"CHEM 2210",name:"Organic Chemistry I",         credits:4},
    {code:"ENGR 1100",name:"Introduction to Engineering", credits:1},
    {code:"CIS 2531", name:"Scientific Programming",      credits:3},
    {code:"ENGL 1101",name:"Composition I",               credits:3},
    {code:"ENGL 1102",name:"Composition II",              credits:3},
    {code:"ECON 2201",name:"Microeconomics",              credits:3},
    {code:"ECON 2202",name:"Macroeconomics",              credits:3},
    {code:"ACCT 1101",name:"Financial Accounting",        credits:4},
    {code:"BIOL 1151",name:"Anatomy & Physiology I",      credits:4},
    {code:"BIOL 1152",name:"Anatomy & Physiology II",     credits:4},
    {code:"BIOL 2210",name:"Microbiology",                credits:4},
    {code:"PSYC 1100",name:"General Psychology",          credits:3},
  ],
  truman:[
    {code:"MTH 205",  name:"Calculus I",                  credits:5},
    {code:"MTH 206",  name:"Calculus II",                 credits:4},
    {code:"MTH 207",  name:"Calculus III",                credits:4},
    {code:"MTH 212",  name:"Differential Equations",      credits:3},
    {code:"PHY 201",  name:"Physics I — Mechanics",       credits:4},
    {code:"PHY 202",  name:"Physics II — E&M",            credits:4},
    {code:"CHM 201",  name:"General Chemistry I",         credits:4},
    {code:"CHM 202",  name:"General Chemistry II",        credits:4},
    {code:"CHM 201L", name:"Gen. Chemistry Lab I",        credits:1},
    {code:"CHM 202L", name:"Gen. Chemistry Lab II",       credits:1},
    {code:"CHM 211",  name:"Organic Chemistry I",         credits:4},
    {code:"ENG 101",  name:"Composition I",               credits:3},
    {code:"ENG 102",  name:"Composition II",              credits:3},
    {code:"CSC 111",  name:"Scientific Programming",      credits:3},
    {code:"ECO 201",  name:"Microeconomics",              credits:3},
    {code:"ECO 202",  name:"Macroeconomics",              credits:3},
    {code:"ACC 101",  name:"Financial Accounting",        credits:4},
    {code:"BIO 201",  name:"Anatomy & Physiology I",      credits:4},
    {code:"BIO 202",  name:"Anatomy & Physiology II",     credits:4},
    {code:"PSY 101",  name:"General Psychology",          credits:3},
  ],
  oakton:[
    {code:"MAT 251",  name:"Calculus I",                  credits:5},
    {code:"MAT 252",  name:"Calculus II",                 credits:4},
    {code:"MAT 253",  name:"Calculus III",                credits:4},
    {code:"MAT 260",  name:"Differential Equations",      credits:3},
    {code:"PHY 221",  name:"Physics I — Mechanics",       credits:4},
    {code:"PHY 222",  name:"Physics II — E&M",            credits:4},
    {code:"CHM 210",  name:"General Chemistry I",         credits:4},
    {code:"CHM 211",  name:"General Chemistry II",        credits:4},
    {code:"CHM 210L", name:"Gen. Chemistry Lab I",        credits:1},
    {code:"CHM 211L", name:"Gen. Chemistry Lab II",       credits:1},
    {code:"CHM 220",  name:"Organic Chemistry I",         credits:4},
    {code:"EGL 101",  name:"Composition I",               credits:3},
    {code:"EGL 102",  name:"Composition II",              credits:3},
    {code:"CSC 155",  name:"Scientific Programming",      credits:3},
    {code:"ECN 211",  name:"Microeconomics",              credits:3},
    {code:"ECN 212",  name:"Macroeconomics",              credits:3},
    {code:"ACT 101",  name:"Financial Accounting",        credits:4},
    {code:"BIO 231",  name:"Anatomy & Physiology I",      credits:4},
    {code:"BIO 232",  name:"Anatomy & Physiology II",     credits:4},
    {code:"PSY 101",  name:"General Psychology",          credits:3},
  ],
};

// ── Transfer Rules (set by UNIVERSITY admin, per program) ─────────────────────
// type: "degree"   = counts toward degree requirements
//       "elective" = accepted but only as free elective credit
//       "reduced"  = transfers toward degree but fewer credits accepted
//       "none"     = not accepted at all
// ccId: which CC this rule applies to
// ccCode: the CC course code
// mapsTo: equivalent university course code
// acceptedCredits: only for "reduced" type — how many credits the university accepts
const SEED_TRANSFER = {
  // ── UIC Chemical Engineering ───────────────────────────────────────────────
  che_uic:[
    // College of DuPage
    {ccId:"cod",ccCode:"MATH 2231",mapsTo:"MATH 180",type:"degree",acceptedCredits:5},
    {ccId:"cod",ccCode:"MATH 2232",mapsTo:"MATH 181",type:"degree",acceptedCredits:4},
    {ccId:"cod",ccCode:"MATH 2233",mapsTo:"MATH 210",type:"degree",acceptedCredits:4},
    {ccId:"cod",ccCode:"MATH 2255",mapsTo:"MATH 220",type:"degree",acceptedCredits:3},
    {ccId:"cod",ccCode:"PHYS 2111",mapsTo:"PHYS 141",type:"degree",acceptedCredits:4},
    {ccId:"cod",ccCode:"PHYS 2112",mapsTo:"PHYS 142",type:"degree",acceptedCredits:4},
    {ccId:"cod",ccCode:"CHEM 1551",mapsTo:"CHEM 122",type:"reduced",acceptedCredits:3},  // 4cr earned, 3cr accepted
    {ccId:"cod",ccCode:"CHEM 1552",mapsTo:"CHEM 123",type:"reduced",acceptedCredits:3},
    {ccId:"cod",ccCode:"CHEM 1553",mapsTo:"CHEM 124",type:"degree", acceptedCredits:1},
    {ccId:"cod",ccCode:"CHEM 1554",mapsTo:"CHEM 125",type:"degree", acceptedCredits:1},
    {ccId:"cod",ccCode:"CHEM 2210",mapsTo:"CHEM 232",type:"degree", acceptedCredits:4},
    {ccId:"cod",ccCode:"ENGR 1100",mapsTo:"ENGR 100",type:"degree", acceptedCredits:1},
    {ccId:"cod",ccCode:"CIS 2531", mapsTo:"CS 109",  type:"degree", acceptedCredits:3},
    {ccId:"cod",ccCode:"ENGL 1101",mapsTo:"ENGL 160",type:"elective",acceptedCredits:3}, // CHE doesn't require English
    {ccId:"cod",ccCode:"ENGL 1102",mapsTo:"ENGL 161",type:"elective",acceptedCredits:3},
    {ccId:"cod",ccCode:"ECON 2201",mapsTo:null,       type:"none"},   // not accepted for CHE
    {ccId:"cod",ccCode:"ECON 2202",mapsTo:null,       type:"none"},
    {ccId:"cod",ccCode:"ACCT 1101",mapsTo:null,       type:"none"},
    {ccId:"cod",ccCode:"BIOL 1151",mapsTo:null,       type:"none"},   // Biology not relevant to CHE at UIC
    {ccId:"cod",ccCode:"BIOL 1152",mapsTo:null,       type:"none"},
    {ccId:"cod",ccCode:"BIOL 2210",mapsTo:null,       type:"none"},
    {ccId:"cod",ccCode:"PSYC 1100",mapsTo:null,       type:"none"},
    // Harry S Truman College
    {ccId:"truman",ccCode:"MTH 205",  mapsTo:"MATH 180",type:"degree", acceptedCredits:5},
    {ccId:"truman",ccCode:"MTH 206",  mapsTo:"MATH 181",type:"degree", acceptedCredits:4},
    {ccId:"truman",ccCode:"MTH 207",  mapsTo:"MATH 210",type:"degree", acceptedCredits:4},
    {ccId:"truman",ccCode:"MTH 212",  mapsTo:"MATH 220",type:"degree", acceptedCredits:3},
    {ccId:"truman",ccCode:"PHY 201",  mapsTo:"PHYS 141",type:"degree", acceptedCredits:4},
    {ccId:"truman",ccCode:"PHY 202",  mapsTo:"PHYS 142",type:"degree", acceptedCredits:4},
    {ccId:"truman",ccCode:"CHM 201",  mapsTo:"CHEM 122",type:"reduced",acceptedCredits:3},
    {ccId:"truman",ccCode:"CHM 202",  mapsTo:"CHEM 123",type:"degree", acceptedCredits:4},
    {ccId:"truman",ccCode:"CHM 201L", mapsTo:"CHEM 124",type:"degree", acceptedCredits:1},
    {ccId:"truman",ccCode:"CHM 202L", mapsTo:"CHEM 125",type:"degree", acceptedCredits:1},
    {ccId:"truman",ccCode:"CHM 211",  mapsTo:"CHEM 232",type:"degree", acceptedCredits:4},
    {ccId:"truman",ccCode:"CSC 111",  mapsTo:"CS 109",  type:"degree", acceptedCredits:3},
    {ccId:"truman",ccCode:"ENG 101",  mapsTo:"ENGL 160",type:"elective",acceptedCredits:3},
    {ccId:"truman",ccCode:"ENG 102",  mapsTo:"ENGL 161",type:"elective",acceptedCredits:3},
    {ccId:"truman",ccCode:"ECO 201",  mapsTo:null,       type:"none"},
    {ccId:"truman",ccCode:"ECO 202",  mapsTo:null,       type:"none"},
    {ccId:"truman",ccCode:"ACC 101",  mapsTo:null,       type:"none"},
    {ccId:"truman",ccCode:"BIO 201",  mapsTo:null,       type:"none"},
    {ccId:"truman",ccCode:"BIO 202",  mapsTo:null,       type:"none"},
    {ccId:"truman",ccCode:"PSY 101",  mapsTo:null,       type:"none"},
    // Oakton Community College
    {ccId:"oakton",ccCode:"MAT 251",  mapsTo:"MATH 180",type:"degree", acceptedCredits:5},
    {ccId:"oakton",ccCode:"MAT 252",  mapsTo:"MATH 181",type:"degree", acceptedCredits:4},
    {ccId:"oakton",ccCode:"MAT 253",  mapsTo:"MATH 210",type:"degree", acceptedCredits:4},
    {ccId:"oakton",ccCode:"MAT 260",  mapsTo:"MATH 220",type:"degree", acceptedCredits:3},
    {ccId:"oakton",ccCode:"PHY 221",  mapsTo:"PHYS 141",type:"degree", acceptedCredits:4},
    {ccId:"oakton",ccCode:"PHY 222",  mapsTo:"PHYS 142",type:"degree", acceptedCredits:4},
    {ccId:"oakton",ccCode:"CHM 210",  mapsTo:"CHEM 122",type:"reduced",acceptedCredits:3},
    {ccId:"oakton",ccCode:"CHM 211",  mapsTo:"CHEM 123",type:"degree", acceptedCredits:4},
    {ccId:"oakton",ccCode:"CHM 210L", mapsTo:"CHEM 124",type:"degree", acceptedCredits:1},
    {ccId:"oakton",ccCode:"CHM 211L", mapsTo:"CHEM 125",type:"degree", acceptedCredits:1},
    {ccId:"oakton",ccCode:"CHM 220",  mapsTo:"CHEM 232",type:"degree", acceptedCredits:4},
    {ccId:"oakton",ccCode:"CSC 155",  mapsTo:"CS 109",  type:"degree", acceptedCredits:3},
    {ccId:"oakton",ccCode:"EGL 101",  mapsTo:"ENGL 160",type:"elective",acceptedCredits:3},
    {ccId:"oakton",ccCode:"EGL 102",  mapsTo:"ENGL 161",type:"elective",acceptedCredits:3},
    {ccId:"oakton",ccCode:"ECN 211",  mapsTo:null,       type:"none"},
    {ccId:"oakton",ccCode:"ECN 212",  mapsTo:null,       type:"none"},
    {ccId:"oakton",ccCode:"ACT 101",  mapsTo:null,       type:"none"},
    {ccId:"oakton",ccCode:"BIO 231",  mapsTo:null,       type:"none"},
    {ccId:"oakton",ccCode:"BIO 232",  mapsTo:null,       type:"none"},
    {ccId:"oakton",ccCode:"PSY 101",  mapsTo:null,       type:"none"},
  ],
  // ── UIC Nursing ───────────────────────────────────────────────────────────
  nurs_uic:[
    {ccId:"cod",ccCode:"BIOL 1151",mapsTo:"BIOS 250",type:"degree", acceptedCredits:4},
    {ccId:"cod",ccCode:"BIOL 1152",mapsTo:"BIOS 251",type:"degree", acceptedCredits:4},
    {ccId:"cod",ccCode:"BIOL 2210",mapsTo:"BIOS 220",type:"degree", acceptedCredits:4},
    {ccId:"cod",ccCode:"CHEM 1551",mapsTo:"CHEM 112",type:"degree", acceptedCredits:4},
    {ccId:"cod",ccCode:"PSYC 1100",mapsTo:"PSYC 100",type:"degree", acceptedCredits:3},
    {ccId:"cod",ccCode:"ENGL 1101",mapsTo:"ENGL 160",type:"degree", acceptedCredits:3},
    {ccId:"cod",ccCode:"MATH 2231",mapsTo:null,       type:"none"},   // Calc not needed for Nursing
    {ccId:"truman",ccCode:"BIO 201",  mapsTo:"BIOS 250",type:"degree",acceptedCredits:4},
    {ccId:"truman",ccCode:"BIO 202",  mapsTo:"BIOS 251",type:"degree",acceptedCredits:4},
    {ccId:"truman",ccCode:"CHM 201",  mapsTo:"CHEM 112",type:"degree",acceptedCredits:4},
    {ccId:"truman",ccCode:"PSY 101",  mapsTo:"PSYC 100",type:"degree",acceptedCredits:3},
    {ccId:"truman",ccCode:"ENG 101",  mapsTo:"ENGL 160",type:"degree",acceptedCredits:3},
    {ccId:"oakton",ccCode:"BIO 231",  mapsTo:"BIOS 250",type:"degree",acceptedCredits:4},
    {ccId:"oakton",ccCode:"BIO 232",  mapsTo:"BIOS 251",type:"degree",acceptedCredits:4},
    {ccId:"oakton",ccCode:"CHM 210",  mapsTo:"CHEM 112",type:"degree",acceptedCredits:4},
    {ccId:"oakton",ccCode:"PSY 101",  mapsTo:"PSYC 100",type:"degree",acceptedCredits:3},
    {ccId:"oakton",ccCode:"EGL 101",  mapsTo:"ENGL 160",type:"degree",acceptedCredits:3},
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
          <div className="credit-lbl">Courses Selected</div>
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
function StepResults({program, selectedCourses, ccSchoolId, transferRules, schools, onNext, onBack}) {
  // selectedCourses = CC courses the student ticked {code, name, credits}
  // transferRules[programId] = array of {ccId, ccCode, mapsTo, type, acceptedCredits}
  // type: "degree" | "elective" | "reduced" | "none"

  const rules = (transferRules[program.id]||[]).filter(r=>r.ccId===ccSchoolId);
  const ruleMap = {}; // ccCode → rule
  rules.forEach(r=>{ ruleMap[r.ccCode]=r; });

  const toward   = []; // full credit toward degree
  const reduced  = []; // reduced credits toward degree
  const elective = []; // elective only
  const none     = []; // not accepted

  selectedCourses.forEach(course => {
    const rule = ruleMap[course.code];
    if (!rule || rule.type==="none") {
      none.push({...course, rule});
    } else if (rule.type==="degree") {
      toward.push({...course, mapsTo:rule.mapsTo, acceptedCredits:rule.acceptedCredits});
    } else if (rule.type==="reduced") {
      reduced.push({...course, mapsTo:rule.mapsTo, acceptedCredits:rule.acceptedCredits});
    } else if (rule.type==="elective") {
      elective.push({...course, mapsTo:rule.mapsTo, acceptedCredits:rule.acceptedCredits});
    } else {
      none.push({...course, rule});
    }
  });

  const degreeCr   = toward.reduce((a,c)=>a+c.acceptedCredits,0) + reduced.reduce((a,c)=>a+c.acceptedCredits,0);
  const electiveCr = elective.reduce((a,c)=>a+c.acceptedCredits,0);
  const pct = Math.min(100, Math.round((degreeCr/program.totalCredits)*100));
  const sc  = schools.find(s=>s.id===program.school);

  return (
    <div className="fade">
      <h2 className="step-title">Transfer Report</h2>
      <p className="step-sub">{program.icon} {program.name} at {sc?.short||sc?.name} · Here is what transfers.</p>

      <div className="stat-grid">
        <div className="stat-box g">
          <div className="stat-num">{degreeCr}</div>
          <div className="stat-lbl">Degree Credits</div>
          <div className="stat-sub">{toward.length+reduced.length} course{(toward.length+reduced.length)!==1?"s":""}</div>
        </div>
        <div className="stat-box a">
          <div className="stat-num">{electiveCr}</div>
          <div className="stat-lbl">Elective Credits</div>
          <div className="stat-sub">{elective.length} course{elective.length!==1?"s":""}</div>
        </div>
        <div className="stat-box p">
          <div className="stat-num">{pct}%</div>
          <div className="stat-lbl">Of Degree Done</div>
        </div>
      </div>
      <div className="prog-bar-bg"><div className="prog-bar-fill" style={{width:pct+"%"}}/></div>

      {toward.length>0 && <>
        <div className="section-label" style={{color:"var(--accent4)",marginBottom:10,marginTop:18}}>
          ✅ Transfers Toward Degree ({toward.length} courses · {toward.reduce((a,c)=>a+c.acceptedCredits,0)} credits)
        </div>
        <div className="result-list">
          {toward.map(c=>(
            <div key={c.code} className="result-row xfer">
              <span className="r-code g">{c.code}</span>
              <span className="r-name">{c.name}</span>
              <span className="r-tag g">{c.acceptedCredits}cr → {c.mapsTo}</span>
            </div>
          ))}
        </div>
      </>}

      {reduced.length>0 && <>
        <div className="section-label" style={{color:"#ff9f43",marginBottom:6,marginTop:18}}>
          ⚠️ Transfers With Reduced Credits ({reduced.length} courses)
        </div>
        <p style={{fontSize:12,color:"var(--text3)",marginBottom:10,fontFamily:"Inter,sans-serif"}}>
          These courses transfer toward your degree but {sc?.short||sc?.name} awards fewer credits than you earned.
        </p>
        <div className="result-list">
          {reduced.map(c=>(
            <div key={c.code} className="result-row" style={{borderColor:"#ff9f4340",background:"#ff9f4308"}}>
              <span className="r-code" style={{color:"#ff9f43"}}>{c.code}</span>
              <span className="r-name">{c.name}</span>
              <span className="r-tag" style={{background:"#ff9f4320",color:"#ff9f43"}}>
                {c.credits}cr earned → {c.acceptedCredits}cr accepted · {c.mapsTo}
              </span>
            </div>
          ))}
        </div>
      </>}

      {elective.length>0 && <>
        <div className="section-label" style={{color:"#a29bfe",marginBottom:6,marginTop:18}}>
          📚 Transfers as Elective Only ({elective.length} courses · {electiveCr} credits)
        </div>
        <p style={{fontSize:12,color:"var(--text3)",marginBottom:10,fontFamily:"Inter,sans-serif"}}>
          {sc?.short||sc?.name} accepts these but they do not count toward your {program.name} degree requirements.
        </p>
        <div className="result-list">
          {elective.map(c=>(
            <div key={c.code} className="result-row" style={{borderColor:"#a29bfe30",background:"#a29bfe08"}}>
              <span className="r-code" style={{color:"#a29bfe"}}>{c.code}</span>
              <span className="r-name">{c.name}</span>
              <span className="r-tag" style={{background:"#a29bfe20",color:"#a29bfe"}}>{c.acceptedCredits}cr · elective only</span>
            </div>
          ))}
        </div>
      </>}

      {none.length>0 && <>
        <div className="section-label" style={{color:"var(--accent2)",marginBottom:6,marginTop:18}}>
          ❌ Does Not Transfer ({none.length} courses)
        </div>
        <p style={{fontSize:12,color:"var(--text3)",marginBottom:10,fontFamily:"Inter,sans-serif"}}>
          {sc?.short||sc?.name} does not accept these courses for the {program.name} program.
        </p>
        <div className="result-list">
          {none.map(c=>(
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
        <button className="btn btn-primary" onClick={()=>onNext({toward,reduced,elective,none})}>Build My Roadmap →</button>
      </div>
    </div>
  );
}

// ─── Step 5: Roadmap ──────────────────────────────────────────────────────────
function StepRoadmap({program, selectedCourses, ccSchoolId, transferRules, schools, requirements, onRestart, onBack}) {
  const [showMet, setShowMet] = useState(false);
  // courses that count toward degree = toward + reduced
  const cats = selectedCourses; // {toward, reduced, elective, none}
  const degreeTransfers = [...(cats.toward||[]), ...(cats.reduced||[])];
  const xferCodes = new Set(degreeTransfers.flatMap(c=>[c.code, c.mapsTo].filter(Boolean)));
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
  const [transferRules,setTransferRules] = useState(SEED_TRANSFER);
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
        await db.set("scrt:transfer",     SEED_TRANSFER);
        await db.set("scrt:requirements", SEED_REQS);
        // Use seed data directly (already in state as defaults)
      } else {
        // Same version — load admin-edited data from cache
        const ss=await db.get("scrt:schools");      if(ss) setSchools(ss);
        const sp=await db.get("scrt:programs");     if(sp) setPrograms(sp);
        const sc=await db.get("scrt:courses");      if(sc) setCcCourses(sc);
        const st=await db.get("scrt:transfer");     if(st) setTransferRules(st);
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
            {step===4 && <StepResults program={program} selectedCourses={courses} ccSchoolId={ccSchool} transferRules={transferRules} schools={schools} onNext={(cats)=>{setCourses(cats);setStep(5);}} onBack={()=>setStep(3)}/>}
            {step===5 && <StepRoadmap program={program} selectedCourses={courses} ccSchoolId={ccSchool} transferRules={transferRules} schools={schools} requirements={requirements} onRestart={restart} onBack={()=>setStep(4)}/>}
          </div>
        )}

        <footer style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:"var(--text3)",letterSpacing:"0.06em",paddingBottom:24}}>
          SCRt · Start College Right · Built for Community College Students
        </footer>
      </div>
    </>
  );
}
