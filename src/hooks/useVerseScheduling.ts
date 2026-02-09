import {useState, useEffect} from 'react';
import {BibleVerse, ScheduledVerse} from '../types';
import {SchedulingService} from '../services/schedulingService';
import {StorageService} from '../services/storage';

export const useVerseScheduling = () => {
  const [scheduledVerses, setScheduledVerses] = useState<ScheduledVerse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadScheduledVerses();
  }, []);

  const loadScheduledVerses = async () => {
    setLoading(true);
    const verses = await StorageService.getScheduledVerses();
    setScheduledVerses(verses);
    setLoading(false);
  };

  const scheduleVerse = async (
    verse: BibleVerse,
    scheduledFor: Date,
    collectionId?: string,
  ) => {
    const scheduledVerse: ScheduledVerse = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      verse,
      scheduledFor,
      collectionId,
    };
    await SchedulingService.scheduleVerseForWidget(scheduledVerse);
    await loadScheduledVerses();
  };

  const removeScheduledVerse = async (id: string) => {
    await StorageService.removeScheduledVerse(id);
    await loadScheduledVerses();
  };

  return {
    scheduledVerses,
    loading,
    scheduleVerse,
    removeScheduledVerse,
    refresh: loadScheduledVerses,
  };
};
