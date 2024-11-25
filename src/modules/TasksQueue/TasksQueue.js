// src/modules/TasksQueue/TasksQueue.js

import React, { useContext } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import SortableItem from './SortableItem';
import { TasksQueueContext } from '../../contexts/TasksQueueContext';

const TasksQueue = () => {
  const { tasks, updateTask } = useContext(TasksQueueContext);
  const taskIds = Object.keys(tasks);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const reorderedTaskIds = arrayMove(taskIds, taskIds.indexOf(active.id), taskIds.indexOf(over.id));

    // Update the tasks order by recreating the object in the new order
    const reorderedTasks = reorderedTaskIds.reduce((acc, id) => {
      acc[id] = tasks[id];
      return acc;
    }, {});

    updateTask(null, reorderedTasks); // Bulk update tasks
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Video Conversion Queue</h1>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis]}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={taskIds}
          strategy={verticalListSortingStrategy}
        >
          <ul className="space-y-4">
            {taskIds.map((taskId) => (
              <SortableItem
                key={taskId}
                taskId={taskId}
                disabled={
                  tasks[taskId].status === 'converting' || tasks[taskId].status === 'converted'
                }
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default TasksQueue;
