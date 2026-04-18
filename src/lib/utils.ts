export function generateLetterNumber(counter: number) {
  const now = new Date();
  const year = now.getFullYear();
  const sequence = counter.toString().padStart(3, '0');
  return `${sequence}/WBW/433.313.02/${year}`;
}

export function formatDateIndo(dateString: string) {
  if (!dateString) return "....................";
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) {
    return "....................";
  }

  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

export function getTodayISODate() {
  return new Date().toISOString().split('T')[0];
}

export function formatRupiah(value: string | number) {
  if (!value) return '';
  const numStr = value.toString().replace(/[^0-9]/g, '');
  if (!numStr) return '';
  return numStr.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
