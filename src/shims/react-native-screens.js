// Web shim: replaces react-native-screens so no native modules are registered on web.
import { View } from 'react-native';
import React from 'react';

export const enableScreens = () => {};
export const screensEnabled = () => false;
export const isNativeStackAvailable = () => false;

export const Screen = View;
export const ScreenContainer = View;
export const InnerScreen = View;
export const NativeScreen = View;
export const NativeScreenContainer = View;
export const ScreenStack = View;
export const NativeScreenStack = View;
export const FullWindowOverlay = View;
export const ScreenStackHeaderConfig = () => null;
export const GestureDetectorProvider = ({ children }) => children;
export const SearchBarCommands = {};
export const ScreenContext = React.createContext(null);
