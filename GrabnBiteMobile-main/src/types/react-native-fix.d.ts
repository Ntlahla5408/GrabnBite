import * as React from 'react';

declare module 'react-native' {
  interface ViewProps {
    key?: React.Key;
  }
  interface PressableProps {
    key?: React.Key;
  }
  interface ScrollViewProps {
    key?: React.Key;
  }
  interface TextProps {
    key?: React.Key;
  }
  interface ImageProps {
    key?: React.Key;
  }
}
