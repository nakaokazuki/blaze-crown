import type { EventSubmissionStatus } from '../../lib/events';

export function statusLabel(status: EventSubmissionStatus | 'none'): string {
  switch (status) {
    case 'approved':
      return '承認済み';
    case 'pending':
      return '審査中';
    case 'rejected':
      return '差し戻し';
    default:
      return '未提出';
  }
}

export function statusClass(status: EventSubmissionStatus | 'none'): string {
  switch (status) {
    case 'approved':
      return 'event-badge event-badge--ok';
    case 'pending':
      return 'event-badge event-badge--wait';
    case 'rejected':
      return 'event-badge event-badge--ng';
    default:
      return 'event-badge event-badge--none';
  }
}