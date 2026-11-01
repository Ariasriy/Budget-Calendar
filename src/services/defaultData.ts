import { Category, Holiday } from '../types';

export const DEFAULT_EXPENSE_CATEGORIES: Category[] = [
  { id: 'cat-exp-1', categoryName: 'Tagihan', transactionType: 'Pengeluaran', color: '#EF4444', isActive: true, displayOrder: 1 },
  { id: 'cat-exp-2', categoryName: 'Cicilan', transactionType: 'Pengeluaran', color: '#F97316', isActive: true, displayOrder: 2 },
  { id: 'cat-exp-3', categoryName: 'Operasional', transactionType: 'Pengeluaran', color: '#3B82F6', isActive: true, displayOrder: 3 },
  { id: 'cat-exp-4', categoryName: 'Makanan', transactionType: 'Pengeluaran', color: '#10B981', isActive: true, displayOrder: 4 },
  { id: 'cat-exp-5', categoryName: 'Transportasi', transactionType: 'Pengeluaran', color: '#6366F1', isActive: true, displayOrder: 5 },
  { id: 'cat-exp-6', categoryName: 'Perjalanan', transactionType: 'Pengeluaran', color: '#EC4899', isActive: true, displayOrder: 6 },
  { id: 'cat-exp-7', categoryName: 'Procurement', transactionType: 'Pengeluaran', color: '#8B5CF6', isActive: true, displayOrder: 7 },
  { id: 'cat-exp-8', categoryName: 'Project', transactionType: 'Pengeluaran', color: '#06B6D4', isActive: true, displayOrder: 8 },
  { id: 'cat-exp-9', categoryName: 'Maintenance', transactionType: 'Pengeluaran', color: '#F59E0B', isActive: true, displayOrder: 9 },
  { id: 'cat-exp-10', categoryName: 'Training', transactionType: 'Pengeluaran', color: '#14B8A6', isActive: true, displayOrder: 10 },
  { id: 'cat-exp-11', categoryName: 'Kesehatan', transactionType: 'Pengeluaran', color: '#E11D48', isActive: true, displayOrder: 11 },
  { id: 'cat-exp-12', categoryName: 'Pendidikan', transactionType: 'Pengeluaran', color: '#2563EB', isActive: true, displayOrder: 12 },
  { id: 'cat-exp-13', categoryName: 'Hiburan', transactionType: 'Pengeluaran', color: '#A855F7', isActive: true, displayOrder: 13 },
  { id: 'cat-exp-14', categoryName: 'Tabungan', transactionType: 'Pengeluaran', color: '#059669', isActive: true, displayOrder: 14 },
  { id: 'cat-exp-15', categoryName: 'Lainnya', transactionType: 'Pengeluaran', color: '#64748B', isActive: true, displayOrder: 15 },
];

export const DEFAULT_INCOME_CATEGORIES: Category[] = [
  { id: 'cat-inc-1', categoryName: 'Gaji', transactionType: 'Pemasukan', color: '#10B981', isActive: true, displayOrder: 1 },
  { id: 'cat-inc-2', categoryName: 'Bonus', transactionType: 'Pemasukan', color: '#059669', isActive: true, displayOrder: 2 },
  { id: 'cat-inc-3', categoryName: 'Reimbursement', transactionType: 'Pemasukan', color: '#3B82F6', isActive: true, displayOrder: 3 },
  { id: 'cat-inc-4', categoryName: 'Refund', transactionType: 'Pemasukan', color: '#8B5CF6', isActive: true, displayOrder: 4 },
  { id: 'cat-inc-5', categoryName: 'Transfer Masuk', transactionType: 'Pemasukan', color: '#06B6D4', isActive: true, displayOrder: 5 },
  { id: 'cat-inc-6', categoryName: 'Pendapatan Lain', transactionType: 'Pemasukan', color: '#64748B', isActive: true, displayOrder: 6 },
];

export const DEFAULT_HOLIDAYS: Holiday[] = [
  // 2026 Indonesian Holidays & Cuti Bersama
  { id: 'h-2026-01', holidayDate: '2026-01-01', holidayType: 'Libur Nasional', holidayName: 'Tahun Baru 2026 Masehi', year: 2026, source: 'SKB 3 Menteri RI' },
  { id: 'h-2026-02', holidayDate: '2026-01-16', holidayType: 'Libur Nasional', holidayName: 'Isra Mi\'raj Nabi Muhammad SAW', year: 2026, source: 'SKB 3 Menteri RI' },
  { id: 'h-2026-03', holidayDate: '2026-02-16', holidayType: 'Cuti Bersama', holidayName: 'Cuti Bersama Tahun Baru Imlek', year: 2026, source: 'SKB 3 Menteri RI' },
  { id: 'h-2026-04', holidayDate: '2026-02-17', holidayType: 'Libur Nasional', holidayName: 'Tahun Baru Imlek 2577 Kongzili', year: 2026, source: 'SKB 3 Menteri RI' },
  { id: 'h-2026-05', holidayDate: '2026-03-20', holidayType: 'Libur Nasional', holidayName: 'Hari Suci Nyepi Saka 1948', year: 2026, source: 'SKB 3 Menteri RI' },
  { id: 'h-2026-06', holidayDate: '2026-03-20', holidayType: 'Libur Nasional', holidayName: 'Hari Raya Idul Fitri 1447 H (Hari 1)', year: 2026, source: 'SKB 3 Menteri RI' },
  { id: 'h-2026-07', holidayDate: '2026-03-21', holidayType: 'Libur Nasional', holidayName: 'Hari Raya Idul Fitri 1447 H (Hari 2)', year: 2026, source: 'SKB 3 Menteri RI' },
  { id: 'h-2026-08', holidayDate: '2026-03-23', holidayType: 'Cuti Bersama', holidayName: 'Cuti Bersama Hari Raya Idul Fitri', year: 2026, source: 'SKB 3 Menteri RI' },
  { id: 'h-2026-09', holidayDate: '2026-03-24', holidayType: 'Cuti Bersama', holidayName: 'Cuti Bersama Hari Raya Idul Fitri', year: 2026, source: 'SKB 3 Menteri RI' },
  { id: 'h-2026-10', holidayDate: '2026-04-03', holidayType: 'Libur Nasional', holidayName: 'Wafat Yesus Kristus', year: 2026, source: 'SKB 3 Menteri RI' },
  { id: 'h-2026-11', holidayDate: '2026-04-05', holidayType: 'Libur Nasional', holidayName: 'Hari Paskah', year: 2026, source: 'SKB 3 Menteri RI' },
  { id: 'h-2026-12', holidayDate: '2026-05-01', holidayType: 'Libur Nasional', holidayName: 'Hari Buruh Internasional', year: 2026, source: 'SKB 3 Menteri RI' },
  { id: 'h-2026-13', holidayDate: '2026-05-14', holidayType: 'Libur Nasional', holidayName: 'Kenaikan Yesus Kristus', year: 2026, source: 'SKB 3 Menteri RI' },
  { id: 'h-2026-14', holidayDate: '2026-05-15', holidayType: 'Cuti Bersama', holidayName: 'Cuti Bersama Kenaikan Yesus Kristus', year: 2026, source: 'SKB 3 Menteri RI' },
  { id: 'h-2026-15', holidayDate: '2026-05-27', holidayType: 'Libur Nasional', holidayName: 'Hari Raya Idul Adha 1447 H', year: 2026, source: 'SKB 3 Menteri RI' },
  { id: 'h-2026-16', holidayDate: '2026-05-31', holidayType: 'Libur Nasional', holidayName: 'Hari Raya Waisak 2570 BE', year: 2026, source: 'SKB 3 Menteri RI' },
  { id: 'h-2026-17', holidayDate: '2026-06-01', holidayType: 'Libur Nasional', holidayName: 'Hari Lahir Pancasila', year: 2026, source: 'SKB 3 Menteri RI' },
  { id: 'h-2026-18', holidayDate: '2026-06-16', holidayType: 'Libur Nasional', holidayName: 'Tahun Baru Islam 1448 Hijriah', year: 2026, source: 'SKB 3 Menteri RI' },
  { id: 'h-2026-19', holidayDate: '2026-08-17', holidayType: 'Libur Nasional', holidayName: 'Hari Kemerdekaan RI ke-81', year: 2026, source: 'SKB 3 Menteri RI' },
  { id: 'h-2026-20', holidayDate: '2026-08-25', holidayType: 'Libur Nasional', holidayName: 'Maulid Nabi Muhammad SAW', year: 2026, source: 'SKB 3 Menteri RI' },
  { id: 'h-2026-21', holidayDate: '2026-12-25', holidayType: 'Libur Nasional', holidayName: 'Hari Raya Natal', year: 2026, source: 'SKB 3 Menteri RI' },
  { id: 'h-2026-22', holidayDate: '2026-12-26', holidayType: 'Cuti Bersama', holidayName: 'Cuti Bersama Hari Raya Natal', year: 2026, source: 'SKB 3 Menteri RI' },

  // 2027 Holidays
  { id: 'h-2027-01', holidayDate: '2027-01-01', holidayType: 'Libur Nasional', holidayName: 'Tahun Baru 2027 Masehi', year: 2027, source: 'Kalender Nasional RI' },
  { id: 'h-2027-02', holidayDate: '2027-02-06', holidayType: 'Libur Nasional', holidayName: 'Tahun Baru Imlek 2578 Kongzili', year: 2027, source: 'Kalender Nasional RI' },
  { id: 'h-2027-03', holidayDate: '2027-03-09', holidayType: 'Libur Nasional', holidayName: 'Hari Raya Idul Fitri 1448 H', year: 2027, source: 'Kalender Nasional RI' },
  { id: 'h-2027-04', holidayDate: '2027-03-10', holidayType: 'Libur Nasional', holidayName: 'Hari Raya Idul Fitri 1448 H', year: 2027, source: 'Kalender Nasional RI' },
  { id: 'h-2027-05', holidayDate: '2027-03-26', holidayType: 'Libur Nasional', holidayName: 'Wafat Yesus Kristus', year: 2027, source: 'Kalender Nasional RI' },
  { id: 'h-2027-06', holidayDate: '2027-05-01', holidayType: 'Libur Nasional', holidayName: 'Hari Buruh Internasional', year: 2027, source: 'Kalender Nasional RI' },
  { id: 'h-2027-07', holidayDate: '2027-05-06', holidayType: 'Libur Nasional', holidayName: 'Kenaikan Yesus Kristus', year: 2027, source: 'Kalender Nasional RI' },
  { id: 'h-2027-08', holidayDate: '2027-05-16', holidayType: 'Libur Nasional', holidayName: 'Hari Raya Idul Adha 1448 H', year: 2027, source: 'Kalender Nasional RI' },
  { id: 'h-2027-09', holidayDate: '2027-06-01', holidayType: 'Libur Nasional', holidayName: 'Hari Lahir Pancasila', year: 2027, source: 'Kalender Nasional RI' },
  { id: 'h-2027-10', holidayDate: '2027-08-17', holidayType: 'Libur Nasional', holidayName: 'Hari Kemerdekaan RI ke-82', year: 2027, source: 'Kalender Nasional RI' },
  { id: 'h-2027-11', holidayDate: '2027-12-25', holidayType: 'Libur Nasional', holidayName: 'Hari Raya Natal', year: 2027, source: 'Kalender Nasional RI' },
];

export const DEMO_USER_ID = 'user-owner-default';
