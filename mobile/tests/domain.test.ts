import test from 'node:test';
import assert from 'node:assert/strict';
import { calendarCells, localDate, monthStats, streak, weeklyRecordDays } from '../src/domain';
import type { Entry } from '../src/domain';

const entry = (date: string, mood: Entry['primaryEmotion'] = '평온'): Entry => ({ id: date + mood, localDate: date, createdAt: date + 'T10:00:00Z', text: '오늘의 마음', primaryEmotion: mood, secondaryEmotions: [], message: '괜찮아요', musicMood: '편안함', tracks: [], source: 'demo' });
test('달력은 실제 요일부터 시작하고 윤년의 29일을 포함한다', () => {
  const cells = calendarCells(2024, 1);
  assert.equal(cells[0], null); assert.equal(cells[4], 1);
  assert.equal(cells.filter(Boolean).length, 29); assert.equal(cells.length % 7, 0);
});
test('월간 집계는 선택한 달의 각 기록을 한 번씩 집계한다', () => {
  const result = monthStats([entry('2026-10-31', '불안'), entry('2026-11-01', '기쁨'), entry('2026-11-01', '기쁨'), entry('2026-11-02', '슬픔')], '2026-11');
  assert.equal(result.find(x => x.mood === '기쁨')?.count, 2);
  assert.equal(result.reduce((n, x) => n + x.count, 0), 3);
  assert.ok(Math.abs(result.reduce((n, x) => n + x.fraction, 0) - 1) < 1e-10);
});
test('기록 없는 달의 비율은 NaN이 아닌 0이다', () => {
  assert.ok(monthStats([], '2026-11').every(x => x.fraction === 0));
});
test('연속 기록은 같은 날 여러 건을 중복 계산하지 않고 연도 경계를 처리한다', () => {
  assert.equal(streak([entry('2025-12-30'), entry('2025-12-31'), entry('2025-12-31', '기쁨'), entry('2026-01-01')], new Date(2026, 0, 1)), 3);
});
test('오늘 기록 전에는 어제까지의 연속 기록을 표시하고 공백이 있으면 끊긴다', () => {
  assert.equal(streak([entry('2026-11-03'), entry('2026-11-04')], new Date(2026, 10, 5)), 2);
  assert.equal(streak([entry('2026-11-03')], new Date(2026, 10, 5)), 0);
});
test('기록 날짜는 UTC 변환 없이 기기 달력 날짜를 사용한다', () => {
  assert.equal(localDate(new Date(2026, 0, 2, 0, 1)), '2026-01-02');
});

test('이번 주 기록 일수는 월요일부터 오늘까지 날짜별로 집계한다', () => {
  const entries = [entry('2026-11-01'), entry('2026-11-02'), entry('2026-11-02', '기쁨'), entry('2026-11-06'), entry('2026-11-07')];
  assert.equal(weeklyRecordDays(entries, new Date(2026, 10, 6)), 2);
  assert.equal(weeklyRecordDays(entries, new Date(2026, 10, 8)), 3);
  assert.equal(weeklyRecordDays([], new Date(2026, 10, 6)), 0);
  assert.equal(weeklyRecordDays([entry('2025-12-28'), entry('2025-12-29'), entry('2026-01-01')], new Date(2026, 0, 1)), 2);
});
