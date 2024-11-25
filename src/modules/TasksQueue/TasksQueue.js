// src/modules/TaskQueue/FolderVideoConversion.js

import React, { useState, useEffect } from 'react';
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

const initialVideos = [
  { id: '3', name: 'Video 3.mp4', status: 'converted' },
  { id: '6', name: 'Video 6.mp4', status: 'converted' },
  { id: '1', name: 'Video 1.mp4', status: 'converting' },
  { id: '2', name: 'Video 2.mp4', status: 'pending' },
  { id: '4', name: 'Video 4.mp4', status: 'pending' },
];

// Main queue component
const TasksQueue = () => {
  const [videos, setVideos] = useState(initialVideos);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
  
    if (!over || active.id === over.id) return; // Exit if no valid drop target or nothing changed
  
    setVideos((prev) => {
      // Split videos into groups
      const convertedVideos = prev.filter((video) => video.status === 'converted');
      const convertingVideo = prev.find((video) => video.status === 'converting');
      const pendingVideos = prev.filter((video) => video.status === 'pending');
  
      // Find indices in the pending group
      const oldIndex = pendingVideos.findIndex((video) => video.id === active.id);
      const newIndex = pendingVideos.findIndex((video) => video.id === over.id);
  
      if (oldIndex === -1 || newIndex === -1) return prev; // Only allow dragging pending videos
  
      // Reorder pending videos
      const reorderedPending = arrayMove(pendingVideos, oldIndex, newIndex);
  
      // Rebuild the list: converted first, converting second, reordered pending third
      return [...convertedVideos, convertingVideo, ...reorderedPending];
    });
  };
  

  const handleDelete = (id) => {
    setVideos((prev) => prev.filter((video) => video.id !== id));
  };

  // Listen for delete events
  useEffect(() => {
    const onDelete = (e) => {
      const event = e;
      handleDelete(event.detail);
    };

    document.addEventListener('delete-video', onDelete);

    return () => document.removeEventListener('delete-video', onDelete);
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Video Conversion Queue</h1>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis]} // Restrict dragging to vertical axis
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={videos.map((video) => video.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="space-y-4">
            {videos.map((video) => (
              <SortableItem
                key={video.id}
                video={video}
                disabled={
                  video.status === 'converting' || video.status === 'converted'
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
