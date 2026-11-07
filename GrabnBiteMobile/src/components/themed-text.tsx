import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts, ThemeColor } from '@/constants/theme';
import { Typography } from '@/constants/designSystem';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'link' | 'linkPrimary' | 'code';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return (
    <Text
      style={[
        { color: theme[themeColor ?? 'text'] },
        type === 'default' && styles.default,
        type === 'title' && styles.title,
        type === 'small' && styles.small,
        type === 'smallBold' && styles.smallBold,
        type === 'subtitle' && styles.subtitle,
        type === 'link' && styles.link,
        type === 'linkPrimary' && styles.linkPrimary,
        type === 'code' && styles.code,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  small: {
    fontSize: Typography.caption,
    lineHeight: 18,
    fontWeight: 500,
  },
  smallBold: {
    fontSize: Typography.caption,
    lineHeight: 18,
    fontWeight: 700,
  },
  default: {
    fontSize: Typography.bodyLarge,
    lineHeight: 22,
    fontWeight: 500,
  },
  title: {
    fontSize: Typography.title,
    fontWeight: 600,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: Typography.heading,
    lineHeight: 28,
    fontWeight: 600,
  },
  link: {
    lineHeight: 22,
    fontSize: Typography.body,
  },
  linkPrimary: {
    lineHeight: 22,
    fontSize: Typography.body,
    color: '#3c87f7',
  },
  code: {
    fontFamily: Fonts.mono,
    fontWeight: Platform.select({ android: 700 }) ?? 500,
    fontSize: 12,
  },
});
