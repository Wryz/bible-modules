import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createStackNavigator} from '@react-navigation/stack';
import {HomeScreen} from '../screens/HomeScreen';
import {BibleScreen} from '../screens/BibleScreen';
import {SettingsScreen} from '../screens/SettingsScreen';
import {HomeIcon} from '../components/icons/HomeIcon';
import {BibleIcon} from '../components/icons/BibleIcon';
import {SettingsIcon} from '../components/icons/SettingsIcon';
import {useTheme} from '../theme/useTheme';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const HomeStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="HomeMain"
      component={HomeScreen}
      options={{headerShown: false}}
    />
  </Stack.Navigator>
);

const BibleStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="BibleMain"
      component={BibleScreen}
      options={{headerShown: false}}
    />
  </Stack.Navigator>
);

const SettingsStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="SettingsMain"
      component={SettingsScreen}
      options={{headerShown: false}}
    />
  </Stack.Navigator>
);

export const AppNavigator: React.FC = () => {
  const theme = useTheme();

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: theme.colors.tabBarActive,
          tabBarInactiveTintColor: theme.colors.tabBarInactive,
          tabBarStyle: {
            backgroundColor: theme.colors.tabBarBackground,
            borderTopColor: theme.colors.border,
          },
          headerShown: false,
        }}>
        <Tab.Screen
          name="Home"
          component={HomeStack}
          options={{
            tabBarIcon: ({focused}) => <HomeIcon focused={focused} />,
          }}
        />
        <Tab.Screen
          name="Bible"
          component={BibleStack}
          options={{
            tabBarIcon: ({focused}) => <BibleIcon focused={focused} />,
          }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsStack}
          options={{
            tabBarIcon: ({focused}) => <SettingsIcon focused={focused} />,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};
