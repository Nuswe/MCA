import { GoogleGenAI } from "@google/genai";

const TIMETABLE_DATA_CONTEXT = `
MALAWI COLLEGE OF ACCOUNTANCY
END SEMESTER EXAMINATIONS TIMETABLE (MARCH 2026)

PRACTICAL EXAMS (March 9 - 13, 2026):
- 9-Mar-26: STC224 (09:00-12:00 & 13:00-16:00)
- 10-Mar-26: IWD212 (09:00-12:00), DWD222 (13:00-16:00)
- 11-Mar-26: HSS223 (BT) (09:00-12:00), INP121 (13:00-16:00)
- 12-Mar-26: DAD313 (09:00-12:00), IWD212 (09:00-12:00), ACN315 (13:00-16:00)
- 13-Mar-26: PRC214 (09:00-12:00), PMI314 (09:00-12:00), SEA314 (13:00-16:00)

THEORY EXAMS (March 16 - 20, 2026):
Morning Session (09:00 - 12:00):
- 16-Mar (Mon): IBM114, ISM311, MAD411, BRG-BUC100, EVM311, DIB411, ICC311, AAA421, ECG412, CFR411
- 17-Mar (Tue): BUL116, ISS421, RMA412, PRM121, BRG-BUE100, BOM413, FIA212, PMI312, NPD421, STC224, IMS312, IAP421, IS413, MFP322, MAR212
- 18-Mar (Wed): MOB115, MGA313, SPM413, IWD212, IBT323, CON225, MIN313
- 19-Mar (Thu): FIA113, QTD315, TRM423, IWD212, PMI314, SMP413, BIS213, SSM314 (new), BRM324, OOA222, PPI223, MMP314
- 20-Mar (Fri): BUE112, VBM315, REC414, BUC216, ET414, BAD422, RSM215, SPR414

Afternoon Session (13:00 - 16:00):
- 16-Mar (Mon): AUD225, EDM311, BPS411, MAF223, MIM311, CRU414, DWD222, COF321, AAS311, PUR213, BUS215
- 17-Mar (Tue): BUL121, DBM312, SFM412, INP121, PSM313, OM412, ISA211, BAL312, MAC211, INB312, FMI222
- 18-Mar (Wed): MAE214, FBA313, SMM413, COA221, FIM322, SEA314, ICA124, PRM315, SEA312
- 19-Mar (Thu): BUC111, DAD313, EGS412, MIS223, RIM314, STM411, TAX222, FRA321, CIM421, BRG-IBM100, SSM315 (old), ADD322
- 20-Mar (Fri): COL211, PJM314, DBI315, PRC214, ACN315, BRG-FIA100, IPR212, PMB325, CRM415, TAX224, HSS223, IMC312
`;

export interface ExamInfo {
  courseCode: string;
  courseName: string;
  examType: 'Mid-Semester' | 'End-Semester' | 'Practical';
  date: string;
  time: string;
  venue: string;
  notes?: string;
}

export interface TimetableEntry {
  date: string;
  day: string;
  session: 'Morning' | 'Afternoon';
  modules: string[];
  type: 'Practical' | 'Theory';
}

export const FULL_TIMETABLE: TimetableEntry[] = [
  // Practicals
  { date: '2026-03-09', day: 'Monday', session: 'Morning', modules: ['STC224'], type: 'Practical' },
  { date: '2026-03-09', day: 'Monday', session: 'Afternoon', modules: ['STC224'], type: 'Practical' },
  { date: '2026-03-10', day: 'Tuesday', session: 'Morning', modules: ['IWD212'], type: 'Practical' },
  { date: '2026-03-10', day: 'Tuesday', session: 'Afternoon', modules: ['DWD222'], type: 'Practical' },
  { date: '2026-03-11', day: 'Wednesday', session: 'Morning', modules: ['HSS223 (BT)'], type: 'Practical' },
  { date: '2026-03-11', day: 'Wednesday', session: 'Afternoon', modules: ['INP121'], type: 'Practical' },
  { date: '2026-03-12', day: 'Thursday', session: 'Morning', modules: ['DAD313', 'IWD212'], type: 'Practical' },
  { date: '2026-03-12', day: 'Thursday', session: 'Afternoon', modules: ['ACN315'], type: 'Practical' },
  { date: '2026-03-13', day: 'Friday', session: 'Morning', modules: ['PRC214', 'PMI314'], type: 'Practical' },
  { date: '2026-03-13', day: 'Friday', session: 'Afternoon', modules: ['SEA314'], type: 'Practical' },
  // Theory - Morning
  { date: '2026-03-16', day: 'Monday', session: 'Morning', modules: ['IBM114', 'ISM311', 'MAD411', 'BRG-BUC100', 'EVM311', 'DIB411', 'ICC311', 'AAA421', 'ECG412', 'CFR411'], type: 'Theory' },
  { date: '2026-03-17', day: 'Tuesday', session: 'Morning', modules: ['BUL116', 'ISS421', 'RMA412', 'PRM121', 'BRG-BUE100', 'BOM413', 'FIA212', 'PMI312', 'NPD421', 'STC224', 'IMS312', 'IAP421', 'IS413', 'MFP322', 'MAR212'], type: 'Theory' },
  { date: '2026-03-18', day: 'Wednesday', session: 'Morning', modules: ['MOB115', 'MGA313', 'SPM413', 'IWD212', 'IBT323', 'CON225', 'MIN313'], type: 'Theory' },
  { date: '2026-03-19', day: 'Thursday', session: 'Morning', modules: ['FIA113', 'QTD315', 'TRM423', 'IWD212', 'PMI314', 'SMP413', 'BIS213', 'SSM314 (new)', 'BRM324', 'OOA222', 'PPI223', 'MMP314'], type: 'Theory' },
  { date: '2026-03-20', day: 'Friday', session: 'Morning', modules: ['BUE112', 'VBM315', 'REC414', 'BUC216', 'ET414', 'BAD422', 'RSM215', 'SPR414'], type: 'Theory' },
  // Theory - Afternoon
  { date: '2026-03-16', day: 'Monday', session: 'Afternoon', modules: ['AUD225', 'EDM311', 'BPS411', 'MAF223', 'MIM311', 'CRU414', 'DWD222', 'COF321', 'AAS311', 'PUR213', 'BUS215'], type: 'Theory' },
  { date: '2026-03-17', day: 'Tuesday', session: 'Afternoon', modules: ['BUL121', 'DBM312', 'SFM412', 'INP121', 'PSM313', 'OM412', 'ISA211', 'BAL312', 'MAC211', 'INB312', 'FMI222'], type: 'Theory' },
  { date: '2026-03-18', day: 'Wednesday', session: 'Afternoon', modules: ['MAE214', 'FBA313', 'SMM413', 'COA221', 'FIM322', 'SEA314', 'ICA124', 'PRM315', 'SEA312'], type: 'Theory' },
  { date: '2026-03-19', day: 'Thursday', session: 'Afternoon', modules: ['BUC111', 'DAD313', 'EGS412', 'MIS223', 'RIM314', 'STM411', 'TAX222', 'FRA321', 'CIM421', 'BRG-IBM100', 'SSM315 (old)', 'ADD322'], type: 'Theory' },
  { date: '2026-03-20', day: 'Friday', session: 'Afternoon', modules: ['COL211', 'PJM314', 'DBI315', 'PRC214', 'ACN315', 'BRG-FIA100', 'IPR212', 'PMB325', 'CRM415', 'TAX224', 'HSS223', 'IMC312'], type: 'Theory' },
];

export const ALL_MODULES = Array.from(new Set(FULL_TIMETABLE.flatMap(entry => entry.modules))).sort();

export const MODULE_NAMES: Record<string, string> = {
  'BUC111': 'Business Communication',
  'BUE112': 'Business Environment',
  'FIA113': 'Financial Accounting',
  'IBM114': 'Introduction to Business Mathematics',
  'MOB115': 'Management & Organisational Behavior',
  'BUL116': 'Business Law I',
  'INP121': 'Introduction to Programming',
  'EPD122': 'Ethics and Professional Development in IT',
  'ENF123': 'Entrepreneurship Fundamentals',
  'ICA124': 'Introduction to Cost Accounting',
  'INT125': 'Information Technology',
  'ISD211': 'Information Systems Development',
  'IWD212': 'Introduction to Web Development',
  'BIS213': 'Business Information Systems',
  'DAA214': 'Database Applications',
  'BUS215': 'Business Statistics',
  'BUC216': 'Business Communication (Advanced/Level 2)',
  'OAD221': 'Object Oriented Analysis and Design',
  'DWD222': 'Dynamic Website Development',
  'HSS223': 'Hardware and Software Systems',
  'STC224': 'Statistical Computing',
  'NET225': 'Networking',
  'ISM311': 'Information Systems Management',
  'DAD313': 'Database Development',
  'PMI314': 'Project Management for Information Systems',
  'SEA314': 'Server Administration',
  'ACN315': 'Advanced Computer Networking',
  'OOP321': 'Object Oriented Programming',
  'ADD322': 'Advanced Database Development and Administration',
  'CAC323': 'Computer Audit & IT Controls',
  'BRM324': 'Business Research Methods',
  'ECB325': 'E-Commerce & E-Business',
  'MAD411': 'Mobile Application Development',
  'EGS412': 'E-Government Strategy',
  'IS413': 'Information Security',
  'ET414': 'Emerging Technologies',
  'ISS421': 'Information Systems Strategy',
};

const MODULE_NAME_MAPPING_TEXT = Object.entries(MODULE_NAMES)
  .map(([code, name]) => `${code}: ${name}`)
  .join('\n');

export async function findExamInfo(courseQuery: string): Promise<ExamInfo[]> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
  
  const prompt = `
    Based on the official MCA End Semester Timetable and Module Mapping provided below, find the exam details for: "${courseQuery}".
    
    Timetable Data: ${TIMETABLE_DATA_CONTEXT}
    
    Module Name Mapping: ${MODULE_NAME_MAPPING_TEXT}
    
    Instructions:
    1. Search for the module code or course name in the data. Use the Module Name Mapping to translate between codes and full names.
    2. If you find a match, return the exact date and time from the timetable.
    3. If the user searches for a name like "Accounting", find all modules that sound relevant (e.g., FIA, IFA, MAF, COA).
    4. Use the provided Module Name Mapping as the primary source for course names.
    5. Note: Some codes in the timetable might have slight variations (e.g., IFA113 vs FIA113, IWD122 vs IWD212). Use your reasoning to match them if they refer to the same subject.
    
    Return the result as a JSON array of objects:
    {
      "courseCode": "The module code found",
      "courseName": "The full name of the course from the mapping",
      "examType": "End-Semester" or "Practical",
      "date": "YYYY-MM-DD",
      "time": "09:00 - 12:00" or "13:00 - 16:00",
      "venue": "MCA Campus",
      "notes": "Any specific details"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    if (!text) return [];
    const parsed = JSON.parse(text);
    if (!parsed) return [];
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (error) {
    console.error("Error finding exam info:", error);
    return [];
  }
}

export function generateGoogleCalendarUrl(exam: ExamInfo): string {
  const [startTime, endTime] = exam.time.split(' - ').map(t => t.trim());
  
  // Format date for Google Calendar: YYYYMMDDTHHMMSSZ
  const dateStr = exam.date.replace(/-/g, '');
  const start = `${dateStr}T${startTime.replace(':', '')}00`;
  const end = `${dateStr}T${endTime.replace(':', '')}00`;
  
  const details = `Exam for ${exam.courseName} (${exam.courseCode}). Type: ${exam.examType}. Venue: ${exam.venue}.`;
  
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `EXAM: ${exam.courseCode} - ${exam.courseName}`,
    dates: `${start}/${end}`,
    details: details,
    location: exam.venue,
    trp: 'true'
  });

  return `https://www.google.com/calendar/render?${params.toString()}`;
}
