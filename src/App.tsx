import { Bell, BellRing, Calendar, CalendarPlus, ChevronRight, Clock, GraduationCap, Info, List, Loader2, MapPin, Search, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import React, { useEffect, useRef, useState } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ALL_MODULES, findExamInfo, FULL_TIMETABLE, generateGoogleCalendarUrl, MODULE_NAMES, type ExamInfo } from './services/examService';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ExamInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [showFullTimetable, setShowFullTimetable] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [examTypeFilter, setExamTypeFilter] = useState<'All' | 'End-Semester' | 'Practical'>('All');
  const [hints, setHints] = useState<string[]>([]);
  const [showHints, setShowHints] = useState(false);
  const [loadingTimetable, setLoadingTimetable] = useState(false);
  const [showRemindersPortal, setShowRemindersPortal] = useState(false);
  const [reminders, setReminders] = useState<ExamInfo[]>(() => {
    const saved = localStorage.getItem('mca_exam_reminders_v2');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('mca_exam_reminders_v2', JSON.stringify(reminders));
  }, [reminders]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleReminder = (e: React.MouseEvent, exam: ExamInfo) => {
    e.stopPropagation();
    const isSet = reminders.some(r => r.courseCode === exam.courseCode && r.date === exam.date);
    if (isSet) {
      setReminders(reminders.filter(r => !(r.courseCode === exam.courseCode && r.date === exam.date)));
    } else {
      if ("Notification" in window) {
        Notification.requestPermission().then(permission => {
          if (permission === "granted") {
            setReminders([...reminders, exam]);
          } else {
            alert("Please enable notifications to set reminders.");
          }
        });
      } else {
        setReminders([...reminders, exam]);
      }
    }
  };

  const calculateCountdown = (examDate: string, examTime: string) => {
    const [startTime] = examTime.split(' - ');
    const targetDate = new Date(`${examDate}T${startTime}:00`);
    const diff = targetDate.getTime() - currentTime.getTime();

    if (diff <= 0) return "EXAM IN PROGRESS / FINISHED";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m ${seconds}s`;
    }
  };

  useEffect(() => {
    if (query.length >= 2) {
      const filteredHints = ALL_MODULES.filter(m => 
        m.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8);
      setHints(filteredHints);
      setShowHints(true);
    } else {
      setHints([]);
      setShowHints(false);
    }
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowHints(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (e?: React.FormEvent | string) => {
    if (typeof e !== 'string' && e) e.preventDefault();
    const searchQuery = typeof e === 'string' ? e : query;
    if (!searchQuery.trim()) return;

    if (typeof e === 'string') setQuery(e);
    
    setLoading(true);
    setSearched(true);
    setShowFullTimetable(false);
    setShowHints(false);
    try {
      const data = await findExamInfo(searchQuery);
      setResults(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredResults = (Array.isArray(results) ? results : []).filter(exam => {
    const matchesType = examTypeFilter === 'All' || exam.examType === examTypeFilter;
    const examDate = new Date(exam.date);
    const matchesStart = !startDate || examDate >= new Date(startDate);
    const matchesEnd = !endDate || examDate <= new Date(endDate);
    return matchesType && matchesStart && matchesEnd;
  });

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans selection:bg-[#141414] selection:text-[#E4E3E0]">
      {/* Header Section */}
      <header className="border-b border-[#141414] p-6 md:p-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <GraduationCap className="w-6 h-6" />
              <span className="text-xs font-mono uppercase tracking-widest opacity-60">Malawi College of Accountancy</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-serif italic tracking-tighter leading-none">
              Exam Finder
            </h1>
            <p className="mt-4 font-mono text-sm opacity-70 max-w-md">
              Access the official March 2026 End Semester examination timetable. Search by course name or module code.
            </p>
          </div>
          
          <div className="flex flex-col gap-4 items-end">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowRemindersPortal(true)}
                className="relative p-2 border border-[#141414] rounded-full hover:bg-[#141414] hover:text-[#E4E3E0] transition-all group"
              >
                {reminders.length > 0 ? <BellRing className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                {reminders.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[8px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-[#E4E3E0]">
                    {reminders.length}
                  </span>
                )}
              </button>
              <button 
                onClick={() => {
                  if (!showFullTimetable) {
                    setLoadingTimetable(true);
                    setTimeout(() => setLoadingTimetable(false), 800);
                  }
                  setShowFullTimetable(!showFullTimetable);
                }}
                className="flex items-center gap-2 px-4 py-2 border border-[#141414] rounded-full text-xs font-mono uppercase hover:bg-[#141414] hover:text-[#E4E3E0] transition-all"
              >
                {showFullTimetable ? <X className="w-3 h-3" /> : <List className="w-3 h-3" />}
                {showFullTimetable ? "Close Timetable" : "View Full Timetable"}
              </button>
            </div>
            <div className="px-3 py-1 border border-[#141414] rounded-full text-xs font-medium">
              MARCH 2026 EXAMS
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 md:p-10">
        <AnimatePresence mode="wait">
          {!showFullTimetable ? (
            <motion.div
              key="search-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Search Bar */}
              <section className="mb-12 relative" ref={searchRef}>
                <form onSubmit={handleSearch} className="relative group">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => query.length >= 2 && setShowHints(true)}
                    placeholder="Search module code (e.g. IBM114, ACC, Accounting...)"
                    className="w-full bg-transparent border-b-2 border-[#141414] py-4 pr-12 text-2xl md:text-4xl font-serif italic focus:outline-none placeholder:opacity-20 transition-all"
                  />
                  <button 
                    type="submit"
                    disabled={loading}
                    className="absolute right-0 top-1/2 -translate-y-1/2 p-2 hover:scale-110 transition-transform disabled:opacity-30"
                  >
                    {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : <Search className="w-8 h-8" />}
                  </button>
                </form>

                {/* Module Name Preview */}
                <AnimatePresence>
                  {query.trim().length >= 3 && MODULE_NAMES[query.trim().toUpperCase()] && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2 flex items-center gap-2 text-emerald-600 font-mono text-sm font-bold overflow-hidden"
                    >
                      <Info className="w-3.5 h-3.5" />
                      <span>{MODULE_NAMES[query.trim().toUpperCase()]}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Autocomplete Hints */}
                <AnimatePresence>
                  {showHints && hints.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute z-50 left-0 right-0 mt-2 bg-[#E4E3E0] border border-[#141414] shadow-2xl rounded-lg overflow-hidden"
                    >
                      <div className="p-2 text-[10px] font-mono uppercase opacity-40 border-b border-[#141414]/10">Suggested Modules</div>
                      {hints.map((hint, i) => (
                        <button
                          key={hint}
                          onClick={() => handleSearch(hint)}
                          className="w-full text-left px-4 py-3 hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors flex items-center justify-between group"
                        >
                          <span className="font-mono text-lg">{hint}</span>
                          <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>

              {/* Filters Section */}
              {searched && Array.isArray(results) && results.length > 0 && (
                <motion.section 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mb-8 flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6 p-4 border border-[#141414]/10 rounded-lg bg-[#141414]/5"
                >
                  <div className="flex flex-col gap-1.5 w-full sm:w-auto">
                    <label className="text-[10px] font-mono uppercase opacity-50">Exam Type</label>
                    <select 
                      value={examTypeFilter}
                      onChange={(e) => setExamTypeFilter(e.target.value as any)}
                      className="bg-transparent border-b border-[#141414] py-1 text-sm font-mono focus:outline-none cursor-pointer w-full"
                    >
                      <option value="All">All Types</option>
                      <option value="End-Semester">End-Semester</option>
                      <option value="Practical">Practical</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5 w-full sm:w-auto">
                    <label className="text-[10px] font-mono uppercase opacity-50">From Date</label>
                    <input 
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="bg-transparent border-b border-[#141414] py-1 text-sm font-mono focus:outline-none cursor-pointer w-full"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 w-full sm:w-auto">
                    <label className="text-[10px] font-mono uppercase opacity-50">To Date</label>
                    <input 
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="bg-transparent border-b border-[#141414] py-1 text-sm font-mono focus:outline-none cursor-pointer w-full"
                    />
                  </div>

                  <div className="flex items-center justify-between sm:justify-start gap-4 w-full sm:w-auto mt-2 sm:mt-0">
                    <button 
                      onClick={() => {
                        setStartDate('');
                        setEndDate('');
                        setExamTypeFilter('All');
                      }}
                      className="text-[10px] font-mono uppercase opacity-40 hover:opacity-100 transition-opacity underline underline-offset-4"
                    >
                      Reset Filters
                    </button>

                    <div className="sm:ml-auto text-[10px] font-mono uppercase opacity-40">
                      {filteredResults.length} / {Array.isArray(results) ? results.length : 0} results
                    </div>
                  </div>
                </motion.section>
              )}

              {/* Results Section */}
              <section>
                <div className="hidden md:grid grid-cols-5 border-b border-[#141414] pb-2 mb-4 px-4">
                  <div className="text-[11px] font-serif italic uppercase opacity-50 tracking-wider col-span-2">Course</div>
                  <div className="text-[11px] font-serif italic uppercase opacity-50 tracking-wider">Type</div>
                  <div className="text-[11px] font-serif italic uppercase opacity-50 tracking-wider">Schedule</div>
                  <div className="text-[11px] font-serif italic uppercase opacity-50 tracking-wider text-right">Action</div>
                </div>

                <div className="space-y-4 md:space-y-px">
                  <AnimatePresence mode="wait">
                    {loading ? (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="py-20 text-center font-mono opacity-40"
                      >
                        Querying official timetable...
                      </motion.div>
                    ) : filteredResults.length > 0 ? (
                      filteredResults.map((exam, idx) => (
                        <motion.div
                          key={`${exam.courseCode}-${idx}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          whileHover={{ 
                            x: 8,
                            backgroundColor: "#141414",
                            color: "#E4E3E0",
                          }}
                          whileTap={{ scale: 0.995 }}
                          onClick={() => window.open(generateGoogleCalendarUrl(exam), '_blank')}
                          transition={{ 
                            delay: idx * 0.05,
                            x: { type: "spring", stiffness: 300, damping: 20 },
                            backgroundColor: { duration: 0.2 },
                            color: { duration: 0.2 }
                          }}
                          className="group flex flex-col md:grid md:grid-cols-5 md:items-center p-6 md:p-4 border border-[#141414]/10 md:border-0 md:border-b md:border-[#141414]/10 cursor-pointer relative overflow-hidden rounded-xl md:rounded-none bg-white/20 md:bg-transparent gap-4 md:gap-0"
                        >
                          {/* Subtle accent line on hover */}
                          <motion.div 
                            className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 hidden md:block"
                            initial={{ scaleY: 0 }}
                            whileHover={{ scaleY: 1 }}
                            transition={{ duration: 0.2 }}
                          />

                          <div className="md:col-span-2">
                            <div className="font-mono text-[10px] md:text-xs opacity-60 group-hover:opacity-80 mb-1 uppercase tracking-wider">{exam.courseCode}</div>
                            <div className="font-medium text-xl md:text-lg leading-tight">{exam.courseName}</div>
                            <div className="flex items-center gap-1.5 text-xs md:text-[10px] opacity-40 group-hover:opacity-60 mt-2 md:mt-1">
                              <MapPin className="w-3 h-3 md:w-2.5 md:h-2.5" />
                              <span>{exam.venue}</span>
                            </div>
                          </div>
                          
                          <div className="flex md:block">
                            <span className={cn(
                              "text-[10px] font-mono uppercase px-3 md:px-2 py-1 md:py-0.5 border rounded-full transition-colors duration-200",
                              exam.examType === 'Practical' 
                                ? "border-emerald-500/50 text-emerald-600 group-hover:text-emerald-300 group-hover:border-emerald-300/50" 
                                : "border-[#141414]/30 text-[#141414]/70 group-hover:border-white/30 group-hover:text-white/70"
                            )}>
                              {exam.examType}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 md:block gap-4 py-3 md:py-0 border-y border-[#141414]/5 md:border-0">
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="w-4 h-4 md:w-3.5 md:h-3.5 opacity-50 transition-opacity group-hover:opacity-80" />
                              <span className="font-mono">{new Date(exam.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="w-4 h-4 md:w-3.5 md:h-3.5 opacity-50 transition-opacity group-hover:opacity-80" />
                              <span className="font-mono">{exam.time}</span>
                            </div>
                          </div>

                          <div className="flex flex-row md:flex-row items-center md:justify-end gap-2 mt-2 md:mt-0">
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={(e) => toggleReminder(e, exam)}
                              className={cn(
                                "flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 md:py-1.5 border rounded-md text-[10px] font-mono uppercase transition-all shadow-sm hover:shadow-md",
                                reminders.some(r => r.courseCode === exam.courseCode && r.date === exam.date)
                                  ? "bg-emerald-500 border-emerald-500 text-white"
                                  : "border-[#141414] group-hover:border-[#E4E3E0] hover:bg-[#E4E3E0] hover:text-[#141414]"
                              )}
                            >
                              {reminders.some(r => r.courseCode === exam.courseCode && r.date === exam.date) ? <BellRing className="w-3 h-3" /> : <Bell className="w-3 h-3" />}
                              <span className="md:hidden lg:inline">{reminders.some(r => r.courseCode === exam.courseCode && r.date === exam.date) ? "Reminder Set" : "Set Reminder"}</span>
                              <span className="hidden md:inline lg:hidden">{reminders.some(r => r.courseCode === exam.courseCode && r.date === exam.date) ? "Set" : "Remind"}</span>
                            </motion.div>
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 md:py-1.5 border border-[#141414] group-hover:border-[#E4E3E0] rounded-md text-[10px] font-mono uppercase hover:bg-[#E4E3E0] hover:text-[#141414] transition-all shadow-sm hover:shadow-md"
                            >
                              <CalendarPlus className="w-3 h-3" />
                              <span className="md:hidden lg:inline">Add to Calendar</span>
                              <span className="hidden md:inline lg:hidden">Calendar</span>
                            </motion.div>
                          </div>
                        </motion.div>
                      ))
                    ) : searched ? (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="py-20 text-center font-mono opacity-40"
                      >
                        No courses found matching your search.
                      </motion.div>
                    ) : (
                      <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 opacity-30">
                        <Info className="w-12 h-12" />
                        <p className="font-mono text-sm max-w-xs">
                          Enter a module code (e.g., IBM114) to see the official exam schedule.
                        </p>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </section>
            </motion.div>
          ) : (
            <motion.div
              key="full-timetable-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              <div className="flex items-center justify-between border-b border-[#141414] pb-4">
                <h2 className="text-3xl font-serif italic">Full Examination Schedule</h2>
                <div className="text-[10px] font-mono uppercase opacity-50">March 2026 Session</div>
              </div>

              <AnimatePresence mode="wait">
                {loadingTimetable ? (
                  <motion.div
                    key="timetable-loader"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="py-32 flex flex-col items-center justify-center gap-4 text-[#141414]/40"
                  >
                    <Loader2 className="w-10 h-10 animate-spin" />
                    <span className="font-mono text-sm uppercase tracking-widest">Loading timetable...</span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="timetable-content"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid grid-cols-1 gap-12"
                  >
                    {/* Practical Section */}
                    <div>
                      <h3 className="text-xs font-mono uppercase tracking-widest opacity-40 mb-6 border-l-2 border-emerald-500 pl-4">Practical Examinations</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {FULL_TIMETABLE.filter(e => e.type === 'Practical').map((entry, idx) => (
                          <motion.div 
                            key={idx} 
                            whileHover={{ y: -4 }}
                            className="bg-[#141414]/5 border border-[#141414]/10 p-6 flex flex-col gap-4 rounded-xl hover:border-[#141414]/30 transition-all"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="text-[10px] font-mono uppercase opacity-50 mb-1">{entry.day}</div>
                                <div className="text-xl font-serif italic">{new Date(entry.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>
                              </div>
                              <div className={cn(
                                "text-[9px] font-mono uppercase px-2 py-1 border rounded-full",
                                entry.session === 'Morning' ? "bg-white/50 border-blue-500/20 text-blue-700" : "bg-white/50 border-orange-500/20 text-orange-700"
                              )}>
                                {entry.session}
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2 pt-2 border-t border-[#141414]/5">
                              {entry.modules.map(mod => (
                                <button 
                                  key={mod} 
                                  onClick={() => handleSearch(mod)}
                                  className="px-3 py-1.5 bg-[#141414] text-[#E4E3E0] text-[11px] font-mono rounded-md shadow-sm hover:bg-emerald-600 transition-colors"
                                >
                                  {mod}
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Theory Section Divider */}
                    <div className="h-px bg-[#141414]/10 my-8" />

                    {/* Theory Section */}
                    <div>
                      <h3 className="text-xs font-mono uppercase tracking-widest opacity-40 mb-8 border-l-2 border-[#141414] pl-4">Theory Examinations</h3>
                      <div className="space-y-12">
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(dayName => {
                          const dayEntries = FULL_TIMETABLE.filter(e => e.type === 'Theory' && e.day === dayName);
                          if (dayEntries.length === 0) return null;
                          
                          return (
                            <div key={dayName} className="grid grid-cols-1 md:grid-cols-12 gap-8 group">
                              <div className="md:col-span-3 border-r border-[#141414]/5 pr-6">
                                <div className="sticky top-10">
                                  <div className="text-3xl font-serif italic leading-none mb-2 group-hover:text-emerald-700 transition-colors">{dayName}</div>
                                  <div className="text-sm font-mono opacity-40 uppercase tracking-tighter">
                                    {new Date(dayEntries[0].date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                                  </div>
                                </div>
                              </div>
                              <div className="md:col-span-9 grid grid-cols-1 md:grid-cols-2 gap-8">
                                {['Morning', 'Afternoon'].map(sessionType => {
                                  const sessionEntry = dayEntries.find(e => e.session === sessionType);
                                  if (!sessionEntry) return <div key={sessionType} className="hidden md:block" />;
                                  
                                  return (
                                    <div key={sessionType} className="p-6 rounded-2xl bg-white/30 border border-[#141414]/5 hover:border-[#141414]/20 transition-all">
                                      <div className="flex items-center gap-3 mb-6">
                                        <div className={cn(
                                          "w-2 h-2 rounded-full",
                                          sessionType === 'Morning' ? "bg-blue-500" : "bg-orange-500"
                                        )} />
                                        <div className="text-[10px] font-mono uppercase tracking-widest opacity-60">
                                          {sessionType} Session
                                        </div>
                                        <div className="ml-auto text-[10px] font-mono opacity-40">
                                          {sessionType === 'Morning' ? '09:00 - 12:00' : '13:00 - 16:00'}
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {sessionEntry.modules.map(mod => (
                                          <motion.button 
                                            key={mod} 
                                            whileHover={{ scale: 1.05 }}
                                            onClick={() => handleSearch(mod)}
                                            className="px-2 py-2 border border-[#141414]/10 text-[11px] font-mono rounded-lg text-center bg-white/50 hover:bg-[#141414] hover:text-[#E4E3E0] hover:border-[#141414] transition-all shadow-sm"
                                          >
                                            {mod}
                                          </motion.button>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Calendar Overview Section */}
        {!showFullTimetable && (
          <section className="mt-24 pt-12 border-t border-[#141414]">
            <h2 className="text-2xl font-serif italic mb-8">Official Exam Windows</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-6 border border-[#141414] rounded-lg">
                <div className="text-[10px] font-mono uppercase opacity-50 mb-2">Practical Exams</div>
                <div className="text-xl font-medium mb-1">End Semester</div>
                <div className="font-mono text-sm">March 09 — 13, 2026</div>
              </div>
              <div className="p-6 border border-[#141414] rounded-lg">
                <div className="text-[10px] font-mono uppercase opacity-50 mb-2">Theory Exams</div>
                <div className="text-xl font-medium mb-1">End Semester</div>
                <div className="font-mono text-sm">March 16 — 20, 2026</div>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="mt-20 border-t border-[#141414] p-10 text-center">
        <div className="font-mono text-[10px] uppercase tracking-widest opacity-40">
          © 2026 Malawi College of Accountancy • Official Exam Timetable Integration
        </div>
      </footer>

      {/* Reminders Portal Overlay */}
      <AnimatePresence>
        {showRemindersPortal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-10 bg-[#141414]/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-[#E4E3E0] w-full max-w-4xl max-h-[80vh] overflow-hidden rounded-3xl shadow-2xl flex flex-col"
            >
              <div className="p-6 md:p-8 border-b border-[#141414]/10 flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-serif italic">Alerts Portal</h2>
                  <p className="text-xs font-mono opacity-50 uppercase tracking-widest mt-1">Your Scheduled Exam Reminders</p>
                </div>
                <button 
                  onClick={() => setShowRemindersPortal(false)}
                  className="p-2 hover:bg-[#141414]/5 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:p-8">
                {reminders.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-20">
                    <Bell className="w-12 h-12 opacity-10 mb-4" />
                    <p className="font-serif italic text-xl opacity-40">No reminders set yet.</p>
                    <p className="text-xs font-mono opacity-30 mt-2">Search for your courses and click "Set Reminder" to track them here.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {reminders.map((exam, idx) => (
                      <motion.div
                        key={`${exam.courseCode}-${idx}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-white/50 border border-[#141414]/10 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-mono bg-[#141414] text-[#E4E3E0] px-2 py-0.5 rounded uppercase tracking-wider">
                              {exam.courseCode}
                            </span>
                            <span className="text-[10px] font-mono opacity-40 uppercase">
                              {exam.examType}
                            </span>
                          </div>
                          <h3 className="text-xl font-medium mb-2">{exam.courseName}</h3>
                          <div className="flex flex-wrap gap-4 text-xs font-mono opacity-60">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3 h-3" />
                              {new Date(exam.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3 h-3" />
                              {exam.time}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3 h-3" />
                              {exam.venue}
                            </div>
                          </div>
                        </div>

                        <div className="md:text-right flex flex-col gap-2">
                          <div className="text-[10px] font-mono uppercase opacity-40 tracking-widest">Countdown</div>
                          <div className="text-2xl font-mono font-bold text-emerald-600 tabular-nums">
                            {calculateCountdown(exam.date, exam.time)}
                          </div>
                          <button 
                            onClick={(e) => toggleReminder(e, exam)}
                            className="text-[10px] font-mono uppercase text-red-600 hover:underline text-left md:text-right mt-2"
                          >
                            Remove Reminder
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-6 bg-[#141414]/5 border-t border-[#141414]/10 text-center">
                <p className="text-[10px] font-mono opacity-40 uppercase tracking-widest">
                  Reminders are stored locally on this device.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
