import React from 'react';
import { AppRegistry } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// 導入我們即將創建的畫面
import HomeScreen from './src/screens/HomeScreen';
// 其他畫面將在後續步驟中創建

const Stack = createStackNavigator();

const App = () => {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#111827',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{
              title: 'れなち的VSPO中文精華收集處',
            }}
          />
          {/* 其他畫面將在後續步驟中添加 */}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

AppRegistry.registerComponent('VspoClipCollector', () => App);

export default App;