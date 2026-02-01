// Nepali Date (Bikram Sambat) utilities

const nepaliMonths = [
  'बैशाख', 'जेष्ठ', 'आषाढ', 'श्रावण', 'भाद्र', 'आश्विन',
  'कार्तिक', 'मंसिर', 'पौष', 'माघ', 'फाल्गुन', 'चैत्र'
];

const nepaliDays = [
  'आइतबार', 'सोमबार', 'मंगलबार', 'बुधबार', 'बिहिबार', 'शुक्रबार', 'शनिबार'
];

const englishMonths = [
  'Baisakh', 'Jestha', 'Ashadh', 'Shrawan', 'Bhadra', 'Aswin',
  'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra'
];

// Nepali numerals mapping
const nepaliNumerals = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];

// Convert English digits to Nepali numerals
export const toNepaliNumerals = (num: number | string): string => {
  return String(num).replace(/[0-9]/g, (d) => nepaliNumerals[parseInt(d)]);
};

// Convert Nepali numerals back to English digits
export const toEnglishNumerals = (str: string): string => {
  return str.replace(/[०-९]/g, (d) => String(nepaliNumerals.indexOf(d)));
};

// Convert Gregorian to approximate Bikram Sambat (simplified)
// In production, use a proper conversion library
export const toNepaliDate = (date: Date, language: 'en' | 'np' = 'en'): string => {
  // Simplified conversion - in production, use proper BS calendar
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  const dayOfWeek = date.getDay();
  
  // Approximate BS year (BS = AD + 56-57)
  const bsYear = year + 57;
  
  const monthNames = language === 'np' ? nepaliMonths : englishMonths;
  const dayNames = language === 'np' ? nepaliDays : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  // Simplified: using same month index (in production, use proper conversion)
  if (language === 'np') {
    return `${toNepaliNumerals(day)} ${monthNames[month]}, ${toNepaliNumerals(bsYear)} BS (${dayNames[dayOfWeek]})`;
  }
  return `${day} ${monthNames[month]}, ${bsYear} BS (${dayNames[dayOfWeek]})`;
};

export const formatDate = (dateString: string, language: 'en' | 'np' = 'en'): string => {
  const date = new Date(dateString);
  return toNepaliDate(date, language);
};

export const formatCurrency = (amount: number, language: 'en' | 'np' = 'en'): string => {
  const formatted = amount.toLocaleString('en-US');
  if (language === 'np') {
    return `रु. ${toNepaliNumerals(formatted)}`;
  }
  return `Rs. ${formatted}`;
};

// Format number with Nepali numerals when language is Nepali
export const formatNumber = (num: number | string, language: 'en' | 'np' = 'en'): string => {
  const formatted = typeof num === 'number' ? num.toLocaleString('en-US') : num;
  return language === 'np' ? toNepaliNumerals(formatted) : formatted;
};

// Format percentage with Nepali numerals when language is Nepali
export const formatPercentage = (num: number, language: 'en' | 'np' = 'en'): string => {
  const formatted = `${num.toFixed(1)}%`;
  return language === 'np' ? toNepaliNumerals(formatted) : formatted;
};

// Short date format (e.g., "15 Jan" or "१५ जनवरी")
export const formatShortDate = (dateString: string, language: 'en' | 'np' = 'en'): string => {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.getMonth();
  
  const shortMonths = language === 'np' 
    ? ['जन', 'फेब', 'मार्च', 'अप्रिल', 'मे', 'जुन', 'जुलाई', 'अग', 'सेप्ट', 'अक्टो', 'नोभ', 'डिसे']
    : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  if (language === 'np') {
    return `${toNepaliNumerals(day)} ${shortMonths[month]}`;
  }
  return `${day} ${shortMonths[month]}`;
};

