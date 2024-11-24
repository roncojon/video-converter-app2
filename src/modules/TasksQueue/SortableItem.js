import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Component for individual video items
const SortableItem = ({ video, disabled }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: video.id, disabled });
  
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: disabled && !isDragging ? 0.5 : 1,
    };
  
    return (
      <li
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        // className={`bg-base-100 p-4 shadow rounded-lg flex items-center justify-between ${
        //   disabled ? 'pointer-events-none' : ''
        // }`}
        className={`bg-base-100 p-4 shadow rounded-lg flex items-center justify-between ${
          disabled ? 'pointer-events-none' : ''
        } hover:bg-base-200`}
      >
        <div>
          <p className="font-medium">{video.name}</p>
          <p
            className={`badge ${
              video.status === 'converting'
                ? 'badge-accent'
                : video.status === 'converted'
                ? 'badge-success'
                : 'badge-primary'
            }`}
          >
            {video.status}
          </p>
        </div>
        <button
          className="btn btn-sm btn-error"
          onClick={() => {
            document.dispatchEvent(
              new CustomEvent('delete-video', { detail: video.id })
            );
          }}
          disabled={disabled}
        >
          Delete
        </button>
      </li>
    );
  };

  export default SortableItem;