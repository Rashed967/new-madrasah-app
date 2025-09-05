const singleDigits: { [key: number]: string } = {
  0: 'শূন্য', 1: 'এক', 2: 'দুই', 3: 'তিন', 4: 'চার', 5: 'পাঁচ', 6: 'ছয়', 7: 'সাত', 8: 'আট', 9: 'নয়',
  10: 'দশ', 11: 'এগার', 12: 'বার', 13: 'তের', 14: 'চৌদ্দ', 15: 'পনের', 16: 'ষোল', 17: 'সতের', 18: 'আঠার', 19: 'উনিশ'
};

const tens: { [key: number]: string } = {
  2: 'বিশ', 3: 'ত্রিশ', 4: 'চল্লিশ', 5: 'পঞ্চাশ', 6: 'ষাট', 7: 'সত্তর', 8: 'আশি', 9: 'নব্বই'
};

function convertLessThanHundred(n: number): string {
  if (n < 20) {
    return singleDigits[n] || '';
  }
  const digit = n % 10;
  const ten = Math.floor(n / 10);
  if (digit === 0) {
    return tens[ten] || '';
  }
  return `${tens[ten]} ${singleDigits[digit]}`;
}

export function numberToWordsBn(num: number): string {
  if (num === 0) return 'শূন্য টাকা মাত্র';
  if (num < 0) return `মাইনাস ${numberToWordsBn(Math.abs(num))}`;

  let words = '';
  const numStr = Math.floor(num).toString();
  const len = numStr.length;

  const handleCrore = (n: string): string => {
    if (n.length > 7) {
      const crorePart = n.slice(0, -7);
      const rest = n.slice(-7);
      return `${numberToWordsBn(parseInt(crorePart, 10)).replace(' টাকা মাত্র', '')} কোটি ${numberToWordsBn(parseInt(rest, 10)).replace(' টাকা মাত্র', '')}`;
    }
    return '';
  };
  
  if (len > 7) {
    words = handleCrore(numStr);
  } else if (len > 5) { // Lakhs
    const lakhs = Math.floor(num / 100000);
    const rest = num % 100000;
    words += `${convertLessThanHundred(lakhs)} লক্ষ`;
    if (rest > 0) {
      words += ` ${numberToWordsBn(rest).replace(' টাকা মাত্র', '')}`;
    }
  } else if (len > 3) { // Thousands
    const thousands = Math.floor(num / 1000);
    const rest = num % 1000;
    words += `${convertLessThanHundred(thousands)} হাজার`;
    if (rest > 0) {
      words += ` ${numberToWordsBn(rest).replace(' টাকা মাত্র', '')}`;
    }
  } else if (len > 2) { // Hundreds
    const hundreds = Math.floor(num / 100);
    const rest = num % 100;
    words += `${singleDigits[hundreds]} শত`;
    if (rest > 0) {
      words += ` ${convertLessThanHundred(rest)}`;
    }
  } else {
    words += convertLessThanHundred(num);
  }
  
  // Handle decimal part if any
  const decimalPart = Math.round((num - Math.floor(num)) * 100);
  if (decimalPart > 0) {
      words += ' দশমিক ' + numberToWordsBn(decimalPart).replace(' টাকা মাত্র', '');
  }

  return `${words.trim()} টাকা মাত্র`;
}

export const toBengaliNumber = (num: number | string) => {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/[0-9]/g, (digit) => bengaliDigits[parseInt(digit)]);
};