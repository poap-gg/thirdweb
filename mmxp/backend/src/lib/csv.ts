import Papa from 'papaparse';

export interface CsvAttendee {
  name: string;
  email: string;
  checkedIn: boolean;
}

// Luma exports use varying column names across versions — handle all known variants
const NAME_COLUMNS = ['Name', 'name', 'Full Name', 'full_name', 'Attendee Name', 'attendee_name'];
const EMAIL_COLUMNS = ['Email', 'email', 'Email Address', 'email_address'];
const STATUS_COLUMNS = [
  'Checked In',
  'checked_in',
  'Check-in Status',
  'Checkin Status',
  'status',
  'Status',
  'Approval Status',
  'approval_status',
  'check_in_status',
];

function findColumn(row: Record<string, string>, candidates: string[]): string | undefined {
  return candidates.find((col) => col in row);
}

function parseCheckedIn(value: string | undefined): boolean {
  if (!value) return false;
  const v = value.toLowerCase().trim();
  return v === 'true' || v === 'yes' || v === '1' || v === 'checked in' || v === 'approved';
}

export function parseLumaCsv(csvContent: string): CsvAttendee[] {
  const result = Papa.parse<Record<string, string>>(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
    transform: (v) => v.trim(),
  });

  if (!result.data.length) return [];

  const attendees: CsvAttendee[] = [];

  for (const row of result.data) {
    const nameCol = findColumn(row, NAME_COLUMNS);
    const emailCol = findColumn(row, EMAIL_COLUMNS);
    const statusCol = findColumn(row, STATUS_COLUMNS);

    const name = nameCol ? row[nameCol] : '';
    const email = emailCol ? row[emailCol] : '';
    const checkedIn = parseCheckedIn(statusCol ? row[statusCol] : undefined);

    // Skip rows without a valid email
    if (!email || !email.includes('@')) continue;

    attendees.push({
      name: name || email.split('@')[0],
      email: email.toLowerCase(),
      checkedIn,
    });
  }

  return attendees;
}
