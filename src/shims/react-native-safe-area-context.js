import React, { createContext, useContext } from 'react';
import { View } from 'react-native';

const defaultInsets = { top: 0, right: 0, bottom: 0, left: 0 };
const defaultFrame = { x: 0, y: 0, width: 0, height: 0 };

export const SafeAreaInsetsContext = createContext(defaultInsets);
export const SafeAreaFrameContext = createContext(defaultFrame);

export const SafeAreaProvider = ({ children, style }) => (
  <View style={[{ flex: 1 }, style]}>{children}</View>
);

export const SafeAreaView = ({ children, style, ...props }) => (
  <View style={[{ flex: 1 }, style]} {...props}>{children}</View>
);

export const SafeAreaConsumer = SafeAreaInsetsContext.Consumer;
export const SafeAreaFrameConsumer = SafeAreaFrameContext.Consumer;

export const useSafeAreaInsets = () => useContext(SafeAreaInsetsContext);
export const useSafeAreaFrame = () => useContext(SafeAreaFrameContext);

export const initialWindowMetrics = { insets: defaultInsets, frame: defaultFrame };

export const withSafeAreaInsets = (Component) => (props) => {
  const insets = useSafeAreaInsets();
  return React.createElement(Component, { ...props, insets });
};
