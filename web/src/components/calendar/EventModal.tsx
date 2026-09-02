import { useEffect, useRef, useState } from 'react';
import { Trash2Icon, XIcon } from 'lucide-react';
import { EVENT_COLORS, timeOptions } from './personalCalendarLogic';

export interface EventModalDraft {
  id?: string;
  title: string;
  desc: string;
  start: string;
  end: string;
  color: string;
  startTime: string;
  endTime: string;
}

interface EventModalProps {
  draft: EventModalDraft;
  isEditing: boolean;
  onCancel: () => void;
  onSave: (draft: EventModalDraft) => void;
  onDelete: () => void;
}

const TIME_OPTIONS = timeOptions();

function dayCount(start: string, end: string): number {
  const ms = new Date(`${end}T00:00:00`).getTime() - new Date(`${start}T00:00:00`).getTime();
  return Math.round(ms / 86_400_000) + 1;
}

export function EventModal({ draft: initialDraft, isEditing, onCancel, onSave, onDelete }: EventModalProps) {
  const [draft, setDraft] = useState<EventModalDraft>(initialDraft);
  // Tracks whether the mousedown that led to the current click also started on the backdrop
  // itself — without this, selecting text inside the modal and releasing the drag outside it
  // fires a click on the backdrop (the nearest common ancestor of mousedown/mouseup targets)
  // and would incorrectly close the modal, discarding the in-progress edit.
  const backdropMouseDown = useRef(false);

  useEffect(() => {
    setDraft(initialDraft);
  }, [initialDraft]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !e.isComposing) onCancel();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onCancel]);

  function handleBackdropMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    backdropMouseDown.current = e.target === e.currentTarget;
  }

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget && backdropMouseDown.current) onCancel();
    backdropMouseDown.current = false;
  }

  function handleDateChange(field: 'start' | 'end', value: string) {
    setDraft((prev) => {
      let start = field === 'start' ? value : prev.start;
      let end = field === 'end' ? value : prev.end;
      if (end < start) [start, end] = [end, start];
      return { ...prev, start, end };
    });
  }

  function handleSave() {
    const title = draft.title.trim() || '새 일정';
    let { start, end } = draft;
    if (end < start) [start, end] = [end, start];
    onSave({ ...draft, title, start, end });
  }

  const days = dayCount(draft.start, draft.end);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onMouseDown={handleBackdropMouseDown}
      onClick={handleBackdropClick}
    >
      <div
        className="flex w-full max-w-[640px] overflow-hidden rounded-2xl bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-1 space-y-3 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-[16px] font-bold text-ink">{isEditing ? '일정 수정' : '일정 추가'}</h3>
            <button type="button" onClick={onCancel} className="text-ink-muted hover:text-ink">
              <XIcon size={18} />
            </button>
          </div>

          <div>
            <label className="mb-1 block text-[12px] font-semibold text-ink-secondary">제목</label>
            <input
              type="text"
              value={draft.title}
              onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="제목을 입력하세요"
              autoFocus
              className="w-full rounded-lg border border-hairline bg-surface-sunken px-3 py-2 text-[13px] text-ink outline-none focus:border-ink-secondary"
            />
          </div>

          <div>
            <label className="mb-1 block text-[12px] font-semibold text-ink-secondary">날짜</label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={draft.start}
                onChange={(e) => handleDateChange('start', e.target.value)}
                className="rounded-lg border border-hairline bg-surface-sunken px-3 py-2 text-[13px] text-ink outline-none"
              />
              <span className="text-ink-muted">–</span>
              <input
                type="date"
                value={draft.end}
                onChange={(e) => handleDateChange('end', e.target.value)}
                className="rounded-lg border border-hairline bg-surface-sunken px-3 py-2 text-[13px] text-ink outline-none"
              />
            </div>
            {days > 1 && <p className="mt-1 text-[11px] text-ink-muted">{days}일간</p>}
          </div>

          <div>
            <label className="mb-1 block text-[12px] font-semibold text-ink-secondary">시간</label>
            <div className="flex items-center gap-2">
              <select
                value={draft.startTime}
                onChange={(e) => setDraft((prev) => ({ ...prev, startTime: e.target.value }))}
                className="rounded-lg border border-hairline bg-surface-sunken px-3 py-2 text-[13px] text-ink outline-none"
              >
                {TIME_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <span className="text-ink-muted">–</span>
              <select
                value={draft.endTime}
                onChange={(e) => setDraft((prev) => ({ ...prev, endTime: e.target.value }))}
                className="rounded-lg border border-hairline bg-surface-sunken px-3 py-2 text-[13px] text-ink outline-none"
              >
                {TIME_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[12px] font-semibold text-ink-secondary">색상</label>
            <div className="flex items-center gap-2">
              {EVENT_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  title={c.name}
                  onClick={() => setDraft((prev) => ({ ...prev, color: c.value }))}
                  className={`h-6 w-6 rounded-full transition-transform ${
                    draft.color === c.value ? 'scale-110 ring-2 ring-ink ring-offset-2' : ''
                  }`}
                  style={{ backgroundColor: c.value }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            {isEditing && (
              <button
                type="button"
                onClick={onDelete}
                className="mr-auto flex items-center gap-1 rounded-lg px-3 py-2 text-[13px] font-semibold text-critical hover:bg-critical/10"
              >
                <Trash2Icon size={14} />
                삭제
              </button>
            )}
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg px-3 py-2 text-[13px] font-semibold text-ink-secondary hover:bg-surface-sunken"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="rounded-lg bg-primary px-4 py-2 text-[13px] font-semibold text-page hover:opacity-90"
            >
              저장
            </button>
          </div>
        </div>

        <div className="w-[220px] border-l border-hairline bg-surface-sunken p-6">
          <label className="mb-2 block text-[12px] font-semibold text-ink-secondary">내용</label>
          <textarea
            value={draft.desc}
            onChange={(e) => setDraft((prev) => ({ ...prev, desc: e.target.value }))}
            placeholder="회의/미팅 관련 내용을 자유롭게 정리해두세요"
            className="h-full min-h-[220px] w-full resize-y rounded-lg border border-hairline bg-surface p-3 text-[13px] text-ink outline-none"
          />
        </div>
      </div>
    </div>
  );
}
