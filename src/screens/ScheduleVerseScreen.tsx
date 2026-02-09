import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import {BibleVerse} from '../types';
import {useVerseScheduling} from '../hooks/useVerseScheduling';
import {VerseCard} from '../components/VerseCard';

interface ScheduleVerseScreenProps {
  route: {
    params: {
      verse: BibleVerse;
    };
  };
  navigation: any;
}

export const ScheduleVerseScreen: React.FC<ScheduleVerseScreenProps> = ({
  route,
  navigation,
}) => {
  const {verse} = route.params;
  const {scheduleVerse} = useVerseScheduling();
  const [selectedDate, setSelectedDate] = useState(new Date());

  const handleSchedule = async () => {
    await scheduleVerse(verse, selectedDate);
    navigation.goBack();
  };

  const showDatePicker = () => {
    // Date picker implementation would go here
    // For now, just increment the date by 1 day as a placeholder
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
    // TODO: Implement proper date picker using @react-native-community/datetimepicker
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Verse to Schedule</Text>
        <VerseCard verse={verse} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Schedule For</Text>
        <TouchableOpacity style={styles.dateButton} onPress={showDatePicker}>
          <Text style={styles.dateText}>
            {selectedDate.toLocaleString()}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.scheduleButton} onPress={handleSchedule}>
        <Text style={styles.scheduleButtonText}>Schedule Verse</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#f9f9f9',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  scheduleButton: {
    backgroundColor: '#007AFF',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  scheduleButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
