import { forwardRef } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { font, radius, spacing, useTheme } from '../../constants/theme';
import { Text } from './Text';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
}

/** Frame dolgulu yumuşak köşeli giriş alanı. */
export const Input = forwardRef<TextInput, Props>(function Input(
  { label, error, style, multiline, ...rest },
  ref,
) {
  const { colors } = useTheme();
  return (
    <View style={styles.wrap}>
      {label ? (
        <Text variant="label" tone="tertiary" style={styles.label}>
          {label}
        </Text>
      ) : null}
      <TextInput
        ref={ref}
        placeholderTextColor={colors.textTertiary}
        multiline={multiline}
        style={[
          styles.input,
          {
            backgroundColor: colors.frame,
            color: colors.textPrimary,
            borderColor: error ? colors.accent : 'transparent',
          },
          multiline && styles.multiline,
          style,
        ]}
        {...rest}
      />
      {error ? (
        <Text variant="caption" tone="accent" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { width: '100%' },
  label: { marginBottom: 8, marginLeft: 4 },
  input: {
    borderRadius: radius.button,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    fontFamily: font.regular,
    fontSize: 15,
    borderWidth: 1.5,
  },
  multiline: { minHeight: 120, paddingTop: 14, textAlignVertical: 'top' },
  error: { marginTop: 6, marginLeft: 4 },
});
