import type { MissionUiStatus } from '../../lib/events';

export function statusLabel(status: MissionUiStatus): string {
  switch (status) {
    case 'approved':
      return '承認済み';
    case 'pending':
      return '審査中';
    case 'rejected':
      return '差し戻し';
    case 'in_progress':
      return '進行中';
    default:
      return '未提出';
  }
}

export function statusClass(status: MissionUiStatus): string {
  switch (status) {
    case 'approved':
      return 'event-badge event-badge--ok';
    case 'pending':
      return 'event-badge event-badge--wait';
    case 'rejected':
      return 'event-badge event-badge--ng';
    case 'in_progress':
      return 'event-badge event-badge--prog';
    default:
      return 'event-badge event-badge--none';
  }
}