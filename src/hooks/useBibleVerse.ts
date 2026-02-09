import {useState, useEffect} from 'react';
import {BibleVerse} from '../types';

export const useBibleVerse = () => {
  const [verse, setVerse] = useState<string>('');
  const [reference, setReference] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // TODO: Replace with actual Bible API call
    // For now, using a sample verse
    const fetchVerse = async () => {
      setLoading(true);
      // Simulate API call
      await new Promise<void>(resolve => setTimeout(() => resolve(), 500));
      
      // Sample verse - replace with actual API integration
      setVerse(
        'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.',
      );
      setReference('John 3:16');
      setLoading(false);
    };

    fetchVerse();
  }, []);

  return {verse, reference, loading};
};
