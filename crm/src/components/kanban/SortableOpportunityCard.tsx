import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Opportunity } from '../../lib/types';
import { OpportunityCardView } from './OpportunityCardView';

export function SortableOpportunityCard({
  opportunity,
  onClick,
}: {
  opportunity: Opportunity;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: opportunity.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} onClick={onClick}>
      <OpportunityCardView opportunity={opportunity} />
    </div>
  );
}
