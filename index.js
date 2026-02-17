/**
 * @format
 */
import 'react-native-gesture-handler';
import { LogBox } from 'react-native';

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

// ซ่อน warnings ที่ไม่จำเป็น (เช่น เกี่ยวกับ debugger)
LogBox.ignoreLogs(['Open debugger to view warnings', 'Remote debugger']);

AppRegistry.registerComponent(appName, () => App);