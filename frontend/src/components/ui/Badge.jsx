import { COLLECTION_STATUS } from '@/utils/constants';

const badgeStyles = {
  [COLLECTION_STATUS.PENDING]:   'badge-pending',
  [COLLECTION_STATUS.COLLECTED]: 'badge-collected',
  [COLLECTION_STATUS.PARTIAL]:   'badge-partial',
};

const badgeLabels = {
  [COLLECTION_STATUS.PENDING]:   'Pending',
  [COLLECTION_STATUS.COLLECTED]: 'Collected',
  [COLLECTION_STATUS.PARTIAL]:   'Partial',
};

export default function Badge({ status, className = '' }) {
  const normalizedStatus = status?.toLowerCase() || 'pending';
  
  return (
    <span className={`badge ${badgeStyles[normalizedStatus] || 'badge-pending'} ${className}`}>
      {badgeLabels[normalizedStatus] || status}
    </span>
  );
}
