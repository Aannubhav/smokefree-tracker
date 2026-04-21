import React from 'react';
import { View } from 'react-native';

export const GestureHandlerRootView = ({ children, style, ...props }) => (
  <View style={[{ flex: 1 }, style]} {...props}>{children}</View>
);
export const gestureHandlerRootHOC = (Component) => Component;
export const Swipeable = View;
export const DrawerLayout = View;
export const TouchableHighlight = View;
export const TouchableNativeFeedback = View;
export const TouchableOpacity = View;
export const TouchableWithoutFeedback = View;
export const NativeViewGestureHandler = View;
export const TapGestureHandler = View;
export const FlingGestureHandler = View;
export const ForceTouchGestureHandler = View;
export const LongPressGestureHandler = View;
export const PanGestureHandler = View;
export const PinchGestureHandler = View;
export const RotationGestureHandler = View;
export const RectButton = View;
export const BorderlessButton = View;
export const BaseButton = View;
export const State = { UNDETERMINED: 0, FAILED: 1, BEGAN: 2, CANCELLED: 3, ACTIVE: 4, END: 5 };
export const Directions = { RIGHT: 1, LEFT: 2, UP: 4, DOWN: 8 };
export const GestureDetector = ({ children }) => children;
export const Gesture = { Tap: () => ({}), Pan: () => ({}), Pinch: () => ({}), Rotation: () => ({}) };
